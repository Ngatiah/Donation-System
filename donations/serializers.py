from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from .models import Donor,Recipient,DonationMatch,Donation
# from rest_framework.response import Response
# from rest_framework import status
from phonenumber_field.serializerfields import PhoneNumberField

User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    """
    Deserialize user instance to JSON.
    """
    name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ('id','name','email')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True)
    required_food_type = serializers.CharField(required=True, allow_blank=True)
    required_quantity = serializers.IntegerField(required=False)
    contact_phone = PhoneNumberField(required=True)


    class Meta:
        model = User
        fields = ['name', 'email', 'password','role','required_food_type','required_quantity','contact_phone']
    
    def create(self, validated_data):
        role = validated_data.pop('role', None)
        contact_phone = validated_data.pop('contact_phone', None)
        required_food_type = validated_data.pop('required_food_type', None)
        required_quantity = validated_data.pop('required_quantity', 0)

        # Set role flags
        if role == 'donor':
            validated_data['is_donor'] = True
            validated_data['is_recipient'] = False
        elif role == 'recipient':
            validated_data['is_donor'] = False
            validated_data['is_recipient'] = True
        else:
            raise serializers.ValidationError("Invalid role. Must be 'donor' or 'recipient'.")

        # Create the user first
        user = User.objects.create_user(**validated_data)

        # Then create the role-specific profile
        if user.is_donor:
            Donor.objects.create(user=user, contact_phone=contact_phone)
        elif user.is_recipient:
            Recipient.objects.create(
                user=user,
                contact_phone=contact_phone,
                required_food_type=required_food_type,
                required_quantity=required_quantity
            )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if user and user.is_active:
            # return user
            return {'user': user}
        raise serializers.ValidationError("Invalid credentials")
        # return Response({"error": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)


class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='user.name', read_only=True)
    class Meta:
        model = Donation
        fields = ['food_type','food_description', 'quantity','expiry_date','available','donor_name']


class DonorSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    donor_name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    contact_phone = PhoneNumberField(required=True)

    class Meta:
        model = Donor
        fields = ['donor_name','email','contact_phone','lat','lng','city','role']
    
    def get_role(self, obj):
        user = obj.user
        if hasattr(user, 'is_donor') and user.is_donor:
            return 'donor'
        elif hasattr(user, 'is_recipient') and user.is_recipient:
            return 'recipient'
        return 'unknown'


class RecipientSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    recipient_name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    contact_phone = PhoneNumberField(required=True)

    class Meta:
        model = Recipient
        fields = ['recipient_name', 'email','contact_phone', 'lat', 'lng','city','role']

    def get_role(self, obj):
        user = obj.user
        if hasattr(user, 'is_recipient') and user.is_recipient:
            return 'recipient'
        elif hasattr(user, 'is_donor') and user.is_donor:
            return 'donor'
        return 'unknown'


class DonationHistorySerializer(serializers.ModelSerializer):
    # donor = DonationSerializer(read_only=True)
    donor_name = DonorSerializer(source="donor.user.name",read_only=True)
    recipient_name = serializers.CharField(source='recipient.user.name', read_only=True)

    class Meta:
        model = DonationMatch
        fields = [
            'id',
            'donor_name',
            'recipient_name',
            'food_type',
            'matched_quantity',
            'food_description',
            'pickup_time',
            'created_at'
        ]


class ProfileSerializer(serializers.Serializer):
    user = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    contact_phone = serializers.SerializerMethodField()
    required_food_type = serializers.SerializerMethodField()
    required_quantity = serializers.SerializerMethodField()
    donor_profile = DonorSerializer(required=False, allow_null=True)
    recipient_profile = RecipientSerializer(required=False, allow_null=True)

    def get_user(self, obj):
        return {
            "id": obj.id,
            "name": obj.name,
            "email": obj.email,
            "role": obj.role,
    }

    def get_role(self,obj):
        return obj.role

    def get_contact_phone(self,obj):
        if obj.role == 'donor' and hasattr(obj, 'donor_profile'):
            return str(obj.donor_profile.contact_phone)
        elif obj.role == 'recipient' and hasattr(obj, 'recipient_profile'):
            return str(obj.recipient_profile.contact_phone)
        return None
    
    def get_required_quantity(self,obj):
        if obj.role == 'donor' and hasattr(obj, 'donor_profile'):
            return None
        elif obj.role == 'recipient' and hasattr(obj, 'recipient_profile'):
            return str(obj.recipient_profile.required_quantity)
        return None
    
    def get_required_food_type(self,obj):
        if obj.role == 'donor' and hasattr(obj, 'donor_profile'):
            return None
        elif obj.role == 'recipient' and hasattr(obj, 'recipient_profile'):
            return str(obj.recipient_profile.required_food_type)
        return None
    
    def update(self, instance, validated_data):
        user = instance
        # role = user.role

        if user.is_donor:
            donor_data = validated_data.get('donor_profile')
            if hasattr(user, 'donor_profile'):
                donor_serializer = DonorSerializer(user.donor_profile, data=donor_data, partial=True)
            else:
                donor_serializer = DonorSerializer(data={**donor_data, "user": user.id})
            donor_serializer.is_valid(raise_exception=True)
            donor_serializer.save(user=user)

        elif user.is_recipient:
            recipient_data = validated_data.get('recipient_profile')
            if hasattr(user, 'recipient_profile'):
                recipient_serializer = RecipientSerializer(user.recipient_profile, data=recipient_data, partial=True)
            else:
                recipient_serializer = RecipientSerializer(data={**recipient_data, "user": user.id})
            recipient_serializer.is_valid(raise_exception=True)
            recipient_serializer.save(user=user)

        return user







