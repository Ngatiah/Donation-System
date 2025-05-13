from django.shortcuts import render
from knox.auth import TokenAuthentication
from rest_framework import generics
from .serializers import UserSerializer,RegisterSerializer,LoginSerializer,DonationSerializer,ProfileSerializer,DonationHistorySerializer,MatchedDonorSerializer,RecipientSerializer
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.throttling import UserRateThrottle
import pandas as pd
from django.db.models import Q
# from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from .models import Donor,Recipient,DonationMatch
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
from django.http import JsonResponse
from rest_framework.decorators import api_view
import joblib
import os
from django.conf import settings
from geopy.distance import geodesic
from rest_framework.exceptions import NotFound

logger = logging.getLogger(__name__)
User = get_user_model()
# rf_model = joblib.load('../models/match_model2.pkl')
# le_food = joblib.load('../models/food_encoder.pkl')
# urgency_encoder = joblib.load('../models/urgency_encoder.pkl') 

def get_matching_models():
    base_path = os.path.join(settings.BASE_DIR, 'models')

    model_path = os.path.join(base_path, 'match_model2.pkl')
    food_encoder_path = os.path.join(base_path, 'food_encoder.pkl')
    urgency_encoder_path = os.path.join(base_path, 'urgency_encoder.pkl')

    if not all(os.path.exists(p) for p in [model_path, food_encoder_path, urgency_encoder_path]):
        raise FileNotFoundError("One or more model files not found in 'models/' directory")

    rf_model = joblib.load(model_path)
    le_food = joblib.load(food_encoder_path)
    urgency_encoder = joblib.load(urgency_encoder_path)

    return rf_model, le_food, urgency_encoder

def is_nearby(d_lat, d_lng, r_lat, r_lng, max_km=50):
    return geodesic((d_lat, d_lng), (r_lat, r_lng)).km <= max_km

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
            if User.objects.filter(email=request.data.get("email")).exists():
             return Response({"error": "User with this email already exists."}, status=400)
            
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


class Dashboard(APIView):
    # authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        role = user.role

        if role == 'donor':
            # .select_related reduces number of db hits
            try:
                donor = Donor.objects.select_related('user').get(user=user)
            except Recipient.DoesNotExist:
                raise NotFound("Donor profile not found.")
            # donor = Donor.objects.get(user=user)
            # matches = DonationMatch.objects.filter(donor=donor).order_by('-created_at')
            matches = DonationMatch.objects.filter(donor=donor).select_related('recipient__user','donor__user')
            data = {
                "profile": MatchedDonorSerializer(donor).data,
                "matches": DonationHistorySerializer(matches, many=True).data
            }

        elif role == 'recipient':
            # recipient = Recipient.objects.get(user=user)
            # matches = DonationMatch.objects.filter(recipient=recipient).order_by('-created_at')
            try:
                recipient = Recipient.objects.select_related('user').get(user=user)
            except Recipient.DoesNotExist:
                raise NotFound("Recipient profile not found.")
            matches = DonationMatch.objects.filter(recipient=recipient).select_related('recipient__user', 'donor__user')

            data = {
                "profile": RecipientSerializer(recipient).data,
                "matches": DonationHistorySerializer(matches, many=True).data
            }

        else:
            data = {"error": "Invalid role"}

        return Response(data)


class UserProfile(generics.RetrieveAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    # queryset = UserProfile.objects.all()
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


class CreateDonation(generics.CreateAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = DonationSerializer
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DonationsMatch(APIView):
    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]
    # ensures ai enpoint not spammed/overused
    throttle_classes = [UserRateThrottle]
    def post(self, request):
        rf_model, le_food = get_matching_models()
        try:
            # Step 1: Retrieve recipient profile
            user = request.user
            try:
                recipient = user.recipient_profile
            except Recipient.DoesNotExist:
                return Response({'error': 'Recipient profile not found.'}, status=404)

            # Step 2: Input data from request
            data = request.data
            # recipient_food = data.get('food_type', '').strip().lower()
            recipient_food = data.get('recipient_food_type', '').strip().lower()
            required_quantity = float(data.get('required_quantity', 0))
            recipient_lat = float(data.get('lat', recipient.lat))
            recipient_lng = float(data.get('lng', recipient.lng))

            # Step 3: Encode food type
            try:
                recipient_food_encoded = le_food.transform([recipient_food])[0]
            except ValueError:
                return Response({
                    'error': f"Unsupported food_type: '{recipient_food}'",
                    'supported_types': list(le_food.classes_)
                }, status=400)

            # Step 4: Get all valid donor candidates
            donors = Donor.objects.filter(available=True).exclude(lat__isnull=True, lng__isnull=True)

            match_inputs = []
            donor_map = []

            for donor in donors:
                donor_food = donor.food_type.strip().lower()
                try:
                    donor_food_encoded = le_food.transform([donor_food])[0]
                except ValueError:
                    continue  # skip if donor's food type wasn't in training

                food_match = int(recipient_food_encoded == donor_food_encoded)
                quantity_match = int(donor.quantity >= required_quantity)
                distance_km = geodesic((recipient_lat, recipient_lng), (donor.lat, donor.lng)).km

                match_inputs.append({
                    'food_match': food_match,
                    'quantity_match': quantity_match,
                    'distance': distance_km
                })
                donor_map.append(donor)

            if not match_inputs:
                return Response({"message": "No matching donors found."}, status=404)

            # Step 5: Model prediction
            df = pd.DataFrame(match_inputs)
            predictions = rf_model.predict(df)

            # Step 6: Save and return matched donors
            matched_donors = []
            for pred, donor in zip(predictions, donor_map):
                if pred == 1:
                    # Save the match
                    DonationMatch.objects.create(
                        donor=donor,
                        recipient=recipient,
                        food_type=donor.food_type,
                        matched_quantity=required_quantity,
                        food_description=f"Auto-matched donation for {recipient.user.name}",
                        pickup_time=timezone.now() + timedelta(hours=2)
                    )
                    # matched_donors.append(DonationSerializer(donor).data)
                    matched_donors.append(MatchedDonorSerializer(donor).data)

            if not matched_donors:
                return Response({'message': 'No suitable donors matched by the AI model.'}, status=204)

            return Response({'matches': matched_donors}, status=200)

        except Exception as e:
            logger.exception("Matching failed")
            return Response({'error': str(e)}, status=500)



class DonationOptions(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        _, le_food = get_matching_models()  # Only need the label encoder for food
        food_types = list(le_food.classes_)  # Get all known food types from the model
        return Response({'required_food_types': food_types})


# preview donations for both donor and recipients based on role logged in
class DonationsHistory(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DonationHistorySerializer

    def get_queryset(self):
        user = self.request.user
        return DonationMatch.objects.filter(
        Q(donor__user=user) | Q(recipient__user=user)
        ).select_related('donor__user', 'recipient__user')

        # return DonationMatch.objects.filter(
        #     donor__user=user
        # ) | DonationMatch.objects.filter(
        #     recipient__user=user
        # )
    


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def switch_role(request):
    try:
        apply_role(request.user, request.data.get('role'))
        return Response({"message": f"Switched to {request.data.get('role')} role."}, status=200)
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

# donors print their donation reports to show their contributions
def generate_reports():
    pass



