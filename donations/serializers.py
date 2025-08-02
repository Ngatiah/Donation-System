from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Donor,Recipient,DonationMatch,Donation,Availability,RecipientNeedLog
from .matching import get_matching_models
from phonenumber_field.serializerfields import PhoneNumberField
from django.contrib.auth import get_user_model
from .utils import re_evaluate_matches_for_donation 
import logging 
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)
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
    # required_food_type = serializers.CharField(required=True, allow_blank=True)
    required_quantity = serializers.IntegerField(required=False)
    # multi-selection
    required_food_type = serializers.ListField(
        # Each item in the list is a CharField
        child=serializers.CharField(max_length=255),
        required=False, # but enforce for recipients in validate method
        allow_empty=True # Allow an empty list initiall,y
    )
    contact_phone = PhoneNumberField(required=True)
    city = serializers.CharField(required=True,allow_blank=True)

    class Meta:
        model = User
        fields = ['name', 'email', 'password','role','required_food_type','required_quantity','contact_phone','city']
    
    def create(self, validated_data):
        role = validated_data.pop('role', None)
        contact_phone = validated_data.pop('contact_phone', None)
        # required_food_type = validated_data.pop('required_food_type', None)
        required_food_type_list = validated_data.pop('required_food_type', [])
        required_quantity = validated_data.pop('required_quantity', 0)
        city = validated_data.pop('city', None)
        password = validated_data.pop('password')

        print(f"DEBUG: required_food_type_list = {required_food_type_list}")
        print(f"DEBUG: type(required_food_type_list) = {type(required_food_type_list)}")
  

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
                # required_food_type=required_food_type,
                required_food_type=required_food_type_list,
                required_quantity=required_quantity,
                city=city,
                lat=lat,
                lng=lng
            )
        return user


    def validate(self, data):
        role = data.get('role')
        # required_food_type = data.get('required_food_type', '').strip()
        required_food_type = data.get('required_food_type', [])


        if role == 'recipient':
            if not required_food_type:
                raise serializers.ValidationError("Recipients must specify required food type.")

            _, le_food, _ ,_= get_matching_models() 

            # valid_food_types = list(le_food.classes_)
            valid_food_types = le_food
            # Validate each food type in the list
            invalid_types = []
            for food_type in required_food_type:
                if food_type.strip().lower() not in valid_food_types:
                    invalid_types.append(food_type)
            
            if invalid_types:
                raise serializers.ValidationError({
                    "required_food_type": f"Invalid food type(s): '{', '.join(invalid_types)}'. Choose from: {', '.join(valid_food_types)}"
                })

        return data

        #     if required_food_type not in valid_food_types:
        #         raise serializers.ValidationError({
        #             "required_food_type": f"Invalid food type. Choose from: {', '.join(valid_food_types)}"
        #         })

        # return data
    
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
        if user is None:
            # If authentication fails, raise a ValidationError.
            raise serializers.ValidationError("Invalid credentials provided.")

        if not user.is_active:
            raise serializers.ValidationError("User account is inactive.")

        return {'user': user}


class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.SerializerMethodField(read_only=True)
    food_description = serializers.CharField(required=False,allow_blank=True)
    # donor_contact_phone = serializers.SerializerMethodField(read_only=True)
    # availability = AvailabilitySerializer(many=True,required=False)
    class Meta: 
        model = Donation
        # fields = ['id','food_type','food_description', 'quantity','expiry_date','donor_name','status']
        fields = ['id','food_type','food_description', 'quantity','expiry_date','donor_name','is_claimed']

    def get_donor_name(self, obj):
        return obj.donor.user.name

    def get_food_description(self, obj):
        if not obj.food_description:
            return "No description provided."

        # Custom formatting logic
        desc = obj.food_description.strip().capitalize()
        if len(desc) < 10:
            return f"{desc} (Too short — please provide more detail.)"

        return desc
    
    def update(self, instance, validated_data):
        logger.info(f"DonationSerializer update called for Donation ID: {instance.id}")
        logger.debug(f"Validated data: {validated_data}")

        # Store original values for potential comparison
        original_food_type = instance.food_type
        original_quantity = instance.quantity
        original_expiry_date = instance.expiry_date
        original_food_description = instance.food_description

        # Update specific fields
        instance.food_type = validated_data.get('food_type', instance.food_type)
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.expiry_date = validated_data.get('expiry_date', instance.expiry_date)

        # Handle food_description if present in validated_data
        if 'food_description' in validated_data:
            instance.food_description = validated_data['food_description'] # Use validated_data directly

        instance.save()
        logger.info(f"Donation ID {instance.id} saved after update.")

        # --- CRITICAL ADDITION: Trigger match re-evaluation ---
        # This will be called whenever a donation is updated.
        # Only call re_evaluate if match-relevant fields changed (optimization)
        if (original_food_type != instance.food_type or
            original_quantity != instance.quantity or
            original_expiry_date != instance.expiry_date or
            original_food_description != instance.food_description):
            try:
                re_evaluate_matches_for_donation(instance)
                logger.info(f"Triggered match re-evaluation for Donation ID: {instance.id} due to relevant changes.")
            except Exception as e:
                logger.error(f"Error during match re-evaluation for Donation ID {instance.id}: {e}", exc_info=True)
        else:
            logger.info(f"Donation ID: {instance.id} updated, but no match-relevant fields changed. Skipping re-evaluation.")

        return instance

class DonorSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    donor_name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    contact_phone = PhoneNumberField()
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


class RecipientNeedUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipientNeedLog
        fields = ['food_type', 'quantity','created_at']


class TopUserSerializer(serializers.Serializer):
    name = serializers.CharField()
    total_quantity_kg = serializers.FloatField()
    

class DonationHistorySerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source="donor.user.name",read_only=True)
    recipient_name = serializers.CharField(source='recipient.user.name', read_only=True)
    # donor_role = serializers.CharField(source="donor.user.role",read_only=True)
    # recipient_role = serializers.CharField(source="recipient.user.role",read_only=True)
    donor_contact_phone = serializers.CharField(source="donor.contact_phone", read_only=True)
    recipient_contact_phone = serializers.CharField(source="recipient.contact_phone", read_only=True)

    # donor_user = serializers.CharField(source="donor.user",read_only=True)
    # recipient_user = serializers.CharField(source="recipient.user",read_only=True)

    # New field to indicate if the *original donation* for this match is deleted
    is_donation_deleted = serializers.BooleanField(source='donation.is_deleted', read_only=True)

    is_current_user_the_donor = serializers.SerializerMethodField()
    is_current_user_the_recipient = serializers.SerializerMethodField()

    class Meta:
        model = DonationMatch
        fields = [
            'id',
            'donor_name',
            'recipient_name',
            'donor',
            # 'donor_user',
            'donor_contact_phone',
            'recipient',
            'recipient_contact_phone',
            # 'recipient_user',
            'donation',
            'food_type',
            'matched_quantity',
            'food_description',
            'expiry_date',
            'created_at',
            'is_claimed',
            'is_missed',
            'is_current_user_the_donor',     
            'is_current_user_the_recipient', 
            'is_donation_deleted'
        ]

    def get_is_current_user_the_donor(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.donor.user == request.user
        return False # If not authenticated, or no request, default to False

    # Method to determine if the authenticated user is the recipient of this match
    def get_is_current_user_the_recipient(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.recipient.user == request.user
        return False #


class ProfileSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True) # Expose user ID
    user = serializers.SerializerMethodField()
    name = serializers.CharField(required=False)
    role = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    email = serializers.EmailField(read_only=True)
    contact_phone = serializers.SerializerMethodField()
    # required_food_type = serializers.SerializerMethodField()
    required_food_type = serializers.ListField(
        child=serializers.CharField(max_length=255),
        required=False, # Allow partial updates without sending this field
        allow_empty=True
    )
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
    
    def get_required_food_type(self, obj):
        if obj.is_recipient and hasattr(obj, 'recipient_profile'):
            return obj.recipient_profile.required_food_type
        return []
    
    def update(self, instance, validated_data):
        user = instance
        # role = user.role

        if 'name' in validated_data:
            user.name = validated_data['name']
            user.save() # Save the user instance if name changed

        # Handle donor profile updates
        donor_data = validated_data.get('donor_profile')
        if donor_data is not None: # Check if donor_profile data was sent in the request
            if hasattr(user, 'donor_profile') and user.donor_profile:
                # Update existing donor profile
                donor_serializer = DonorSerializer(user.donor_profile, data=donor_data, partial=True)
                donor_serializer.is_valid(raise_exception=True)
                donor_serializer.save() 
            elif user.is_donor: # Only create if user is a donor and profile doesn't exist
                # Create new donor profile
                donor_serializer = DonorSerializer(data={**donor_data, 'user': user.id})
                donor_serializer.is_valid(raise_exception=True)
                donor_serializer.save(user=user) # Link to user
            else:
                logger.warning(f"Attempt to update donor_profile for non-donor user {user.id}")


        # Handle recipient profile updates
        recipient_data = validated_data.get('recipient_profile')
        if recipient_data is not None: 
            if hasattr(user, 'recipient_profile') and user.recipient_profile:
                # Update existing recipient profile
                recipient = user.recipient_profile
                recent_log = recipient.need_logs.order_by('-created_at').first()
                # ensuring need update not bypassed when update profile
                if recent_log and (timezone.now() - recent_log.created_at < timedelta(days=30)):
                 raise serializers.ValidationError("You can only update your food needs once every 30 days.")

                # recipient_serializer = RecipientSerializer(user.recipient_profile, data=recipient_data, partial=True)
                recipient_serializer = RecipientSerializer(recipient, data=recipient_data, partial=True)
                recipient_serializer.is_valid(raise_exception=True)
                recipient_serializer.save()

                try:
                    RecipientNeedLog.objects.create(
                    recipient=recipient,
                    food_type=recipient.required_food_type,
                    quantity=recipient.required_quantity,
                    # urgency=recipient.urgency
                )

                except Exception as e:
                  logger.warning(f"Could not log recipient need: {str(e)}")
            elif user.is_recipient: 
                # Create new recipient profile
                recipient_serializer = RecipientSerializer(data={**recipient_data, 'user': user.id})
                recipient_serializer.is_valid(raise_exception=True)
                recipient_serializer.save(user=user) # Link to user
            else:
                logger.warning(f"Attempt to update recipient_profile for non-recipient user {user.id}")


        return user # Return the updated user instance
    





# class FeedbackSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Feedback
#         fields = ['id', 'match', 'submitted_by', 'submitted_for', 'rating', 'comments', 'created_at']
#         read_only_fields = ['submitted_by', 'submitted_for', 'created_at']




        # if user.is_donor:
        #     donor_data = validated_data.get('donor_profile')
        #     if hasattr(user, 'donor_profile'):
        #         donor_serializer = DonorSerializer(user.donor_profile, data=donor_data, partial=True)
        #     else:
        #         donor_serializer = DonorSerializer(data={**donor_data, "user": user.id})
        #     donor_serializer.is_valid(raise_exception=True)
        #     donor_serializer.save(user=user)

        # elif user.is_recipient:
        #     recipient_data = validated_data.get('recipient_profile')
        #     if hasattr(user, 'recipient_profile'):
        #         recipient_serializer = RecipientSerializer(user.recipient_profile, data=recipient_data, partial=True)
        #     else:
        #         recipient_serializer = RecipientSerializer(data={**recipient_data, "user": user.id})
        #     recipient_serializer.is_valid(raise_exception=True)
        #     recipient_serializer.save(user=user)

        # return user

