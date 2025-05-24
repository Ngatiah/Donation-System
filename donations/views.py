from knox.auth import TokenAuthentication
from rest_framework import generics
from .serializers import UserSerializer,RegisterSerializer,LoginSerializer,DonationSerializer,ProfileSerializer,DonationHistorySerializer,DonorSerializer,RecipientSerializer,AvailabilitySerializer
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.throttling import UserRateThrottle
import pandas as pd
# from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from .models import Donor,Recipient,DonationMatch,Donation,Availability
from rest_framework import status
from knox.models import AuthToken
from knox.views import LogoutView as KnoxLogoutView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
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
    


class DonationsMatch(APIView):
    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request):
        rf_model, le_food, _ , _= get_matching_models()
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

            try:
                recipient_food_encoded = le_food.transform([recipient_food])[0]
            except ValueError:
                return Response({
                    'error': f"Unsupported food_type: '{recipient_food}'",
                    'supported_types': list(le_food.classes_)
                }, status=400)

            donations = Donation.objects.filter(
                quantity__gte=required_quantity,
                expiry_date__gte=timezone.now().date(),
                donor__city__iexact=recipient.city
            ).filter(
                Q(food_type__icontains=recipient_food) | Q(food_type__iexact=recipient_food)
            ).select_related('donor')

            match_inputs,donor_map = [],[]

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
                    'distance': distance_km
                })
                donor_map.append((donation, donor))

            if not match_inputs:
                return Response({"message": "No donations currently available for matching."}, status=404)

            df = pd.DataFrame(match_inputs)
            predictions = rf_model.predict(df)


            matched_donors = []
            for pred, (donation, donor),match_input in zip(predictions, donor_map,match_inputs):
                if pred == 1:
                    # match_score = int((food_match * 0.4 + quantity_match * 0.3 + max(0, 1 - (distance_km / 50)) * 0.3) * 100)
                    match_score = int((
                    match_input['food_match'] * 0.4 +
                    match_input['quantity_match'] * 0.3 +
                    max(0, 1 - (match_input['distance'] / 50)) * 0.3
                ) * 100)
                    DonationMatch.objects.create(
                        donor=donor,
                        recipient=recipient,
                        food_type=donation.food_type,
                        matched_quantity=required_quantity,
                        expiry_date=donation.expiry_date,
                        food_description=donation.food_description or f"Auto-matched donation from {donor.user.name}",
                        match_score=match_score
                    )
                    matched_donors.append(DonorSerializer(donor).data)

            if not matched_donors:
                return Response({'message': 'No suitable donors matched by the AI model.'}, status=204)

            return Response({'matches': matched_donors}, status=200)

        except Exception as e:
            logger.exception("Matching failed")
            return Response({'error': str(e)}, status=500)


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

    def get_queryset(self):
        user = self.request.user
        return DonationMatch.objects.filter(
        Q(donor__user=user) | Q(recipient__user=user)
        ).select_related('donor__user', 'recipient__user')


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