from knox.models import AuthToken
from knox.auth import TokenAuthentication
from rest_framework import generics
from .serializers import UserSerializer,RegisterSerializer,LoginSerializer,DonationSerializer,ProfileSerializer,DonationHistorySerializer,DonorSerializer,RecipientSerializer,AvailabilitySerializer,TopUserSerializer
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.throttling import UserRateThrottle
import pandas as pd
from django.db.models import Sum, F
# from django.db import transaction
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
# from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.utils.http import http_date
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
import logging
from .constants import TIME_RANGES
# from django.http import JsonResponse
from rest_framework.decorators import api_view
# import joblib
# import os
from rest_framework.exceptions import NotFound
from django.conf import settings
from geopy.distance import geodesic
from rest_framework.exceptions import NotFound
from .matching import get_matching_models

logger = logging.getLogger(__name__)
User = get_user_model()


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


# Create your views here.
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
    potential_donations = Donation.objects.filter(
        quantity__gt=0,
        expiry_date__gte=timezone.now().date(),
        donor__lat__isnull=False,
        donor__lng__isnull=False
    ).filter(
        Q(food_type__icontains=recipient.required_food_type) |
        Q(food_type__iexact=recipient.required_food_type)
    ).select_related('donor')

    recipient_food_encoded = le_food.transform([recipient.required_food_type.lower()])[0]
    matches = []

    for donation in potential_donations:
        donor = donation.donor
        distance_km = geodesic((recipient.lat, recipient.lng), (donor.lat, donor.lng)).km
        if distance_km > 50:
            continue

        try:
            donation_food_encoded = le_food.transform([donation.food_type.strip().lower()])[0]
        except ValueError:
            continue

        features = pd.DataFrame([{
            'food_match': int(recipient_food_encoded == donation_food_encoded),
            'quantity_match': int(donation.quantity >= recipient.required_quantity),
            'distance': distance_km,
        }])

        score = rf_model.predict_proba(features)[0][1]
        matches.append((score, donation))

    matches.sort(reverse=True)
    # return [donation for score, donation in matches[:top_n]]
    # return [(score, donation) for score, donation in matches[:top_n]]
    return [donation for score, donation in matches[:top_n]]
    # # When extracting, unpack the tuple correctly
    # return [donation for score, id_tie_breaker, donation in matches[:top_n]]


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

            matches = DonationMatch.objects.filter(donor=donor)\
                .select_related('recipient__user', 'donor__user')\
                .order_by('-created_at')

            data = {
                "profile": DonorSerializer(donor).data,
                "uploaded_donations": DonationSerializer(donations, many=True).data,
                "matches": DonationHistorySerializer(matches, many=True).data,
            }

        elif role == 'recipient':
            try:
                recipient = Recipient.objects.select_related('user').get(user=user)
            except Recipient.DoesNotExist:
                raise NotFound("Recipient profile not found.")

            # Matches already made
            matches = DonationMatch.objects.filter(recipient=recipient)\
                .select_related('recipient__user', 'donor__user')\
                .order_by('-created_at')
            
            rf_model, le_food, _, _ = get_matching_models()
            ai_donations = get_ai_scored_donations(recipient, rf_model, le_food)

            data = {
                "profile": RecipientSerializer(recipient).data,
                "available_donations": DonationSerializer(ai_donations, many=True).data,
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
    


# class DonationsMatch(APIView):
#     serializer_class = DonationSerializer # Note: This serializer is not directly used for the response data structure here
#     permission_classes = [IsAuthenticated]
#     throttle_classes = [UserRateThrottle]

#     def post(self, request):
#         rf_model, le_food, _, _ = get_matching_models()
#         try:
#             user = request.user
#             try:
#                 # Assuming 'recipient_profile' is the related_name from User to Recipient model
#                 recipient = user.recipient_profile
#             except Recipient.DoesNotExist:
#                 return Response({'error': 'Recipient profile not found.'}, status=404)

#             data = request.data
#             recipient_food = data.get('recipient_food_type', '').strip().lower()
#             required_quantity = float(data.get('required_quantity', 0))
#             # Fallback to recipient's stored lat/lng if not provided in request
#             recipient_lat = float(data.get('lat', recipient.lat))
#             recipient_lng = float(data.get('lng', recipient.lng))

#             if not recipient_food:
#                 return Response({'error': 'recipient_food_type is required.'}, status=400)
#             if not required_quantity:
#                 return Response({'error': 'required_quantity is required.'}, status=400)

#             try:
#                 # Ensure recipient_food is in a list for transform
#                 recipient_food_encoded = le_food.transform([recipient_food])[0]
#             except ValueError:
#                 return Response({
#                     'error': f"Unsupported food_type: '{recipient_food}'",
#                     'supported_types': list(le_food.classes_)
#                 }, status=400)

#             donations = Donation.objects.filter(
#                 # quantity__gte=required_quantity,
#                 quantity__gte=0,
#                 expiry_date__gte=timezone.now().date(),
#                 donor__city__iexact=recipient.city
#             ).filter(
#                 Q(food_type__icontains=recipient_food) | Q(food_type__iexact=recipient_food)
#             ).select_related('donor__user') # Select related user for donor's name

#             match_inputs, donor_donation_map = [], []

#             for donation in donations:
#                 donor = donation.donor
#                 try:
#                     donation_food_encoded = le_food.transform([donation.food_type.strip().lower()])[0]
#                 except ValueError:
#                     # Skip donations with unknown food types
#                     continue

#                 distance_km = geodesic((recipient_lat, recipient_lng), (donor.lat, donor.lng)).km
#                 food_match = int(recipient_food_encoded == donation_food_encoded)
#                 quantity_match = int(donation.quantity >= required_quantity)

#                 match_inputs.append({
#                     'food_match': food_match,
#                     'quantity_match': quantity_match,
#                     'distance': distance_km,
#                     # 'capped_quantity_ratio': capped_quantity_ratio, 
#                 })
#                 # donor_donation_map.append((donation, donor,capped_quantity_ratio))
#                 donor_donation_map.append((donation, donor))

#             if not match_inputs:
#                 return Response({"message": "No donations currently available for matching based on initial filters."}, status=404)

#             df = pd.DataFrame(match_inputs)
#             predictions = rf_model.predict(df)

#             matched_details_for_response = []
#             notifications_to_send = []

#             # Get the channel layer instance once
#             channel_layer = get_channel_layer()

#             for i, pred in enumerate(predictions):
#                 if pred == 1:
#                     # donation, donor,current_capped_quantity_ratio = donor_donation_map[i]
#                     donation, donor = donor_donation_map[i]

#                     match_input = match_inputs[i] # Get the corresponding match_input

#                     match_score = int((
#                         match_input['food_match'] * 0.4 +
#                         match_input['quantity_match'] * 0.3 +
#                         max(0, 1 - (match_input['distance'] / 50)) * 0.3 # Max distance for score contribution
#                     ) * 100)


#                     # Create the DonationMatch object in the database
#                     DonationMatch.objects.create(
#                         donor=donor,
#                         recipient=recipient,
#                         food_type=donation.food_type,
#                         matched_quantity=required_quantity,
#                         # matched_quantity=min(donation.quantity, required_quantity),
#                         expiry_date=donation.expiry_date,
#                         food_description=donation.food_description or f"Auto-matched donation from {donor.user.name}",
#                         match_score=match_score
#                     ).first()

#                     # if existing_match

#                     # Prepare data for API response (Dashboard display)
#                     matched_details_for_response.append({
#                         'donor_name': donor.user.name,
#                         'recipient_name': recipient.user.name,
#                         'food_type': donation.food_type,
#                         'matched_quantity': required_quantity,
#                         'food_description': donation.food_description,
#                         'expiry_date': donation.expiry_date.isoformat(),
#                     })

#                     # --- Prepare data for real-time notifications ---
#                     # Notification for the RECIPIENT
#                     notifications_to_send.append({
#                         'group_name': f'user_{recipient.user.id}',
#                         'message_content': {
#                             'message': f"Great news! A donation of {donation.food_type} ({required_quantity}kg) from {donor.user.name} has been matched for you!",
#                             'notification_type': 'match_found_recipient',
#                             'data': {
#                                 'match_id': None, # You could get the ID if needed after creation
#                                 'food_type': donation.food_type,
#                                 'matched_quantity': required_quantity,
#                                 'donor_name': donor.user.name,
#                                 'food_description': donation.food_description,
#                             }
#                         }
#                     })

#                     # Notification for the DONOR
#                     notifications_to_send.append({
#                         'group_name': f'user_{donor.user.id}',
#                         'message_content': {
#                             'message': f"Your donation of {donation.food_type} ({donation.quantity}kg) has been matched with {recipient.user.name}!",
#                             'notification_type': 'match_found_donor',
#                             'data': {
#                                 'match_id': None, 
#                                 'food_type': donation.food_type,
#                                 'donated_quantity': donation.quantity,
#                                 'recipient_name': recipient.user.name,
#                                 'food_description': donation.food_description,
#                             }
#                         }
#                     })

#             # Send all accumulated notifications using the channel layer
#             for notif in notifications_to_send:
#                 async_to_sync(channel_layer.group_send)(
#                     notif['group_name'],
#                     {
#                         "type": "send_notification", # Corresponds to method in NotificationConsumer
#                         "message": notif['message_content']['message'],
#                         "notification_type": notif['message_content']['notification_type'],
#                         "data": notif['message_content']['data']
#                     }
#                 )

#             if not matched_details_for_response:
#                 return Response({'message': 'No suitable donations matched by the AI model.'}, status=204)

#             return Response({'matches': matched_details_for_response}, status=200)

#         except Exception as e:
#             logger.exception("Donation matching failed for user %s: %s", request.user, str(e))
#             return Response({'error': 'An unexpected error occurred during matching.'}, status=500)

class DonationsMatch(APIView):
    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get(self, request, *args, **kwargs):
        user = request.user
        role = user.role.lower() # Assuming user.role stores 'donor' or 'recipient'

        if role == 'donor':
            # For donors, display matches where they are the donor
            # You might want to filter further (e.g., by status, or only active matches)
            matches = DonationMatch.objects.filter(
                donor__user=user
            ).select_related('recipient__user', 'donor__user').order_by('-id')

            # Serialize the matches for the donor
            # If you don't have a specific DonationMatchSerializer, you can manually format
            # Or create a dedicated serializer for donor's view of matches
            response_data = []
            for match in matches:
                response_data.append({
                    'id': match.id,
                    'recipient_name': match.recipient.user.name,
                    'food_type': match.food_type,
                    'matched_quantity': match.matched_quantity,
                    'food_description': match.food_description,
                    'expiry_date': match.expiry_date.isoformat(),
                    'match_score': match.match_score,
                    # Add any other fields relevant for the donor's view
                })
            # Use DonationMatchSerializer if available
            # serializer = DonationMatchSerializer(matches, many=True)
            # return Response({'matches': serializer.data}, status=status.HTTP_200_OK)
            return Response({'matches': response_data}, status=status.HTTP_200_OK)

        elif role == 'recipient':
            # For recipients, display matches where they are the recipient
            matches = DonationMatch.objects.filter(
                recipient__user=user
            ).select_related('donor__user', 'recipient__user').order_by('-id')

            # Serialize the matches for the recipient
            response_data = []
            for match in matches:
                response_data.append({
                    'id': match.id,
                    'donor_name': match.donor.user.name,
                    'food_type': match.food_type,
                    'matched_quantity': match.matched_quantity,
                    'food_description': match.food_description,
                    'expiry_date': match.expiry_date.isoformat(),
                    'match_score': match.match_score,
                    # Add any other fields relevant for the recipient's view
                })
            # Use DonationMatchSerializer if available
            # serializer = DonationMatchSerializer(matches, many=True)
            # return Response({'matches': serializer.data}, status=status.HTTP_200_OK)
            return Response({'matches': response_data}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Unsupported user role for this endpoint.'}, status=status.HTTP_400_BAD_REQUEST)


    def post(self, request):
        rf_model, le_food, _, _ = get_matching_models()
        try:
            user = request.user
            try:
                recipient = user.recipient_profile
            except Recipient.DoesNotExist:
                return Response({'error': 'Recipient profile not found.'}, status=404)

            data = request.data
            recipient_food = data.get('recipient_food_type', '').strip().lower()
            required_quantity = float(data.get('required_quantity', 0))
            recipient_lat = float(data.get('lat', recipient.lat))
            recipient_lng = float(data.get('lng', recipient.lng))

            if not recipient_food:
                return Response({'error': 'recipient_food_type is required.'}, status=400)
            if not required_quantity:
                return Response({'error': 'required_quantity is required.'}, status=400)

            try:
                recipient_food_encoded = le_food.transform([recipient_food])[0]
            except ValueError:
                return Response({
                    'error': f"Unsupported food_type: '{recipient_food}'",
                    'supported_types': list(le_food.classes_)
                }, status=400)

            donations = Donation.objects.filter(
                quantity__gte=0,
                expiry_date__gte=timezone.now().date(),
                donor__city__iexact=recipient.city
            ).filter(
                Q(food_type__icontains=recipient_food) | Q(food_type__iexact=recipient_food)
            ).select_related('donor__user')

            match_inputs, donor_donation_map = [], []

            for donation in donations:
                donor = donation.donor
                try:
                    donation_food_encoded = le_food.transform([donation.food_type.strip().lower()])[0]
                except ValueError:
                    continue

                distance_km = geodesic((recipient_lat, recipient_lng), (donor.lat, donor.lng)).km
                food_match = int(recipient_food_encoded == donation_food_encoded)
                quantity_match = int(donation.quantity >= required_quantity)

                match_inputs.append({
                    'food_match': food_match,
                    'quantity_match': quantity_match,
                    'distance': distance_km,
                })
                donor_donation_map.append((donation, donor))

            if not match_inputs:
                return Response({"message": "No donations currently available for matching based on initial filters."}, status=404)

            df = pd.DataFrame(match_inputs)
            predictions = rf_model.predict(df)

            matched_details_for_response = []
            notifications_to_send = []

            channel_layer = get_channel_layer()

            for i, pred in enumerate(predictions):
                if pred == 1:
                    donation, donor = donor_donation_map[i]
                    match_input = match_inputs[i]

                    # --- DEDUPLICATION LOGIC START ---
                    # Define what constitutes a "duplicate" for your business logic.
                    # A common approach is same donor, same recipient, same food type, and same original donation ID.
                    existing_match = DonationMatch.objects.filter(
                        donor=donor,
                        recipient=recipient,
                        food_type=donation.food_type,
                        # If a specific original donation is always associated, link to it:
                        # original_donation=donation, # Add this field to your DonationMatch model if you track the source donation
                        # Consider also checking if the match was created recently to prevent continuous re-matching
                    ).first()

                    if existing_match:
                        logger.info(f"Skipping creation of duplicate match for {donor.user.name} and {recipient.user.name} for {donation.food_type}. Match ID: {existing_match.id}")
                        # If you want to include existing matches in the response:
                        match_to_add_to_response = {
                            'id': existing_match.id, # Include ID for frontend deduplication
                            'donor_name': donor.user.name,
                            'recipient_name': recipient.user.name,
                            'food_type': existing_match.food_type,
                            'matched_quantity': existing_match.matched_quantity,
                            'food_description': existing_match.food_description,
                            'expiry_date': existing_match.expiry_date.isoformat(),
                        }
                        matched_details_for_response.append(match_to_add_to_response)
                        continue # Skip to the next prediction as this match already exists
                    # --- DEDUPLICATION LOGIC END ---

                    match_score = int((
                        match_input['food_match'] * 0.4 +
                        match_input['quantity_match'] * 0.3 +
                        max(0, 1 - (match_input['distance'] / 50)) * 0.3
                    ) * 100)

                    # Create the new DonationMatch object in the database
                    new_match = DonationMatch.objects.create(
                        donor=donor,
                        recipient=recipient,
                        food_type=donation.food_type,
                        matched_quantity=required_quantity,
                        expiry_date=donation.expiry_date,
                        food_description=donation.food_description or f"Auto-matched donation from {donor.user.name}",
                        match_score=match_score
                    )

                    # Prepare data for API response (Dashboard display)
                    matched_details_for_response.append({
                        'id': new_match.id, # IMPORTANT: Include the ID here!
                        'donor_name': donor.user.name,
                        'recipient_name': recipient.user.name,
                        'food_type': donation.food_type,
                        'matched_quantity': required_quantity,
                        'food_description': donation.food_description,
                        'expiry_date': donation.expiry_date.isoformat(),
                    })

                    # --- Prepare data for real-time notifications ---
                    # (Ensure these also use new_match.id where applicable)
                    notifications_to_send.append({
                        'group_name': f'user_{recipient.user.id}',
                        'message_content': {
                            'message': f"Great news! A donation of {donation.food_type} ({required_quantity}kg) from {donor.user.name} has been matched for you!",
                            'notification_type': 'match_found_recipient',
                            'data': {
                                'match_id': new_match.id,
                                'food_type': donation.food_type,
                                'matched_quantity': required_quantity,
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

            # Send all accumulated notifications using the channel layer
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
                return Response({'message': 'No suitable donations matched by the AI model.'}, status=204)

            return Response({'matches': matched_details_for_response}, status=200)

        except Exception as e:
            logger.exception("Donation matching failed for user %s: %s", request.user, str(e))
            return Response({'error': 'An unexpected error occurred during matching.'}, status=500)




class DonationOptions(generics.RetrieveAPIView):
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]
    throttle_classes = [UserRateThrottle]
    def get(self, request):
        _, le_food, _, _ = get_matching_models()  # Only need the label encoder for food
        food_types = list(le_food.classes_)  # Get all known food types from the model
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
                recipient__isnull=False
            ).values(
                name=F('recipient__user__name') # Map 'recipient__user__name' to 'name'
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
                donor__isnull=False
            ).values(
                name=F('donor__user__name') # Map 'donor__user__name' to 'name'
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
    

# donors print their donation reports to show their contributions
def generate_reports():
    pass