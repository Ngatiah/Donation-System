# from django.utils import timezone
# from .models import Donation
# from celery import shared_task
# import logging

# logger = logging.getLogger(__name__)

# @shared_task
# def cleanup_expired_donations():

#     """
#     Celery task to find and soft-delete expired and unclaimed donations,
#     and notify relevant parties.
#     """
#     today = timezone.now().date()
#     expired_donations = Donation.objects.filter(expiry_date__lt=today, is_claimed=False,is_deleted=False)
    
#     # `delete()` returns a tuple: (number_of_objects_deleted, {app_label.model_name: count})
#     count_deleted, _ = expired_donations.delete()

#     message = f'Celery cleanup task: Successfully deleted {count_deleted} expired and unclaimed donations.'
#     logger.info(message)
#     print(message) # Print to console for Celery worker logs

#     return message


# donations/tasks.py
from django.utils import timezone
from .models import Donation
from celery import shared_task
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .utils import notify_donor_and_recipients_of_deletion

logger = logging.getLogger(__name__)

@shared_task
def cleanup_expired_donations():
    """
    Celery task to find and soft-delete expired and unclaimed donations,
    and notify relevant parties.
    """
    today = timezone.now().date()
    expired_donations = Donation.objects.filter(
        expiry_date__lt=today,
        is_claimed=False,
        is_deleted=False
    )

    deleted_count = 0
    all_notifications_to_send = []
    for donation in list(expired_donations):
        try:
            # Get notifications for this specific expired donation
            notifications_for_this_donation = notify_donor_and_recipients_of_deletion(
                donation, "Expired - removed by system" # Pass the reason for system removal
            )
            all_notifications_to_send.extend(notifications_for_this_donation)

            # Soft delete the donation itself AFTER preparing notifications based on its original state
            donation.is_deleted = True
            donation.save()
            deleted_count += 1
            logger.info(f"Donation ID {donation.id} ({donation.food_type}, {donation.quantity}kg) marked as expired and removed by system.")

        except Exception as e:
            logger.error(f"Error processing expired donation ID {donation.id}: {e}", exc_info=True)

    # Send all collected notifications in one go
    channel_layer = get_channel_layer()
    if channel_layer:
        for notification in all_notifications_to_send:
            try:
                async_to_sync(channel_layer.group_send)(
                    notification['group_name'],
                    notification # The dictionary already has 'type', 'message', 'notification_type', 'data'
                )
            except Exception as e:
                logger.error(f"Error sending notification for group {notification['group_name']}: {e}", exc_info=True)
    else:
        logger.warning("Channel layer not available. Notifications for expired donations will not be sent.")

    message = (
        f'Celery cleanup task completed: '
        f'Successfully marked {deleted_count} expired and unclaimed donations as deleted.'
    )
    logger.info(message)
    print(message)

    return message























    # for donation in list(expired_donations): # Convert to list to avoid queryset re-evaluation during loop
    #     try:
    #         # 1. Notify before actual deletion
    #         notifications = notify_donor_and_recipients_of_deletion(
    #             donation, "Expired - removed by system"
    #         )
    #         notifications_to_send.extend(notifications)

    #         # 2. Soft delete the donation
    #         donation.is_deleted = True
    #         donation.save()
    #         deleted_count += 1
    #         logger.info(f"Donation ID {donation.id} ({donation.food_type}, {donation.quantity}kg) marked as expired and removed by system.")

    #     except Exception as e:
    #         logger.error(f"Error processing expired donation ID {donation.id}: {e}", exc_info=True)
    #         # Continue to next donation even if one fails

    # # 3. Send out all gathered notifications
    # channel_layer = get_channel_layer()
    # if channel_layer:
    #     for notification in notifications_to_send:
    #         try:
    #             async_to_sync(channel_layer.group_send)(
    #                 notification['group_name'],
    #                 {
    #                     "type": "send_notification",
    #                     "message": notification['message'],

    #                     "notification_type": notification['notification_type'],
    #                     "data": notification['data']
    #                 }
    #             )
    #         except Exception as e:
    #             logger.error(f"Error sending notification for group {notification['group_name']}: {e}", exc_info=True)
    # else:
    #     logger.warning("Channel layer not available. Notifications for expired donations will not be sent.")


    # message = (
    #     f'Celery cleanup task completed: '
    #     f'Successfully marked {deleted_count} expired and unclaimed donations as deleted.'
    # )
    # logger.info(message)
    # print(message) # Print to console for Celery worker logs

    # return message