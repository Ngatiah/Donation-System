# FoodBridge/utils.py

import json
import logging
import pandas as pd
from geopy.distance import geodesic
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction

# Assuming these imports are from your actual project structure
from .models import Donation, DonationMatch, Recipient
from .matching import get_matching_models 

logger = logging.getLogger(__name__)

# --- ML Model Loading ---
# Load models once when the module is loaded.
# This ensures efficiency by not reloading on every function call.
# In a larger application, consider a dedicated app startup hook or a singleton pattern
# to ensure these models are loaded exactly once across your application lifecycle.
try:
    rf_model, le_food, _, _ = get_matching_models()
    logger.info("ML models loaded successfully in utils.py.")
except Exception as e:
    logger.error(f"Failed to load ML models in utils.py: {e}", exc_info=True)
    # Consider how to handle this gracefully in production (e.g., raise an exception
    # that prevents server startup if models are critical, or use dummy models).
    rf_model = None # Set to None if loading fails to prevent runtime errors
    le_food = None


def _calculate_match_score(match_input):
    """Calculates the match score based on input features."""
    WEIGHT_FOOD = 0.35
    WEIGHT_EXACT_QTY = 0.25
    WEIGHT_PARTIAL_QTY = 0.15
    WEIGHT_DISTANCE = 0.25

    score = (
        match_input['food_match'] * WEIGHT_FOOD +
        match_input['exact_quantity_match'] * WEIGHT_EXACT_QTY +
        match_input['quantity_ratio'] * WEIGHT_PARTIAL_QTY +
        max(0, 1 - (match_input['distance'] / 50)) * WEIGHT_DISTANCE # Max 50km
    ) * 100
    return max(0, min(100, int(score)))


def re_evaluate_matches_for_donation(updated_donation: Donation):
    """
    Re-evaluates and updates matches for a specific donation after it has been modified.
    This function will:
    1. Handle cases where the donation is deleted or claimed.
    2. Identify and process any existing *pending* matches for this donation (update or invalidate).
    3. Attempt to find new matches for the updated donation across all eligible recipients
       who don't already have an active match for this donation.
    4. Send appropriate notifications for updates, invalidations, or new matches.
    """
    logger.info(f"Starting re-evaluation of matches for Donation ID: {updated_donation.id}")

    if rf_model is None:
        logger.error("ML model not loaded, cannot perform match re-evaluation.")
        return # Exit if model is not available

    channel_layer = get_channel_layer()
    notifications_to_send = []
    created_match_count = 0
    updated_match_count = 0
    invalidated_match_count = 0

    # --- Step 1: Handle Deleted or Fully Claimed Donations ---
    if updated_donation.is_deleted:
        logger.info(f"Donation {updated_donation.id} is deleted. Invalidating all pending matches.")
        # Mark all pending matches as missed/unavailable
        pending_matches_to_invalidate = DonationMatch.objects.filter(
            donation=updated_donation,
            is_claimed=False,
            is_missed=False
        )
        for match in pending_matches_to_invalidate:
            match.is_missed = True
            # match.reason_missed = 'donor_deleted_donation' # Optional for tracking why it was missed
            match.save()
            invalidated_match_count += 1
            # Send notification to recipient about the match becoming unavailable
            notifications_to_send.append({
                'group_name': f"user_{match.recipient.user.id}",
                'message_content': {
                    "type": "send_notification",
                    "message": f"The donation of {updated_donation.food_type} from {updated_donation.donor.user.name} "
                               f"is no longer available as it was removed or became unavailable.",
                    "notification_type": "pending_donation_unavailable",
                    "data": {
                        "donation_id": updated_donation.id,
                        "food_type": updated_donation.food_type,
                        "donor_name": updated_donation.donor.user.name,
                        "match_id": match.id,
                    }
                }
            })
        logger.info(f"Donation {updated_donation.id} deleted. Invalidated {invalidated_match_count} pending matches.")
        return # No further matching if deleted

    if updated_donation.is_claimed:
        logger.info(f"Donation {updated_donation.id} is claimed. Invalidating all *remaining* pending matches.")
        # All pending matches for this donation should now be marked as missed
        DonationMatch.objects.filter(
            donation=updated_donation,
            is_claimed=False,
            is_missed=False
        ).update(is_missed=True)
        # Note: If `is_claimed` was just set to True by an update,
        # the recipient who claimed it would have already received a notification
        # and other potential recipients would ideally be informed when the claim happens.
        logger.info(f"Donation {updated_donation.id} claimed. Invalidated any remaining pending matches.")
        return

    # --- Step 2: Identify and Process Existing Pending Matches for this Donation ---
    # This loop will either UPDATE an existing match's details or mark it as MISSED.
    # It ensures stale data is handled and reduces duplicate matches for the same donor-recipient pair.

    active_pending_matches = DonationMatch.objects.filter(
        donation=updated_donation,
        is_claimed=False,
        is_missed=False
    )
    logger.debug(f"Found {active_pending_matches.count()} active pending matches for Donation {updated_donation.id} before processing.") 

    # Convert to list to avoid "queryset modified during iteration" issues if we save within loop
    for existing_match in list(active_pending_matches):
        recipient = existing_match.recipient
        logger.debug(f"Processing existing match ID: {existing_match.id} for Recipient: {recipient.user.name}") # ADD THIS
        logger.debug(f"  Existing match quantity: {existing_match.matched_quantity}") # ADD THIS
        
        # --- Recalculate match criteria for this existing match ---
        # This determines if the existing match is still valid and how it should be updated.
        donation_food_type_normalized = updated_donation.food_type.strip().lower()
        # For an existing match, we assume the recipient was interested in this food type previously.
        # If food_type itself changed on the donation, this might invalidate the match.
        # For simplicity, we just use the donation's food type for the evaluation.
        recipient_food_types_normalized_set = {donation_food_type_normalized}

        # Determine the required quantity based on recipient's max need or the donation's new quantity
        required_quantity = recipient.max_quantity_needed_per_day if hasattr(recipient, 'max_quantity_needed_per_day') else updated_donation.quantity
        if required_quantity <= 0: # Ensure required_quantity is positive to avoid division by zero
            required_quantity = 1 # Default to 1 to avoid errors, or handle as non-match

        food_match = int(donation_food_type_normalized in recipient_food_types_normalized_set)
        exact_quantity_match = int(updated_donation.quantity >= required_quantity)
        quantity_ratio = min(1.0, updated_donation.quantity / required_quantity) if required_quantity > 0 else 1.0

        distance_km = float('inf')
        if recipient.lat is not None and recipient.lng is not None and \
           updated_donation.donor.lat is not None and updated_donation.donor.lng is not None:
            distance_km = geodesic((recipient.lat, recipient.lng), (updated_donation.donor.lat, updated_donation.donor.lng)).km

        # Apply distance filter - if now outside range, invalidate
        if distance_km > 50:
            existing_match.is_missed = True
            # existing_match.reason_missed = 'distance_changed' # Optional
            existing_match.save()
            invalidated_match_count += 1
            logger.info(f"Existing match {existing_match.id} for Donation {updated_donation.id} and Recipient {recipient.user.name} invalidated (distance too far).")
            # Notify recipient about invalidation
            notifications_to_send.append({
                'group_name': f"user_{recipient.user.id}",
                'message_content': {
                    "type": "send_notification",
                    "message": f"Your pending match for {updated_donation.food_type} from {updated_donation.donor.user.name} "
                               f"is no longer available as the location has changed.",
                    "notification_type": "pending_match_invalidated",
                    "data": {
                        "donation_id": updated_donation.id,
                        "food_type": updated_donation.food_type,
                        "donor_name": updated_donation.donor.user.name,
                        "match_id": existing_match.id,
                    }
                }
            })
            continue # Move to the next existing match

        # Prepare features for ML prediction
        match_input = {
            'food_match': food_match,
            'exact_quantity_match': exact_quantity_match,
            'quantity_ratio': quantity_ratio,
            'distance': distance_km,
        }
        df_features = pd.DataFrame([match_input])
        prediction = rf_model.predict(df_features)[0]
        logger.debug(f"  Match input for existing match {existing_match.id}: {match_input}") # ADD THIS
        logger.debug(f"  Prediction for existing match {existing_match.id}: {prediction}") # ADD THIS


        if prediction == 1: # Still a predicted match, so update it
            new_matched_quantity = min(updated_donation.quantity, required_quantity)
            new_match_score = _calculate_match_score(match_input)
            logger.debug(f"  Calculated new_matched_quantity: {new_matched_quantity}, new_match_score: {new_match_score}")

            # Check if any "match-relevant" details have genuinely changed
            # This avoids unnecessary DB writes and notifications if only non-match fields changed.
            if (existing_match.matched_quantity != new_matched_quantity or
                existing_match.expiry_date != updated_donation.expiry_date or
                existing_match.food_type != updated_donation.food_type or
                existing_match.food_description != updated_donation.food_description or
                existing_match.match_score != new_match_score):

                logger.debug(f"  Changes detected for match {existing_match.id}. Updating...") # ADD THIS
                logger.debug(f"    Old Qty: {existing_match.matched_quantity}, New Qty: {new_matched_quantity}") # ADD THIS
                logger.debug(f"    Old Exp: {existing_match.expiry_date}, New Exp: {updated_donation.expiry_date}") # ADD THIS

                existing_match.matched_quantity = new_matched_quantity
                existing_match.expiry_date = updated_donation.expiry_date
                existing_match.food_type = updated_donation.food_type
                existing_match.food_description = updated_donation.food_description
                existing_match.match_score = new_match_score
                existing_match.save()
                updated_match_count += 1
                logger.info(f"Updated existing match {existing_match.id} for Donation {updated_donation.id} with Recipient {recipient.user.name}.")
                # Send notification about the match being updated (e.g., quantity changed)
                notifications_to_send.append({
                    'group_name': f"user_{recipient.user.id}",
                    'message_content': {
                        "type": "send_notification",
                        "message": f"Your pending match for {updated_donation.food_type} from {updated_donation.donor.user.name} "
                                   f"has been updated! New quantity: {new_matched_quantity}kg. Check details.",
                        "notification_type": "match_updated_recipient",
                        "data": {
                            "donation_id": updated_donation.id,
                            "food_type": updated_donation.food_type,
                            "donor_name": updated_donation.donor.user.name,
                            "match_id": existing_match.id,
                            "matched_quantity": new_matched_quantity,
                        }
                    }
                })
            else:
                logger.info(f"Existing match {existing_match.id} for Donation {updated_donation.id} and Recipient {recipient.user.name} requires no data update.")

        else: # Prediction is 0: No longer a match based on updated criteria
            existing_match.is_missed = True
            # existing_match.reason_missed = 'no_longer_matches_criteria' # Optional
            existing_match.save()
            invalidated_match_count += 1
            logger.info(f"Existing match {existing_match.id} for Donation {updated_donation.id} and Recipient {recipient.user.name} invalidated (no longer a match).")
            # Notify recipient about invalidation
            notifications_to_send.append({
                'group_name': f"user_{recipient.user.id}",
                'message_content': {
                    "type": "send_notification",
                    "message": f"Your pending match for {updated_donation.food_type} from {updated_donation.donor.user.name} "
                               f"is no longer available due to updated donation details.",
                    "notification_type": "pending_match_invalidated",
                    "data": {
                        "donation_id": updated_donation.id,
                        "food_type": updated_donation.food_type,
                        "donor_name": updated_donation.donor.user.name,
                        "match_id": existing_match.id,
                    }
                }
            })


    # --- Step 3: Find New Matches for the Updated Donation ---
    # Now, find recipients who were *not* involved in any existing active matches
    # for this donation, and attempt to create new matches for them.
    # Exclude those whose matches were just updated or invalidated above.
    already_processed_recipient_ids = [m.recipient.id for m in list(active_pending_matches) if m.is_claimed == False] # Get IDs of recipients we've already dealt with for this donation
    
    eligible_recipients_for_new_matches = Recipient.objects.filter(
        user__is_active=True # Filter for active users
    ).exclude(id__in=already_processed_recipient_ids)

    for recipient in eligible_recipients_for_new_matches:
        # Determine recipient's 'desired' food type for this context.
        # This is a simplification; in a real app, recipient might have varied preferences.
        # Here, we assume they are generally open to the donation's food type.
        recipient_food_types_normalized_set = {updated_donation.food_type.strip().lower()}
        required_quantity = recipient.max_quantity_needed_per_day if hasattr(recipient, 'max_quantity_needed_per_day') else updated_donation.quantity
        if required_quantity <= 0:
            required_quantity = 1

        # --- Feature Extraction (reused) ---
        donation_food_type_normalized = updated_donation.food_type.strip().lower()

        food_match = int(donation_food_type_normalized in recipient_food_types_normalized_set)
        if not food_match: # If the recipient doesn't desire this food type, skip
            continue

        exact_quantity_match = int(updated_donation.quantity >= required_quantity)
        quantity_ratio = min(1.0, updated_donation.quantity / required_quantity) if required_quantity > 0 else 1.0

        distance_km = float('inf')
        if recipient.lat is not None and recipient.lng is not None and \
           updated_donation.donor.lat is not None and updated_donation.donor.lng is not None:
            distance_km = geodesic((recipient.lat, recipient.lng), (updated_donation.donor.lat, updated_donation.donor.lng)).km

        if distance_km > 50: # Same distance filter as in DonationsMatch
            continue

        match_input = {
            'food_match': food_match,
            'exact_quantity_match': exact_quantity_match,
            'quantity_ratio': quantity_ratio,
            'distance': distance_km,
        }

        df_features = pd.DataFrame([match_input])
        prediction = rf_model.predict(df_features)[0]

        if prediction == 1: # Model predicts a new match
            with transaction.atomic():
                # Final defensive check against creating duplicates if somehow not excluded
                if DonationMatch.objects.filter(
                    donation=updated_donation, recipient=recipient, is_claimed=False, is_missed=False
                ).exists():
                     logger.warning(f"Attempted to create duplicate match for Donation {updated_donation.id} and Recipient {recipient.user.name}. Skipping.")
                     continue

                actual_matched_quantity = min(updated_donation.quantity, required_quantity)
                new_match = DonationMatch.objects.create(
                    donation=updated_donation,
                    donor=updated_donation.donor,
                    recipient=recipient,
                    food_type=updated_donation.food_type,
                    matched_quantity=actual_matched_quantity,
                    expiry_date=updated_donation.expiry_date,
                    food_description=updated_donation.food_description or f"Auto-matched donation from {updated_donation.donor.user.name}",
                    match_score=_calculate_match_score(match_input),
                )
                created_match_count += 1
                logger.info(f"New match created: ID {new_match.id} for Donation {updated_donation.id} with Recipient {recipient.user.name}")

                # Prepare notifications for new match
                notifications_to_send.append({
                    'group_name': f"user_{recipient.user.id}",
                    'message_content': {
                        "type": "send_notification",
                        "message": f"Great news! A new donation of {updated_donation.food_type} ({actual_matched_quantity}kg) from {updated_donation.donor.user.name} has been matched for you!",
                        "notification_type": "match_found_recipient",
                        "data": {
                            "match_id": new_match.id,
                            "food_type": updated_donation.food_type,
                            "matched_quantity": actual_matched_quantity,
                            "donor_name": updated_donation.donor.user.name,
                            "food_description": updated_donation.food_description,
                        }
                    }
                })

                notifications_to_send.append({
                    'group_name': f"user_{updated_donation.donor.user.id}",
                    'message_content': {
                        "type": "send_notification",
                        "message": f"Your donation of {updated_donation.food_type} ({updated_donation.quantity}kg) has been matched with {recipient.user.name}!",
                        "notification_type": "match_found_donor",
                        "data": {
                            "match_id": new_match.id,
                            "food_type": updated_donation.food_type,
                            "donated_quantity": updated_donation.quantity,
                            "recipient_name": recipient.user.name,
                            "food_description": updated_donation.food_description,
                        }
                    }
                })

    # --- Step 4: Send all collected notifications ---
    for notif in notifications_to_send:
        try:
            async_to_sync(channel_layer.group_send)(
                notif['group_name'],
                {
                    "type": "send_notification",
                    "message": notif['message_content']['message'],
                    "notification_type": notif['message_content']['notification_type'],
                    "data": notif['message_content']['data']
                }
            )
        except Exception as e:
            logger.error(f"Failed to send notification to {notif['group_name']}: {e}", exc_info=True)


    logger.info(
        f"Finished re-evaluation for Donation ID: {updated_donation.id}. "
        f"Updated {updated_match_count} existing matches, "
        f"Created {created_match_count} new matches, "
        f"Invalidated {invalidated_match_count} old matches."
    )


def notify_donor_and_recipients_of_deletion(donation_instance: Donation, deletion_reason: str) -> list:
    """
    Prepares and processes notification data for the donor and affected recipients
    when a donation is removed (soft-deleted) from the system.
    It also updates the status of relevant DonationMatch objects.

    Args:
        donation_instance (Donation): The Donation instance that is being removed.
        deletion_reason (str): A string indicating why the donation was removed
                               (e.g., "Removed by donor", "Expired - removed by system").

    Returns:
        list: A list of dictionaries, where each dictionary contains data
              ready to be sent via `channel_layer.group_send`.
              Each dict includes 'group_name', 'message', 'notification_type', and 'data'.
    """
    notifications_to_send = []

    # 1. Prepare Notification for the Donor
    donor_user = donation_instance.donor.user
    donor_notification_type = "donation_removed_by_system" if deletion_reason == "Expired - removed by system" else "donation_removed_by_donor"

    notifications_to_send.append({
        "group_name": f"user_{donor_user.id}",
        "type": "send_notification", # Corresponds to method in NotificationConsumer
        "message": (
            f"Your donation of {donation_instance.food_type} ({donation_instance.quantity}kg) "
            f"has been removed from the system. Reason: {deletion_reason}."
        ),
        "notification_type": donor_notification_type,
        "data": {
            "donation_id": donation_instance.id,
            "food_type": donation_instance.food_type,
            "quantity": donation_instance.quantity,
            "reason": deletion_reason,
            "is_donor_notification": True
        }
    })
    logger.debug(f"Prepared donor notification for Donation ID {donation_instance.id} (Donor: {donor_user.name}).")


    # 2. Prepare Notifications for Affected Recipients and Update Matches that are unclaimed and not missed
    pending_matches = DonationMatch.objects.filter(
        donation=donation_instance,
        is_claimed=False,
        is_missed=False
    ).select_related('recipient__user')

    for match in pending_matches:
        recipient_user = match.recipient.user
        notifications_to_send.append({
            "group_name": f"user_{recipient_user.id}",
            "type": "send_notification", 
            "message": (
                f"The donation of {donation_instance.food_type} from {donation_instance.donor.user.name} "
                f"is no longer available. Reason: {deletion_reason}."
            ),
            "notification_type": "donation_unavailable", 
            "data": {
                "donation_id": donation_instance.id,
                "food_type": donation_instance.food_type,
                "donor_name": donation_instance.donor.user.name,
                "match_id": match.id,
                "reason": deletion_reason,
                "is_recipient_notification": True
            }
        })
        # Mark the match as missed since the underlying donation is now unavailable
        match.is_missed = True
        match.save() # Persist the change to the match status
        logger.debug(f"Prepared recipient notification for Match ID {match.id} (Recipient: {recipient_user.name}) and marked as missed.")

    return notifications_to_send



# def notify_donor_and_recipients_of_deletion(donation_instance, deletion_reason: str):
#     """
#     Prepares notification data for donor and relevant recipients when a donation is deleted
#     by the system (e.g., expired) or by the donor.
#     Returns a list of dictionaries, each ready to be sent via channel_layer.group_send.
#     """
#     notifications = []

#     # 1. Notify the Donor
#     donor_user = donation_instance.donor.user
#     notifications.append({
#         "group_name": f"user_{donor_user.id}",
#         "message": (
#             f"Your donation of {donation_instance.food_type} ({donation_instance.quantity}kg) "
#             f"has been removed from the system. Reason: {deletion_reason}."
#         ),
#         "notification_type": "donation_removed_by_system" if deletion_reason == "Expired - removed by system" else "donation_removed_by_donor",
#         "data": {
#             "donation_id": donation_instance.id,
#             "food_type": donation_instance.food_type,
#             "quantity": donation_instance.quantity,
#             "reason": deletion_reason,
#             "is_donor_notification": True
#         }
#     })

#     # 2. Notify any affected Recipients
#     # For system removal, we need to notify ALL matched recipients, even if claimed or missed,
#     # as the donation is truly gone/unavailable.
#     # We should also update their match status to 'missed'.
#     affected_matches = DonationMatch.objects.filter(
#         donation=donation_instance,
#         is_claimed=False, # Only update un-claimed matches to missed by deletion
#         is_missed=False   # Only update un-missed matches to missed by deletion
#     )

#     for match in affected_matches:
#         recipient_user = match.recipient.user
#         notifications.append({
#             "group_name": f"user_{recipient_user.id}",
#             "message": (
#                 f"The donation of {donation_instance.food_type} from {donation_instance.donor.user.name} "
#                 f"is no longer available. Reason: {deletion_reason}."
#             ),
#             "notification_type": "donation_unavailable", # General type for any unavailable donation
#             "data": {
#                 "donation_id": donation_instance.id,
#                 "food_type": donation_instance.food_type,
#                 "donor_name": donation_instance.donor.user.name,
#                 "match_id": match.id,
#                 "reason": deletion_reason,
#                 "is_recipient_notification": True
#             }
#         })
#         # Mark recipient match as missed since the donation is gone
#         match.is_missed = True
#         match.save() # Save the change to the match

#     return notifications