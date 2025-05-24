# class Dashboard(APIView):
#     permission_classes = [IsAuthenticated]
#     authentication_classes = [TokenAuthentication]

#     def get(self, request):
#         user = request.user
#         role = user.role

#         if role == 'donor':
#             try:
#                 donor = Donor.objects.select_related('user').get(user=user)
#             except Donor.DoesNotExist:
#                 raise NotFound("Donor profile not found.")

#             # Donations uploaded by this donor
#             donations = Donation.objects.filter(donor=donor).order_by('-created_at')

#             # Matches made for this donor
#             matches = DonationMatch.objects.filter(donor=donor).select_related('recipient__user', 'donor__user').order_by('-created_at')

#             data = {
#                 "profile": DonorSerializer(donor).data,
#                 "uploaded_donations": DonationSerializer(donations, many=True).data,
#                 # "matches": DonationHistorySerializer(matches, many=True).data,
#                 "matches": matches

#             }

#         elif role == 'recipient':
#             try:
#                 recipient = Recipient.objects.select_related('user').get(user=user)
#             except Recipient.DoesNotExist:
#                 raise NotFound("Recipient profile not found.")

#             matches = DonationMatch.objects.filter(recipient=recipient).select_related('recipient__user', 'donor__user').order_by('-created_at')

#             data = {
#                 "profile": RecipientSerializer(recipient).data,
#                 # "matches": DonationHistorySerializer(matches, many=True).data,
#                 "matches": matches

#             }

#         else:
#             data = {"error": "Invalid role"}

#         return Response(data)


# role = validated_data.get('role')
        # contact_phone = validated_data.get('contact_phone')
        # required_food_type = validated_data.get('required_food_type')
        # required_quantity = validated_data.get('required_quantity')
        # city = validated_data.get('city')
        # password = validated_data.get('password')


# Show relevant available donations (not yet matched, not expired, enough quantity)
            # relevant_donations = Donation.objects.filter(
            #     quantity__gt=0,
            #     expiry_date__gte=timezone.now().date(),
            #     # donor__lat__isnull=False,
            #     # donor__lng__isnull=False
            #     donor__city__iexact=recipient.city, 
            # ).filter(
            #     Q(food_type__icontains=recipient.required_food_type) |
            #     Q(food_type__iexact=recipient.required_food_type)

            # ).order_by('-created_at')


# potential_donations = Donation.objects.filter(
#                 quantity__gt=0,
#                 expiry_date__gte=timezone.now().date(),
#                 donor__lat__isnull=False,
#                 donor__lng__isnull=False,
#             ).filter(
#                 Q(food_type__icontains=recipient.required_food_type) |
#                 Q(food_type__iexact=recipient.required_food_type)
#             ).select_related('donor').order_by('-created_at')

#             # Step 2: Apply proximity filter in Python
#             relevant_donations = [
#                 donation for donation in potential_donations
#                 if is_nearby(
#                     donation.donor.lat, donation.donor.lng,
#                     recipient.lat, recipient.lng
#                 )
#             ]


# def extract_features(donation, recipient, le_food):
#     try:
#         donation_food_encoded = le_food.transform([donation.food_type.strip().lower()])[0]
#         recipient_food_encoded = le_food.transform([recipient.required_food_type.lower()])[0]
#     except ValueError:
#         return None

#     distance_km = geodesic((recipient.lat, recipient.lng), (donation.donor.lat, donation.donor.lng)).km
#     return {
#         'food_match': int(recipient_food_encoded == donation_food_encoded),
#         'quantity_match': int(donation.quantity >= recipient.required_quantity),
#         'distance': distance_km
#     }


# class AvailabilitySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Availability
#         fields = ['id','day_of_week']
# #         # fields = [
# #         #     'id', 'specific_date', 'start_date', 'end_date',
# #         #     'day_of_week', 'available_from', 'available_until'
# #         # ]


# def validate(self, data):
    #     role = data.get('role')
    #     required_food_type = data.get('required_food_type')

    #     if role == 'recipient':
    #         if not required_food_type:
    #             raise serializers.ValidationError("Recipients must specify a required food type.")

    #         # Load label encoder only during validation
    #         _, le_food, _ = get_matching_models()
    #         valid_food_types = list(le_food.classes_)
            
    #         if required_food_type not in valid_food_types:
    #             raise serializers.ValidationError({
    #                 "required_food_type": f"Invalid food type. Choose from: {', '.join(valid_food_types)}"
    #             })




 # def create(self, validated_data):
    #     availability_data = validated_data.pop('availability', [])
    #     donation = Donation.objects.create(**validated_data)
    #     for avail in availability_data:
    #         availability = Availability.objects.create(**avail)
    #         donation.availability.add(availability)
    #     return donation

    # def update(self, instance, validated_data):
    #     availability_data = validated_data.pop('availability', None)
    #     for attr, value in validated_data.items():
    #         setattr(instance, attr, value)
    #     instance.save()

    #     if availability_data is not None:
    #         instance.availability.clear()
    #         for avail in availability_data:
    #             availability = Availability.objects.create(**avail)
    #             instance.availability.add(availability)

    #     return instance


     # def get_role(self, obj):
    #     user = obj.user
    #     if getattr(user, 'is_donor', False):
    #         return 'donor'
    #     if getattr(user, 'is_recipient', False):
    #         return 'recipient'
    #     return 'unknown'

