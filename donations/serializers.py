from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Donor,Recipient,DonationMatch,Donation,Availability
from .matching import get_matching_models
from phonenumber_field.serializerfields import PhoneNumberField
from django.contrib.auth import get_user_model

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


class AvailabilitySerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    value = serializers.CharField(source='day_of_week')

    class Meta:
        model = Availability
        fields = ['id', 'label', 'value']

    def get_label(self, obj):
        return obj.day_of_week.capitalize()
    def get_value(self, obj):
     return obj.day_of_week.lower()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True)
    required_food_type = serializers.CharField(required=True, allow_blank=True)
    required_quantity = serializers.IntegerField(required=False)
    contact_phone = PhoneNumberField(required=True)
    city = serializers.CharField(required=True,allow_blank=True)

    class Meta:
        model = User
        fields = ['name', 'email', 'password','role','required_food_type','required_quantity','contact_phone','city']
    
    def create(self, validated_data):
        role = validated_data.pop('role', None)
        contact_phone = validated_data.pop('contact_phone', None)
        required_food_type = validated_data.pop('required_food_type', None)
        required_quantity = validated_data.pop('required_quantity', 0)
        city = validated_data.pop('city', None)
        password = validated_data.pop('password')
  

        # assigning city to coords        
        _, _, _, cities_to_coords = get_matching_models()

        # Normalize index
        cities_to_coords.index = cities_to_coords.index.astype(str).str.strip().str.title()

        # Normalize incoming city
        city = str(city).strip().title()

        if city not in cities_to_coords.index:
            raise serializers.ValidationError(f"Coordinates for city '{city}' not found.")

        coords = cities_to_coords.loc[city]
        lat, lng = coords['lat'], coords['lng']


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
        # user = User.objects.create_user(**validated_data)
        user = User(**validated_data)
        user.set_password(password)
        user.save()


        # Then create the role-specific profile
        if user.is_donor:
            Donor.objects.create(user=user, contact_phone=contact_phone,city=city,lat=lat,
            lng=lng)
        elif user.is_recipient:
            Recipient.objects.create(
                user=user,
                contact_phone=contact_phone,
                required_food_type=required_food_type,
                required_quantity=required_quantity,
                city=city,
                lat=lat,
                lng=lng
            )
        return user


    def validate(self, data):
        role = data.get('role')
        required_food_type = data.get('required_food_type', '').strip()

        if role == 'recipient':
            if not required_food_type:
                raise serializers.ValidationError("Recipients must specify required food type.")

            _, le_food, _ ,_= get_matching_models() 

            valid_food_types = list(le_food.classes_)

            if required_food_type not in valid_food_types:
                raise serializers.ValidationError({
                    "required_food_type": f"Invalid food type. Choose from: {', '.join(valid_food_types)}"
                })

        return data
    
    def validate_city(self, value):
        _, _, cities, _ = get_matching_models()
        
        # Normalize all cities in the list
        normalized_cities = [str(c).strip().title() for c in cities]

        # Normalize the input value
        value = str(value).strip().title()

        if value not in normalized_cities:
            raise serializers.ValidationError(
                f"Invalid city. Choose from: {', '.join(normalized_cities)}"
            )
        return value


    # def validate_city(self, value):
    #     _, _, cities,_ = get_matching_models()
    #     if value not in cities:
    #         raise serializers.ValidationError(
    #             f"Invalid city. Choose from: {', '.join(cities)}"
    #         )
    #     return value


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
    donor_name = serializers.SerializerMethodField(read_only=True)
    food_description = serializers.CharField(required=False,allow_blank=True)
    # availability = AvailabilitySerializer(many=True,required=False)
    class Meta:
        model = Donation
        fields = ['food_type','food_description', 'quantity','expiry_date','donor_name']

    def get_donor_name(self, obj):
        return obj.donor.user.name

    def get_food_description(self, obj):
        # Safe default logic
        if not obj.food_description:
            return "No description provided."

        # Custom formatting logic (you can adjust this)
        desc = obj.food_description.strip().capitalize()
        if len(desc) < 10:
            return f"{desc} (Too short — please provide more detail.)"

        return desc
    
   

class DonorSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    donor_name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    contact_phone = PhoneNumberField(required=True)
    # city = serializers.SerializerMethodField()
    city = serializers.CharField(read_only=True)


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

    def get_city(self, obj): # obj here is the User instance
        if obj.is_donor and hasattr(obj, 'donor_profile'):
            return obj.donor_profile.city
        else:
            None


class RecipientSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    recipient_name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    contact_phone = PhoneNumberField(required=True)
    city = serializers.CharField(read_only=True)
    # required_food_type = serializers.SerializerMethodField()
    # required_quantity = serializers.SerializerMethodField()

    class Meta:
        model = Recipient
        fields = ['recipient_name', 'email','contact_phone', 'lat', 'lng','city','role','required_quantity','required_food_type']

    def get_role(self, obj):
        user = obj.user
        if hasattr(user, 'is_recipient') and user.is_recipient:
            return 'recipient'
        elif hasattr(user, 'is_donor') and user.is_donor:
            return 'donor'
        return 'unknown'
    
    def get_city(self, obj):
        if obj.is_recipient and hasattr(obj, 'recipient_profile'):
            return obj.recipient_profile.city
        else:
            None

    # def get_required_quantity(self,obj):
    #     if obj.role == 'recipient' and hasattr(obj, 'recipient_profile'):
    #         return str(obj.recipient_profile.required_quantity)
    #     return None
    
    # def get_required_food_type(self,obj):
    #     if obj.role == 'recipient' and hasattr(obj, 'recipient_profile'):
    #         return str(obj.recipient_profile.required_food_type)
    #     return None

    

    

class DonationHistorySerializer(serializers.ModelSerializer):
    # donor = DonationSerializer(read_only=True)
    donor_name = serializers.CharField(source="donor.user.name",read_only=True)
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
            'expiry_date',
            'created_at'
        ]


class ProfileSerializer(serializers.Serializer):
    user = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    # city = serializers.CharField(read_only=True)
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

    # def get_role(self,obj):
    #     return obj.role
    def get_role(self, obj):
        if getattr(obj, 'is_donor', False):
            return 'donor'
        elif getattr(obj, 'is_recipient', False):
            return 'recipient'
        return 'unknown'

    def get_contact_phone(self,obj):
        if obj.role == 'donor' and hasattr(obj, 'donor_profile'):
            return str(obj.donor_profile.contact_phone)
        elif obj.role == 'recipient' and hasattr(obj, 'recipient_profile'):
            return str(obj.recipient_profile.contact_phone)
        return None
    
    # def get_city(self, obj):
    #     return getattr(obj, 'city', None)

    def get_city(self, obj): # obj here is the User instance
        if obj.is_donor and hasattr(obj, 'donor_profile'):
            return obj.donor_profile.city
        elif obj.is_recipient and hasattr(obj, 'recipient_profile'):
            return obj.recipient_profile.city
        return None 
    
    def get_required_quantity(self,obj):
        if obj.is_recipient and hasattr(obj, 'recipient_profile'):
            return str(obj.recipient_profile.required_quantity)
        return None
    
    def get_required_food_type(self,obj):
        if obj.is_recipient and hasattr(obj, 'recipient_profile'):
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

