from knox.models import AuthToken
from knox.auth import TokenAuthentication
from rest_framework import generics
from .serializers import UserSerializer,RegisterSerializer,LoginSerializer,DonationSerializer,ProfileSerializer,DonationHistorySerializer,DonorSerializer,RecipientSerializer,AvailabilitySerializer,TopUserSerializer
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from django.utils.timezone import localtime
import io
from django.utils import timezone
from django.shortcuts import redirect
from rest_framework.throttling import UserRateThrottle
import pandas as pd
from django.db.models import Sum, F,Count, Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from .models import Donor,Recipient,DonationMatch,Donation,Availability
from rest_framework import status
from knox.views import LogoutView as KnoxLogoutView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
import json
# For sending messages from sync code
from asgiref.sync import async_to_sync 
from channels.layers import get_channel_layer 
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.utils.http import http_date
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
import logging
from .constants import TIME_RANGES
from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
# from django.conf import settings
from geopy.distance import geodesic
from rest_framework.exceptions import NotFound
from .matching import get_matching_models
from .utils import notify_donor_and_recipients_of_deletion
from django.contrib.auth.tokens import PasswordResetTokenGenerator
# import io
# from django.utils.timezone import localtime
# from django.http import HttpResponse
# from reportlab.lib.pagesizes import A4
# from reportlab.lib.units import inch
# from reportlab.lib import colors
# from reportlab.platypus import Table, TableStyle, SimpleDocTemplate, Paragraph, Spacer
# from reportlab.lib.styles import getSampleStyleSheet

logger = logging.getLogger(__name__)
User = get_user_model()
token_generator = PasswordResetTokenGenerator()

# Create your views here.

# greedy algorithm for distances
def is_nearby(d_lat, d_lng, r_lat, r_lng, max_km=50):
    return geodesic((d_lat, d_lng), (r_lat, r_lng)).km <= max_km


# role based specification
def apply_role(user, role: str):
    if role == 'donor':
        user.is_donor = True
        user.is_recipient = False
    elif role == 'recipient':
        user.is_donor = False
        user.is_recipient = True
    else:
        raise ValueError("Invalid role")
    user.save()


class RequestPasswordResetView(APIView):
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            token = token_generator.make_token(user)
            return Response({
                'reset_token': token,
                'user_id': user.pk
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
class ResetPasswordView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Invalid user ID'}, status=400)

        if not token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired token'}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({'success': 'Password has been reset'})

        

class UserRegistration(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    authentication_classes = [TokenAuthentication]
    def post(self,request,*args,**kwargs):
            # FIRST CHECK : IF USER exists with that email
            email = request.data.get("email", "").lower()
            if User.objects.filter(email=email).exists():
            #  return Response({"error": "User with this email already exists."}, status=400)
             return Response({"error": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

            
            # validating user
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

            # generate tokens
            _,token = AuthToken.objects.create(user)
            expiry = datetime.utcnow() + timedelta(days=7)

            response = Response({
                'msg': 'You\'ve successfully created your account!',
                'user': UserSerializer(user, context=self.get_serializer_context()).data,
                'token': token
            },status=status.HTTP_201_CREATED)

            # setting cookie for authentication
            response.set_cookie(
                key='auth_token',
                value=token,
                expires=http_date(expiry.timestamp()),
                secure=False,       # Set to True in production with HTTPS
                httponly=True,     # Prevent JavaScript access
                samesite='Lax'     # Tweak depending on frontend/backend setup
            )
            return response
    

class UserLogin(generics.GenericAPIView):
   
   serializer_class = LoginSerializer
   authentication_classes = [TokenAuthentication]

   def post(self,request,*args,**kwargs):
       serializer = self.get_serializer(data=request.data)
       serializer.is_valid(raise_exception=True)
        # Retrieve the validated user object from the serializer[validated data to be precise]
       user = serializer.validated_data.get('user')
       _,token = AuthToken.objects.create(user)

       expiry = datetime.utcnow() + timedelta(days=7)  # Example: 7 days
        # Log token and response details
       logger.info(f"Generated Token: {token}")
       response = Response({
            'msg' : 'You\"ve successfully logged into your account!',
            'user': UserSerializer(user,context=self.get_serializer_context()).data,
            'token': token
            },status=status.HTTP_200_OK)
       
       response.set_cookie(
            key='auth_token',
            value=token,
            expires=http_date(expiry.timestamp()),
            secure=True,  # True in production with HTTPS
            httponly=True,  # JavaScript can't access this
            samesite='Lax'  # Adjust based on frontend/backend deployment setup
        )
       logger.info(f"Setting cookie 'auth_token' with value: {token}")
       return response


class UserLogout(KnoxLogoutView):
    authentication_classes = [TokenAuthentication]
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        response.delete_cookie('auth_token')  # 👈 Clear the cookie from client
        return response




def get_ai_scored_donations(recipient, rf_model, le_food, top_n=5):
    """
    Scores available donations for a recipient based on AI model.

    Args:
        recipient (Recipient): The recipient object for whom to find donations.
        rf_model (RandomForestClassifier): The trained Random Forest model.
        top_n (int): The number of top-scoring donations to return.

    Returns:
        list: A list of Donation objects, sorted by match_score, with match_score attached.
    """

    # Normalize recipient's required food types from JSONField (list of strings)
    # Convert to a set for efficient O(1) average-case lookup during iteration
    recipient_food_types_normalized_set = {
        ft.strip().lower() for ft in recipient.required_food_type
    }

    supported_food_classes_set = set(le_food)
    unsupported_foods = [
                food for food in recipient_food_types_normalized_set
                if food not in supported_food_classes_set
            ]
    if unsupported_foods:
                return Response({
                    'error': f"Unsupported food type(s) requested: {', '.join(unsupported_foods)}",
                    'supported_types': sorted(list(supported_food_classes_set)) # Return sorted list for readability
                }, status=400)

    # Prepare Q objects for initial database filtering based on recipient's multiple food types
    # This filters donations where their single food_type is IN the recipient's requested list.
    # Ensure casing matches how food_type is stored in your Donation model.
    # If Donation.food_type is stored capitalized (e.g., 'Beans'), use .capitalize()
    # If stored lowercase, use `list(recipient_food_types_normalized_set)` directly.
    
    # Assuming Donation.food_type is stored with consistent casing (e.g., 'Beans', 'Rice')
    # and recipient_food_types_normalized_set contains lowercase strings.
    # We need to convert the normalized set to the casing expected by the DB filter.
    # db_filter_food_types = [ft.capitalize() for ft in recipient_food_types_normalized_set]
    # db_filter_food_types = list(recipient_food_types_normalized_set)
    db_filter_food_types = list(recipient_food_types_normalized_set) + \
                     [ft.capitalize() for ft in recipient_food_types_normalized_set]

    
    # Exclude donations that have already been matched (DonationMatch exists)
    already_matched_ids = DonationMatch.objects.filter(recipient=recipient).values_list('donation_id', flat=True)

    # Initial filtering of potential donations from the database
    potential_donations = Donation.objects.filter(
        is_claimed=False,
        is_deleted=False,
        quantity__gt=0,
        expiry_date__gte=timezone.now().date(),
        donor__lat__isnull=False,
        donor__lng__isnull=False,
    ).exclude(id__in=already_matched_ids).filter(
        # CRUCIAL DATABASE FILTER: Match if donation's food_type is in the recipient's requested list
        food_type__in=db_filter_food_types
    ).select_related('donor') # Select related donor to avoid N+1 queries later

    scored_donations_with_temp_score = []

    for donation in potential_donations:
        donor = donation.donor

        # 1. Determine food_match (boolean)
        # Check if the donor's single food type (normalized) is in the recipient's normalized set
        donor_food_type_normalized = donation.food_type.strip().lower()
        food_match = donor_food_type_normalized in recipient_food_types_normalized_set

        # If food_match is False, this donation is not relevant for the recipient's food needs
        # (though it should have been caught by the initial DB filter, this is a double-check)
        if not food_match:
            continue

        # 2. Determine quantity_match (boolean)
        # quantity_match = donation.quantity >= recipient.required_quantity
        # quantity_match = donation.quantity > 0
        exact_quantity_match = int(donation.quantity >= recipient.required_quantity)

         # 3. Determine Quantity Ratio Feature
        if recipient.required_quantity > 0:
            quantity_ratio = min(1.0, donation.quantity / recipient.required_quantity)
        else:
            # If required_quantity somehow becomes 0 (should be prevented by validation)
            # Match the logic from your training script for this edge case.
            quantity_ratio = 1.0 if donation.quantity > 0 else 0.0


        # 3. Determine distance
        distance = float('inf')
        if donor.lat is not None and donor.lng is not None and \
           recipient.lat is not None and recipient.lng is not None:
            distance = geodesic(
                (donor.lat, donor.lng),
                (recipient.lat, recipient.lng)
            ).km

        # Filter out if distance is too far (as in your commented code)
        if distance > 50: # Assuming 50km is your threshold
            continue

        # 4. Prepare features for the model
        features = pd.DataFrame([{
            'food_match': int(food_match),        # Convert boolean to int (0 or 1)
            'exact_quantity_match': exact_quantity_match, # New feature
            'quantity_ratio': quantity_ratio, # Convert boolean to int (0 or 1)
            'distance': distance
        }])

        # 5. Make prediction (using predict_proba for a score)
        try:
            # rf_model.predict_proba returns probabilities for both classes [prob_class_0, prob_class_1]
            # We want the probability of class 1 (a match)
            match_probability = rf_model.predict_proba(features)[:, 1][0]
        except ValueError as e:
            # Log error if prediction fails (e.g., feature mismatch)
            print(f"Error during prediction for donation ID {donation.id}: {e}")
            print(f"Features shape: {features.shape}, content: {features}")
            match_probability = 0.0 # Assign a default low score on error

        # Attach the score directly to the Donation object for sorting and serialization
        donation.match_score = match_probability
        scored_donations_with_temp_score.append(donation)

    # Sort the donations by their match_score in descending order
    scored_donations_with_temp_score.sort(key=lambda d: (d.match_score, -d.id), reverse=True)

    # Return only the top_n donations
    return scored_donations_with_temp_score[:top_n]

class Dashboard(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        user = request.user
        role = user.role

        if role == 'donor':
            try:
                donor = Donor.objects.select_related('user').get(user=user)
            except Donor.DoesNotExist:
                raise NotFound("Donor profile not found.")

            donations = Donation.objects.filter(donor=donor).order_by('-created_at')

            matches = DonationMatch.objects.filter(donor=donor,is_claimed=False)\
                .select_related('recipient__user', 'donor__user')\
                .order_by('-created_at')
            
            claimed_matches = DonationMatch.objects.filter(donor=donor, is_claimed=True)

            data = {
                "profile": DonorSerializer(donor).data,
                "uploaded_donations": DonationSerializer(donations, many=True).data,
                "claimed_matches":DonationHistorySerializer(claimed_matches,many=True).data,
                "matches": DonationHistorySerializer(matches, many=True).data,
            }

        elif role == 'recipient':
            try:
                recipient = Recipient.objects.select_related('user').get(user=user)
            except Recipient.DoesNotExist:
                raise NotFound("Recipient profile not found.")

            matches = DonationMatch.objects.filter(
            recipient=recipient,
            is_claimed=False
            ).select_related('recipient__user', 'donor__user', 'donation')\
            .order_by('-created_at')

            rf_model, le_food, _, _ = get_matching_models()
            ai_donations = get_ai_scored_donations(recipient, rf_model, le_food)
            claimed_matches = DonationMatch.objects.filter(recipient=recipient, is_claimed=True)

            data = {
                "profile": RecipientSerializer(recipient).data,
                "available_donations": DonationSerializer(ai_donations, many=True).data,
                "claimed_matches": DonationHistorySerializer(claimed_matches, many=True).data,
                "matches": DonationHistorySerializer(matches, many=True).data,
            }

        else:
            data = {"error": "Invalid role"}

        return Response(data)


class UserProfile(generics.RetrieveAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    def get_object(self):
        return self.request.user
    

class EditProfile(generics.RetrieveUpdateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    def get_object(self):
        return self.request.user
    
    def patch(self, request, *args, **kwargs):
     return self.partial_update(request, *args, **kwargs)


class CreateOrListDonation(generics.ListCreateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = DonationSerializer
    def get(self, request):
        donations = Donation.objects.filter(donor__user=request.user)
        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Get the donor profile for the current user
        try:
            donor = Donor.objects.get(user=request.user)
        except Donor.DoesNotExist:
            return Response({'detail': 'Donor profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = DonationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(donor=donor)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class RetrieveUpdateDestroyDonation(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = DonationSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Perform a soft delete first
        instance.is_deleted = True
        instance.save()
        logger.info(f"Donation ID {instance.id} soft-deleted by donor.")
        try:
            notifications = notify_donor_and_recipients_of_deletion(
                instance, "Removed by donor" 
            )
            channel_layer = get_channel_layer()
            if channel_layer:
                for notification in notifications:
                    async_to_sync(channel_layer.group_send)(
                        notification['group_name'],
                        notification # The dictionary already has 'type', 'message', 'notification_type', 'data'
                    )
            else:
                logger.warning("Channel layer not available. Notifications for donor deletion will not be sent.")
        except Exception as e:
            logger.error(f"Error sending deletion notifications for Donation ID {instance.id}: {e}", exc_info=True)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DonationsMatch(APIView):
    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request):
        rf_model, le_food, _, _ = get_matching_models()
        try:
            user = request.user
            try:
                recipient = user.recipient_profile
            except Recipient.DoesNotExist:
                return Response({'error': 'Recipient profile not found.'}, status=404)

            data = request.data
            recipient_food_types_raw = data.get('recipient_food_type')

            if not recipient_food_types_raw:
                return Response({'error': 'recipient_food_type is required and cannot be empty.'}, status=400)

            if isinstance(recipient_food_types_raw, str):
                try:
                    recipient_food_types = json.loads(recipient_food_types_raw)
                    if not isinstance(recipient_food_types, list):
                        raise ValueError("Decoded JSON is not a list.")
                except (json.JSONDecodeError, ValueError):
                    recipient_food_types = [recipient_food_types_raw]
            elif isinstance(recipient_food_types_raw, list):
                recipient_food_types = recipient_food_types_raw
            else:
                return Response({'error': 'recipient_food_type must be a string or a list of strings.'}, status=400)

            # Normalize recipient food types and convert to a set for efficient lookup
            recipient_food_types_normalized_set = {ft.strip().lower() for ft in recipient_food_types}

            # Validate requested food types against the LabelEncoder's classes
            supported_food_classes_set = set(le_food)
            unsupported_foods = [
                food for food in recipient_food_types_normalized_set
                if food not in supported_food_classes_set
            ]
            if unsupported_foods:
                return Response({
                    'error': f"Unsupported food type(s) requested: {', '.join(unsupported_foods)}",
                    'supported_types': sorted(list(supported_food_classes_set)) # Return sorted list for readability
                }, status=400)

            required_quantity = float(data.get('required_quantity', 0))
            # Validate required_quantity as well
            if not required_quantity > 0:
                return Response({'error': 'required_quantity must be greater than zero.'}, status=400)

            recipient_lat = float(data.get('lat', recipient.lat))
            recipient_lng = float(data.get('lng', recipient.lng))

            # Prepare food types for database query based on common casing in DB
            db_filter_food_types = list(recipient_food_types_normalized_set) + \
                     [ft.capitalize() for ft in recipient_food_types_normalized_set]

            already_matched_ids = DonationMatch.objects.filter(recipient=recipient).values_list('donation_id', flat=True)
            
            donations = Donation.objects.filter(
                is_claimed=False,
                is_deleted=False,
                quantity__gt=0,
                expiry_date__gte=timezone.now().date(),
                donor__lat__isnull=False,
                donor__lng__isnull=False,
            ).exclude(id__in=already_matched_ids).filter(
                food_type__in=db_filter_food_types # Filter by requested food types
            ).select_related('donor')

            if not donations.exists():
                return Response({
                    "matches": [], # Return empty list for consistency
                    "message": "No available donations found at the moment."
                }, status=status.HTTP_200_OK)

            match_inputs, donor_donation_map = [], []

            for donation in donations:
                donor = donation.donor
                donation_food_type_normalized = donation.food_type.strip().lower()
                
                # Check if the donation's food type is within the recipient's requested types
                food_match = int(donation_food_type_normalized in recipient_food_types_normalized_set)

                # Skip if no food match 
                if not food_match:
                    continue


                # quantity_match = int(donation.quantity >= required_quantity)
                # quantity_match = int(donation.quantity > 0)
                exact_quantity_match = int(donation.quantity >= required_quantity)

                # 3. Determine Quantity Ratio Feature
                if required_quantity > 0:
                    quantity_ratio = min(1.0, donation.quantity / required_quantity)
                else:
                    # If required_quantity somehow becomes 0 (should be prevented by validation)
                    quantity_ratio = 1.0 if donation.quantity > 0 else 0.0


                distance_km = float('inf') # Default to infinity if coordinates are missing
                if recipient_lat is not None and recipient_lng is not None and \
                   donor.lat is not None and donor.lng is not None:
                    distance_km = geodesic((recipient_lat, recipient_lng), (donor.lat, donor.lng)).km
                
                # Apply distance filter here as well if needed, e.g., max 50km
                if distance_km > 50:
                    continue


                match_inputs.append({
                    'food_match': food_match,
                    'exact_quantity_match': exact_quantity_match, 
                    'quantity_ratio': quantity_ratio,   
                    'distance': distance_km,
                })
                donor_donation_map.append((donation, donor))

            if not match_inputs: # No inputs after feature creation/filtering
                 return Response({
                    "matches": [], 
                    "message": "No suitable donations found within the required distance or with valid features."
                }, status=status.HTTP_200_OK)
                # return Response({"message": "No suitable donations found after calculating features."}, status=200)

            df = pd.DataFrame(match_inputs)
            predictions = rf_model.predict(df) # Use predict for binary outcome

            matched_details_for_response = []
            notifications_to_send = []

            channel_layer = get_channel_layer()

            for i, pred in enumerate(predictions):
                if pred == 1: # Model predicts a match
                    donation, donor = donor_donation_map[i]
                    match_input = match_inputs[i]

                    # Deduplication logic
                    existing_match = DonationMatch.objects.filter(
                        donor=donor,
                        recipient=recipient,
                        donation=donation,
                    ).first()

                    if existing_match:
                        logger.info(f"Skipping creation of duplicate match for {donor.user.name} and {recipient.user.name} for {donation.food_type}. Match ID: {existing_match.id}")
                        # Append existing match to response for clarity that it was 'considered'
                        matched_details_for_response.append({
                            'id': existing_match.id,
                            'donor_name': donor.user.name,
                            'recipient_name': recipient.user.name,
                            'food_type': existing_match.food_type,
                            'matched_quantity': existing_match.matched_quantity,
                            'food_description': existing_match.food_description,
                            'expiry_date': existing_match.expiry_date.isoformat(),
                            'is_claimed': existing_match.is_claimed,
                            'is_missed': existing_match.is_missed,
                        })
                        continue

                    WEIGHT_FOOD = 0.35
                    WEIGHT_EXACT_QTY = 0.25 
                    WEIGHT_PARTIAL_QTY = 0.15 # Contribution for any partial fulfillment
                    WEIGHT_DISTANCE = 0.25

        
                    # scaling match score out of 100
                    match_score = int((
                        match_input['food_match'] * WEIGHT_FOOD +
                        match_input['exact_quantity_match'] * WEIGHT_EXACT_QTY +
                        match_input['quantity_ratio'] * WEIGHT_PARTIAL_QTY +
                        max(0, 1 - (match_input['distance'] / 50)) * WEIGHT_DISTANCE
                    ) * 100)

                    # ensure scaling neither negative nor above 100
                    match_score = max(0, min(100,match_score))

                    actual_matched_quantity = min(donation.quantity, required_quantity)

                    new_match = DonationMatch.objects.create(
                        donation=donation,
                        donor=donor,
                        recipient=recipient,
                        food_type=donation.food_type,
                        matched_quantity=actual_matched_quantity,
                        expiry_date=donation.expiry_date,
                        food_description=donation.food_description or f"Auto-matched donation from {donor.user.name}",
                        match_score=match_score,
                    )

                    matched_details_for_response.append({
                        'id': new_match.id, 
                        'donor_name': donor.user.name,
                        'recipient_name': recipient.user.name,
                        'food_type': donation.food_type,
                        'matched_quantity': actual_matched_quantity,
                        'food_description': donation.food_description,
                        'expiry_date': new_match.expiry_date.isoformat(),
                        'is_claimed': new_match.is_claimed,
                        'is_missed': new_match.is_missed,
                    })

                    notifications_to_send.append({
                        'group_name': f'user_{recipient.user.id}',
                        'message_content': {
                            'message': f"Great news! A donation of {donation.food_type} ({donation.quantity}kg) from {donor.user.name} has been matched for you!",
                            'notification_type': 'match_found_recipient',
                            'data': {
                                'match_id': new_match.id,
                                'food_type': donation.food_type,
                                'matched_quantity': actual_matched_quantity,
                                'donor_name': donor.user.name,
                                'food_description': donation.food_description,
                            }
                        }
                    })

                    notifications_to_send.append({
                        'group_name': f'user_{donor.user.id}',
                        'message_content': {
                            'message': f"Your donation of {donation.food_type} ({donation.quantity}kg) has been matched with {recipient.user.name}!",
                            'notification_type': 'match_found_donor',
                            'data': {
                                'match_id': new_match.id,
                                'food_type': donation.food_type,
                                'donated_quantity': donation.quantity,
                                'recipient_name': recipient.user.name,
                                'food_description': donation.food_description,
                            }
                        }
                    })

            for notif in notifications_to_send:
                async_to_sync(channel_layer.group_send)(
                    notif['group_name'],
                    {
                        "type": "send_notification",
                        "message": notif['message_content']['message'],
                        "notification_type": notif['message_content']['notification_type'],
                        "data": notif['message_content']['data']
                    }
                )

            if not matched_details_for_response:
                return Response({'message': 'No suitable donations matched by the AI model.'}, status=200)

            return Response({'matches': matched_details_for_response}, status=200)

        except Exception as e:
            logger.exception("Donation matching failed for user %s: %s", request.user, str(e))
            return Response({'error': 'An unexpected error occurred during matching.'}, status=500)

class ClaimDonationMatchView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, match_id):
        user = request.user
        role = user.role
        if role != 'recipient':
            return Response(
                {"error": "Only recipients can claim donations."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            recipient = Recipient.objects.get(user=user)
        except Recipient.DoesNotExist:
            return Response(
                {"error": "Recipient profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        with transaction.atomic():
            # Get the DonationMatch and lock it to prevent race conditions
            # select_for_update ensures that only one transaction can modify this row at a time
            try:
                # Ensure the recipient is claiming their own unclaimed match
                donation_match = DonationMatch.objects.select_for_update().get(
                    id=match_id,
                    recipient=recipient, 
                    is_claimed=False 
                )
            except DonationMatch.DoesNotExist:
                return Response(
                    {"error": "Donation match not found or already claimed."},
                    status=status.HTTP_404_NOT_FOUND
                )

            donation = donation_match.donation

            # Check if the related donation has already been claimed
            if donation.is_claimed:
                return Response(
                    {"error": "This donation has already been claimed by another recipient."},
                    status=status.HTTP_409_CONFLICT # Conflict status
                )

            # Mark the specific DonationMatch as claimed
            donation_match.is_claimed = True
            donation_match.save()

            # Mark the original Donation as claimed
            donation.is_claimed = True
            donation.save()

            # Invalidate claimed donation for others and delete
            # DonationMatch.objects.filter(
            #     donation=donation,
            #     is_claimed=False
            # ).exclude(id=donation_match.id).delete()

            # Invalidate claimed donations for others but track as missed in their  history
            DonationMatch.objects.filter(
                donation=donation,
                is_claimed=False
            ).exclude(id=donation_match.id).update(is_missed=True)


            return Response(
                {"message": "Donation claimed successfully!",
                 "claimed_match": DonationHistorySerializer(donation_match).data},
                status=status.HTTP_200_OK
            )


# @api_view(['PATCH'])
# @permission_classes([IsAuthenticated])
# def cancel_donation(request, pk):
#     donation = get_object_or_404(Donation, id=pk, donor=request.user.donor_profile)

#     if donation.status not in ['pending', 'accepted']:
#         return Response({'error': 'Only pending or accepted donations can be cancelled.'}, status=400)

#     donation.status = 'unavailable'
#     donation.save()

#     # Update related matches
#     donation.matches.filter(status='pending').update(status='cancelled_by_donor')
#     return Response({'message': 'Donation marked as unavailable and matches cancelled.'})



class DonationOptions(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [UserRateThrottle]
    def get(self, request):

        _, le_food, _, _ = get_matching_models()  # Only need the label encoder for food
        # food_types = list(le_food.classes_)  # Get all known food types from the model
        food_types = le_food  # Get all known food types from the model
        print("Supported food types in view:", food_types)
        return Response({'required_food_types': food_types})


class CityOptions(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [UserRateThrottle]
    def get(self, request):
        _, _ ,cities,_ = get_matching_models()
        # all_cities = list(cities.classes)  # Get all known cities from the model
        print("Supported cities in view:",cities )
        return Response({'cities': cities})


# preview donations for both donor and recipients based on role logged in
class DonationsHistory(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DonationHistorySerializer
    throttle_classes = [UserRateThrottle]

    def get_queryset(self):
        user = self.request.user
        return DonationMatch.objects.filter(
        Q(donor__user=user) | Q(recipient__user=user)
        ).select_related('donor__user', 'recipient__user')


class TopUsers(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        user_role = request.user.role.lower()

        if user_role == 'donor':
            # Aggregate by recipient's user name
            top_recipients_data = DonationMatch.objects.filter(
                # recipient__isnull=False
                donor__user=request.user,
                recipient__isnull=False,
                is_claimed=True
            ).values(
                name=F('recipient__user__name') 
            ).annotate(
                total_quantity_kg=Sum('matched_quantity')
            ).order_by(
                '-total_quantity_kg'
            )[:5]

            serializer = TopUserSerializer(top_recipients_data, many=True)
            return Response({'top_recipients': serializer.data}, status=200)

        elif user_role == 'recipient':
            # Aggregate by donor's user name
            top_donors_data = DonationMatch.objects.filter(
                recipient__user=request.user,
                donor__isnull=False,
                is_claimed=True
            ).values(
                name=F('donor__user__name')
            ).annotate(
                total_quantity_kg=Sum('matched_quantity')
            ).order_by(
                '-total_quantity_kg'
            )[:5]

            serializer = TopUserSerializer(top_donors_data, many=True)
            return Response({'top_donors': serializer.data}, status=200)

        else:
            return Response({'error': 'Invalid user role for top users query.'}, status=400)

    


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def switch_role(request):
    try:
        apply_role(request.user, request.data.get('role'))
        return Response({"message": f"Switched to {request.data.get('role')} role."}, status=200)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)


class TimeRangeOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        formatted = [
            {
                "label": f"{start[:-3]} – {end[:-3]}",
                "from": start,
                "until": end
            }
            for start, end in TIME_RANGES
        ]
        return Response(formatted)


class AvailabilityListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        availabilities = Availability.objects.all()
        serializer = AvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data)
    

class DonationStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        user_role = user.role.lower()
        today = timezone.now().date()

        # Initialize common response fields
        response_data = {
            'role': user_role,
            'total_donations': 0,      
            'donations_today': 0,    
            'total_donors': 0,
            'total_recipients': 0,
            'average_donation': 0.0,  
            'total_platform_received': 0, 
            'platform_received_today': 0,
            'claimed_donations': 0,

        }

        try:
            # --- Global Counts (These are always platform-wide and are counts) ---
            # response_data['total_donors'] = Donor.objects..count()
            # response_data['total_recipients'] = Recipient.objects.count()
            # FILTERED FOR CLAIMED ONLY
            response_data['total_donors'] = Donor.objects.filter(
                donations__is_claimed=True
            ).distinct().count()
            response_data['total_recipients'] = Recipient.objects.filter(
               matches__is_claimed=True
            ).distinct().count()


            # --- Role-Specific Logic to populate generic keys ---
            if user_role == 'donor':
                try:
                    donor_profile = Donor.objects.get(user=user)
                except Donor.DoesNotExist:
                    return Response({"detail": "Donor profile not found for this user."},
                                    status=status.HTTP_404_NOT_FOUND)

                # Total count of donations by THIS donor
                response_data['total_donations'] = Donation.objects.filter(
                    donor=donor_profile
                ).count()

                # Count of donations by THIS donor today
                response_data['donations_today'] = Donation.objects.filter(
                    donor=donor_profile,
                    created_at__date=today
                ).count()

                # total count of claimed donations
                response_data['claimed_donations'] = Donation.objects.filter(
                    donor=donor_profile,
                    is_claimed=True    
                ).count()

                # Average quantity per donation by THIS donor (still quantity)
                avg_donated_by_donor_agg = Donation.objects.filter(
                    donor=donor_profile,
                    is_claimed=True
                ).aggregate(avg_quantity=Avg('quantity'))
                response_data['average_donation'] = avg_donated_by_donor_agg['avg_quantity'] or 0.0

            elif user_role == 'recipient':
                try:
                    recipient_profile = Recipient.objects.get(user=user)
                except Recipient.DoesNotExist:
                    return Response({"detail": "Recipient profile not found for this user."},
                                    status=status.HTTP_404_NOT_FOUND)

                # Total count of matches *received* by THIS recipient
                response_data['total_donations'] = DonationMatch.objects.filter( # Using 'total_donations' key for match count
                    recipient=recipient_profile
                ).count()

                # Count of matches *received* by THIS recipient today
                response_data['donations_today'] = DonationMatch.objects.filter( # Using 'donations_today' key for matches today count
                    recipient=recipient_profile,
                    created_at__date=today
                ).count()

                # Count of claimed matches 
                response_data['claimed_donations'] = DonationMatch.objects.filter( 
                    recipient=recipient_profile,
                    is_claimed=True
                ).count()

                # Average quantity per match for THIS recipient (still quantity)
                avg_received_by_recipient_agg = DonationMatch.objects.filter(
                    recipient=recipient_profile,
                    is_claimed=True
                ).aggregate(avg_quantity=Avg('matched_quantity'))
                response_data['average_donation'] = avg_received_by_recipient_agg['avg_quantity'] or 0.0

            elif user_role == 'admin':
                # --- Admin/Platform-Wide Statistics (Overall numbers) ---
                # Total count of donations across ALL donations
                response_data['total_donations'] = Donation.objects.count()

                # Total count of donations today across ALL donations
                response_data['donations_today'] = Donation.objects.filter(
                    created_at__date=today
                ).count()

                # Count of  all claimed donations 
                response_data['claimed_donations'] = Donation.objects.filter( 
                    is_claimed=True
                ).count()

                # Average quantity per donation across ALL donations (still quantity)
                average_donation_agg = Donation.objects.aggregate(avg_quantity=Avg('quantity'))
                response_data['average_donation'] = average_donation_agg['avg_quantity'] or 0.0

                # Total count of matches across ALL matches (explicitly for admin)
                response_data['total_platform_received'] = DonationMatch.objects.count()

                # Count of matches today across ALL matches (explicitly for admin)
                response_data['platform_received_today'] = DonationMatch.objects.filter(
                    created_at__date=today
                ).count()

                # Count of all claimed matches 
                response_data['claimed_donations'] = DonationMatch.objects.filter( 
                    is_claimed=True
                ).count()



            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": f"An error occurred while fetching statistics: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# donors print their donation reports to show their contributions
# class GenerateDonationReportView(APIView):
#     authentication_classes = [TokenAuthentication]
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             donor = Donor.objects.get(user=request.user)
#         except Donor.DoesNotExist:
#             return Response({'detail': 'Donor profile not found.'}, status=status.HTTP_400_BAD_REQUEST)

#         donations = Donation.objects.filter(donor=donor, is_claimed=True).select_related('recipient')

#         # if not donations.exists():
#         #     return Response({'detail': 'No claimed donations found for this donor.'}, status=status.HTTP_200_OK)

#         # # Prepare buffer and PDF
#         # buffer = io.BytesIO()
#         # doc = SimpleDocTemplate(buffer, pagesize=A4)
#         # elements = []
#         # styles = getSampleStyleSheet()

#         # # Header
#         # title = Paragraph(f"<b>Kindbite Donation Report</b>", styles['Title'])
#         # donor_info = Paragraph(f"<b>Donor:</b> {request.user.name} ({request.user.email})", styles['Normal'])
#         # date_info = Paragraph(f"<b>Report Date:</b> {datetime.now().strftime('%Y-%m-%d')}", styles['Normal'])
#         # elements.extend([title, Spacer(1, 0.2 * inch), donor_info, date_info, Spacer(1, 0.3 * inch)])

#         # # Summary
#         # total_donations = donations.count()
#         # total_quantity = sum(d.quantity for d in donations if d.quantity)
#         # unique_recipients = len(set(d.recipient_id for d in donations if d.recipient_id))

#         # summary_text = f"""
#         # <b>Summary:</b><br/>
#         # - Total Claimed Donations: {total_donations}<br/>
#         # - Total Quantity Donated: {total_quantity} kg<br/>
#         # - Unique Recipients Helped: {unique_recipients}<br/>
#         # """
#         # elements.append(Paragraph(summary_text, styles['Normal']))
#         # elements.append(Spacer(1, 0.3 * inch))

#         # # Table header
#         # data = [['Date', 'Food Type', 'Quantity', 'Recipient', 'Location', 'Status']]
#         # # data = [['Date', 'Food Type', 'Quantity', 'Recipient', 'Location']]

#         # # Table rows
#         # for donation in donations:
#         #     date = localtime(donation.created_at).strftime('%Y-%m-%d')
#         #     food_type = donation.food_type or 'N/A'
#         #     quantity = f"{donation.quantity} kg" if donation.quantity else 'N/A'
#         #     recipient_name = donation.recipient.user.name if donation.recipient and donation.recipient.user else 'Anonymous'
#         #     location = donation.recipient.city if donation.recipient and donation.recipient.city else 'N/A'
#         #     status = 'Collected' if donation.is_claimed else 'Pending'
#         #     data.append([date, food_type, quantity, recipient_name, location, status])
#         #     # data.append([date, food_type, quantity, recipient_name, location])

#         # # Create and style the table
#         # table = Table(data, colWidths=[1.2*inch]*6)
#         # table.setStyle(TableStyle([
#         #     ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4a90e2")),
#         #     ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
#         #     ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
#         #     ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
#         #     ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
#         #     ('FONTSIZE', (0, 0), (-1, -1), 10),
#         #     ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
#         # ]))
#         # elements.append(table)

#         # # Build PDF
#         # doc.build(elements)
#         # buffer.seek(0)
#         # # return HttpResponse(buffer, content_type='application/pdf')
#         # response = HttpResponse(buffer, content_type='application/pdf')
#         # # naming downloaded attachment
#         # response['Content-Disposition'] = 'attachment; filename="donation_report.pdf"'
#         # return response

#         if not donations.exists():
#             buffer = io.BytesIO()
#             doc = SimpleDocTemplate(buffer, pagesize=A4)
#             styles = getSampleStyleSheet()
            
#             elements = [
#                 Paragraph("FoodBridge Donation Report", styles['Title']),
#                 Spacer(1, 0.2 * inch),
#                 Paragraph(f"Donor: {request.user.name} ({request.user.email})", styles['Normal']),
#                 Spacer(1, 0.2 * inch),
#                 Paragraph("No claimed donations found for this donor yet.", styles['Normal']),
#             ]
            
#             doc.build(elements)
#             buffer.seek(0)

#             response = HttpResponse(buffer, content_type='application/pdf')
#             response['Content-Disposition'] = 'attachment; filename="donation_report.pdf"'
#             return response


