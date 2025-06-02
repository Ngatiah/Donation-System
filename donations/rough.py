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




# class DonationsMatch(APIView):
#     serializer_class = DonationSerializer
#     permission_classes = [IsAuthenticated]
#     throttle_classes = [UserRateThrottle]

#     def post(self, request):
#         rf_model, le_food, _ , _= get_matching_models()
#         try:
#             user = request.user
#             try:
#                 recipient = user.recipient_profile
#             except Recipient.DoesNotExist:
#                 return Response({'error': 'Recipient profile not found.'}, status=404)

#             data = request.data
#             recipient_food = data.get('recipient_food_type', '').strip().lower()
#             required_quantity = float(data.get('required_quantity', 0))
#             recipient_lat = float(data.get('lat', recipient.lat))
#             recipient_lng = float(data.get('lng', recipient.lng))

#             try:
#                 recipient_food_encoded = le_food.transform([recipient_food])[0]
#             except ValueError:
#                 return Response({
#                     'error': f"Unsupported food_type: '{recipient_food}'",
#                     'supported_types': list(le_food.classes_)
#                 }, status=400)

#             donations = Donation.objects.filter(
#                 quantity__gte=required_quantity,
#                 expiry_date__gte=timezone.now().date(),
#                 donor__city__iexact=recipient.city
#             ).filter(
#                 Q(food_type__icontains=recipient_food) | Q(food_type__iexact=recipient_food)
#             ).select_related('donor')

#             match_inputs,donor_map = [],[]

#             for donation in donations:
#                 donor = donation.donor
#                 try:
#                     donation_food_encoded = le_food.transform([donation.food_type.strip().lower()])[0]
#                 except ValueError:
#                     continue

#                 distance_km = geodesic((recipient_lat, recipient_lng), (donor.lat, donor.lng)).km
#                 food_match = int(recipient_food_encoded == donation_food_encoded)
#                 quantity_match = int(donation.quantity >= required_quantity)

#                 match_inputs.append({
#                     'food_match': food_match,
#                     'quantity_match': quantity_match,
#                     'distance': distance_km
#                 })
#                 donor_map.append((donation, donor))

#             if not match_inputs:
#                 return Response({"message": "No donations currently available for matching."}, status=404)

#             df = pd.DataFrame(match_inputs)
#             predictions = rf_model.predict(df)
    
#             matched_donors = []
#             for pred, (donation, donor),match_input in zip(predictions, donor_map,match_inputs):
#                 if pred == 1:
#                     # match_score = int((food_match * 0.4 + quantity_match * 0.3 + max(0, 1 - (distance_km / 50)) * 0.3) * 100)
#                     match_score = int((
#                     match_input['food_match'] * 0.4 +
#                     match_input['quantity_match'] * 0.3 +
#                     max(0, 1 - (match_input['distance'] / 50)) * 0.3
#                 ) * 100)
#                     DonationMatch.objects.create(
#                         donor=donor,
#                         recipient=recipient,
#                         food_type=donation.food_type,
#                         matched_quantity=required_quantity,
#                         expiry_date=donation.expiry_date,
#                         food_description=donation.food_description or f"Auto-matched donation from {donor.user.name}",
#                         match_score=match_score
#                     )
#                     matched_donors.append(DonorSerializer(donor).data)

#             if not matched_donors:
#                 return Response({'message': 'No suitable donors matched by the AI model.'}, status=204)

#             return Response({'matches': matched_donors}, status=200)

#         except Exception as e:
#             logger.exception("Matching failed")
#             return Response({'error': str(e)}, status=500)



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
#                    DonationMatch.objects.create(
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




# class DonationsMatch(APIView):
#     serializer_class = DonationSerializer
#     permission_classes = [IsAuthenticated]
#     throttle_classes = [UserRateThrottle]

#     def post(self, request):
#         rf_model, le_food, _, _ = get_matching_models()
#         try:
#             user = request.user
#             try:
#                 recipient = user.recipient_profile
#             except Recipient.DoesNotExist:
#                 return Response({'error': 'Recipient profile not found.'}, status=404)

#             data = request.data
#             recipient_food = data.get('recipient_food_type', '').strip().lower()
#             required_quantity = float(data.get('required_quantity', 0))
#             recipient_lat = float(data.get('lat', recipient.lat))
#             recipient_lng = float(data.get('lng', recipient.lng))

#             if not recipient_food:
#                 return Response({'error': 'recipient_food_type is required.'}, status=400)
#             if not required_quantity:
#                 return Response({'error': 'required_quantity is required.'}, status=400)

#             try:
#                 recipient_food_encoded = le_food.transform([recipient_food])[0]
#             except ValueError:
#                 return Response({
#                     'error': f"Unsupported food_type: '{recipient_food}'",
#                     'supported_types': list(le_food.classes_)
#                 }, status=400)

#             donations = Donation.objects.filter(
#                 quantity__gte=0,
#                 expiry_date__gte=timezone.now().date(),
#                 donor__city__iexact=recipient.city
#             ).filter(
#                 Q(food_type__icontains=recipient_food) | Q(food_type__iexact=recipient_food)
#             ).select_related('donor__user')

#             match_inputs, donor_donation_map = [], []

#             for donation in donations:
#                 donor = donation.donor
#                 try:
#                     donation_food_encoded = le_food.transform([donation.food_type.strip().lower()])[0]
#                 except ValueError:
#                     continue

#                 distance_km = geodesic((recipient_lat, recipient_lng), (donor.lat, donor.lng)).km
#                 food_match = int(recipient_food_encoded == donation_food_encoded)
#                 quantity_match = int(donation.quantity >= required_quantity)

#                 match_inputs.append({
#                     'food_match': food_match,
#                     'quantity_match': quantity_match,
#                     'distance': distance_km,
#                 })
#                 donor_donation_map.append((donation, donor))

#             if not match_inputs:
#                 return Response({"message": "No donations currently available for matching based on initial filters."}, status=404)

#             df = pd.DataFrame(match_inputs)
#             predictions = rf_model.predict(df)

#             matched_details_for_response = []
#             notifications_to_send = []

#             channel_layer = get_channel_layer()

#             for i, pred in enumerate(predictions):
#                 if pred == 1:
#                     donation, donor = donor_donation_map[i]
#                     match_input = match_inputs[i]

#                     # --- DEDUPLICATION LOGIC START ---
#                     # Define what constitutes a "duplicate" for your business logic.
#                     # A common approach is same donor, same recipient, same food type, and same original donation ID.
#                     existing_match = DonationMatch.objects.filter(
#                         donor=donor,
#                         recipient=recipient,
#                         food_type=donation.food_type,
#                         # If a specific original donation is always associated, link to it:
#                         # original_donation=donation, # Add this field to your DonationMatch model if you track the source donation
#                         # Consider also checking if the match was created recently to prevent continuous re-matching
#                     ).first()

#                     if existing_match:
#                         logger.info(f"Skipping creation of duplicate match for {donor.user.name} and {recipient.user.name} for {donation.food_type}. Match ID: {existing_match.id}")
#                         # If you want to include existing matches in the response:
#                         match_to_add_to_response = {
#                             'id': existing_match.id, # Include ID for frontend deduplication
#                             'donor_name': donor.user.name,
#                             'recipient_name': recipient.user.name,
#                             'food_type': existing_match.food_type,
#                             'matched_quantity': existing_match.matched_quantity,
#                             'food_description': existing_match.food_description,
#                             'expiry_date': existing_match.expiry_date.isoformat(),
#                         }
#                         matched_details_for_response.append(match_to_add_to_response)
#                         continue # Skip to the next prediction as this match already exists
#                     # --- DEDUPLICATION LOGIC END ---

#                     match_score = int((
#                         match_input['food_match'] * 0.4 +
#                         match_input['quantity_match'] * 0.3 +
#                         max(0, 1 - (match_input['distance'] / 50)) * 0.3
#                     ) * 100)

#                     # Create the new DonationMatch object in the database
#                     new_match = DonationMatch.objects.create(
#                         donor=donor,
#                         recipient=recipient,
#                         food_type=donation.food_type,
#                         matched_quantity=required_quantity,
#                         expiry_date=donation.expiry_date,
#                         food_description=donation.food_description or f"Auto-matched donation from {donor.user.name}",
#                         match_score=match_score
#                     )

#                     # Prepare data for API response (Dashboard display)
#                     matched_details_for_response.append({
#                         'id': new_match.id, # IMPORTANT: Include the ID here!
#                         'donor_name': donor.user.name,
#                         'recipient_name': recipient.user.name,
#                         'food_type': donation.food_type,
#                         'matched_quantity': required_quantity,
#                         'food_description': donation.food_description,
#                         'expiry_date': donation.expiry_date.isoformat(),
#                     })

#                     # --- Prepare data for real-time notifications ---
#                     # (Ensure these also use new_match.id where applicable)
#                     notifications_to_send.append({
#                         'group_name': f'user_{recipient.user.id}',
#                         'message_content': {
#                             'message': f"Great news! A donation of {donation.food_type} ({required_quantity}kg) from {donor.user.name} has been matched for you!",
#                             'notification_type': 'match_found_recipient',
#                             'data': {
#                                 'match_id': new_match.id,
#                                 'food_type': donation.food_type,
#                                 'matched_quantity': required_quantity,
#                                 'donor_name': donor.user.name,
#                                 'food_description': donation.food_description,
#                             }
#                         }
#                     })

#                     notifications_to_send.append({
#                         'group_name': f'user_{donor.user.id}',
#                         'message_content': {
#                             'message': f"Your donation of {donation.food_type} ({donation.quantity}kg) has been matched with {recipient.user.name}!",
#                             'notification_type': 'match_found_donor',
#                             'data': {
#                                 'match_id': new_match.id,
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
#                         "type": "send_notification",
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


# class DonationStatisticsView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, *args, **kwargs):
#         # Initialize default values
#         total_donations_value = 0
#         donations_today_value = 0
#         total_donors_count = 0
#         average_donation_value = 0.0

#         try:
#             # --- Total Donations (Sum of all quantities from Donation model) ---
#             # Assuming 'quantity' is a NumericField (e.g., DecimalField or FloatField)
#             # If quantity is a string, you might need to cast it in the DB query,
#             # or ensure it's stored as a number.
#             total_donations_agg = Donation.objects.aggregate(total_sum=Sum('quantity'))
#             total_donations_value = total_donations_agg['total_sum'] or 0

#             # --- Donations Today (Sum of quantities for donations created today) ---
#             today = timezone.now().date()
#             donations_today_agg = Donation.objects.filter(
#                 created_at=today
#             ).aggregate(daily_sum=Sum('quantity'))
#             donations_today_value = donations_today_agg['daily_sum'] or 0

#             # --- Total Donors (Count of unique donors) ---
#             # This depends on how your Donor model is linked to CustomUser
#             # Assuming Donor.objects.all() gives you all donors and they are unique by default
#             total_donors_count = Donor.objects.count()


#             # --- Average Donation (Average quantity of all donations) ---
#             average_donation_agg = Donation.objects.aggregate(avg_quantity=Avg('quantity'))
#             average_donation_value = average_donation_agg['avg_quantity'] or 0.0

#             # You might want to format these for display, e.g., to 2 decimal places
#             # total_donations_value = f"{total_donations_value:.2f}" if total_donations_value else "0.00"
#             # donations_today_value = f"{donations_today_value:.2f}" if donations_today_value else "0.00"
#             # average_donation_value = f"{average_donation_value:.2f}" if average_donation_value else "0.00"

#             response_data = {
#                 'total_donations': total_donations_value,
#                 'donations_today': donations_today_value,
#                 'total_donors': total_donors_count,
#                 'average_donation': average_donation_value,
#             }

#             return Response(response_data, status=status.HTTP_200_OK)

#         except Exception as e:
#             return Response(
#                 {"detail": f"An error occurred while fetching statistics: {str(e)}"},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )



# class UpdateDonationMatchStatus(generics.UpdateAPIView):
#     queryset = DonationMatch.objects.all()
#     serializer_class = UpdateDonationMatchStatusSerializer
#     permission_classes = [IsAuthenticated]
#     authentication_classes = [TokenAuthentication]
#     lookup_field = 'pk' # Expects match ID in URL, e.g., /api/matches/1/status/

#     def update(self, request, *args, **kwargs):
#         instance : DonationMatch = self.get_object()
#         user = request.user
#         role = user.role.lower()

#         if role != 'recipient' or instance.recipient.user != user:
#             raise PermissionDenied("You do not have permission to update this match status.")

#         new_status = request.data.get('status')
#         if new_status not in dict(DonationMatch.STATUS_CHOICES).keys():
#             return Response({"detail": "Invalid status provided."}, status=status.HTTP_400_BAD_REQUEST)

#         # Handle status transitions and related Donation status updates
#         if new_status == 'accepted':
#             # Check if donation is still pending/available
#             if instance.donation.status != 'pending':
#                 return Response({"detail": "Donation is no longer available or already matched."}, status=status.HTTP_400_BAD_REQUEST)
#             instance.status = new_status
#             instance.donation.status = 'matched' 
#             instance.donation.save()
#             instance.save()
#             return Response({"detail": "Match accepted and donation status updated to Matched."}, status=status.HTTP_200_OK)

#         elif new_status == 'declined':
#             instance.status = new_status
            
#             if instance.donation.status == 'matched': 
#                  instance.donation.status = 'pending'
#                  instance.donation.save()
#             instance.save()
#             return Response({"detail": "Match declined and donation status reverted to Pending."}, status=status.HTTP_200_OK)

#         elif new_status == 'fulfilled':
#             # Recipient confirms pickup
#             if instance.status == 'accepted':
#                 instance.status = new_status
#                 instance.donation.status = 'fulfilled' 
#                 instance.donation.save()
#                 instance.save()
#                 return Response({"detail": "Match fulfilled and donation status updated to Fulfilled."}, status=status.HTTP_200_OK)
#             else:
#                 return Response({"detail": "Match must be 'accepted' to be fulfilled."}, status=status.HTTP_400_BAD_REQUEST)

#         else:
#             return Response({"detail": "Invalid status transition."}, status=status.HTTP_400_BAD_REQUEST)


# class UpdateDonationMatchStatus(generics.UpdateAPIView):
#     queryset = DonationMatch.objects.all()
#     serializer_class = UpdateDonationMatchStatusSerializer # Ensure this serializer handles only the 'status' field for PATCH
#     permission_classes = [IsAuthenticated]
#     authentication_classes = [TokenAuthentication]
#     lookup_field = 'pk' # Expects match ID in URL, e.g., /api/matches/1/status/

#     def update(self, request, *args, **kwargs):
#         instance: DonationMatch = self.get_object() # Type hint for clarity
#         user = request.user
#         role = user.role.lower()

#         # Ensure only the recipient tied to this match can update its status
#         if role != 'recipient' or instance.recipient.user != user:
#             raise PermissionDenied("You do not have permission to update this match status.")

#         new_status = request.data.get('status')
#         if new_status not in dict(DonationMatch.STATUS_CHOICES).keys():
#             return Response({"detail": "Invalid status provided."}, status=status.HTTP_400_BAD_REQUEST)

#         # Prevent direct update if status is already fulfilled or declined (implies final state for match instance)
#         if instance.status in ['fulfilled', 'declined']:
#             return Response({"detail": f"This match is already in a final state ({instance.status}) and cannot be updated."}, status=status.HTTP_400_BAD_REQUEST)

#         # Handle status transitions and related Donation status updates
#         if new_status == 'accepted':
#             # Only allow acceptance if the donation is still 'pending'
#             if instance.donation.status != 'pending':
#                 return Response({"detail": "Donation is no longer available or already matched to another recipient."}, status=status.HTTP_400_BAD_REQUEST)

#             # Mark this match as accepted
#             instance.status = new_status
#             instance.save()

#             # Mark the donation as 'matched'
#             instance.donation.status = 'matched'
#             instance.donation.save()

#             # IMPORTANT: Decline any other PENDING matches for this donation
#             # This prevents multiple recipients from accepting the same donation
#             DonationMatch.objects.filter(
#                 donation=instance.donation,
#                 status='pending'
#             ).exclude(id=instance.id).update(status='declined_by_system') # Add 'declined_by_system' choice to your DonationMatch.STATUS_CHOICES
            
#             return Response({"detail": "Match accepted and donation status updated to Matched. Other pending matches for this donation have been cancelled."}, status=status.HTTP_200_OK)

#         elif new_status == 'declined':
#             instance.status = new_status # Mark this specific match as declined
#             instance.save()

#             # Check if there are any other 'accepted' matches for this donation
#             # If not, and the donation was 'matched', then it can revert to 'pending'
#             other_accepted_matches_exist = DonationMatch.objects.filter(
#                 donation=instance.donation,
#                 status='accepted'
#             ).exclude(id=instance.id).exists()

#             if not other_accepted_matches_exist and instance.donation.status == 'matched':
#                 # If this was the only 'accepted' match holding the donation, revert it
#                 instance.donation.status = 'pending'
#                 instance.donation.save()
#                 return Response({"detail": "Match declined and donation status reverted to Pending."}, status=status.HTTP_200_OK)
#             else:
#                 # Donation status remains unchanged if other accepted matches exist or it wasn't 'matched' by this match
#                 return Response({"detail": "Match declined."}, status=status.HTTP_200_OK)

#         elif new_status == 'fulfilled':
#             # Recipient confirms pickup
#             if instance.status != 'accepted':
#                 return Response({"detail": "Match must be 'accepted' to be fulfilled."}, status=status.HTTP_400_BAD_REQUEST)
            
#             instance.status = new_status
#             instance.save()

#             # Ensure the donation status is updated to 'fulfilled'
#             instance.donation.status = 'fulfilled' 
#             instance.donation.save()
            
#             return Response({"detail": "Match fulfilled and donation status updated to Fulfilled."}, status=status.HTTP_200_OK)

#         else:
#             # This case should ideally be caught by the initial new_status validation,
#             # but acts as a final safeguard for unexpected values.
#             return Response({"detail": "Invalid status transition."}, status=status.HTTP_400_BAD_REQUEST)
        
# class UpdateDonationMatchStatus(generics.UpdateAPIView):
#     queryset = DonationMatch.objects.all()
#     serializer_class = UpdateDonationMatchStatusSerializer
#     permission_classes = [IsAuthenticated]
#     authentication_classes = [TokenAuthentication]
#     lookup_field = 'pk' # Expects match ID in URL, e.g., /api/matches/1/status/

#     def update(self, request, *args, **kwargs):
#         instance: DonationMatch = self.get_object() 
#         user = request.user
#         role = user.role.lower()

#         # Ensure only the recipient tied to this match can update its status
#         if role != 'recipient' or instance.recipient.user != user:
#             logger.warning(f"Permission denied: User {user.id} ({user.role}) tried to update match {instance.id} not associated with them.")
#             raise PermissionDenied("You do not have permission to update this match status.")

#         new_status = request.data.get('status')
#         # Validate the new status against the choices defined in the model
#         if new_status not in dict(DonationMatch.STATUS_CHOICES).keys():
#             logger.warning(f"Invalid status provided for match {instance.id}: {new_status}")
#             return Response({"detail": "Invalid status provided."}, status=status.HTTP_400_BAD_REQUEST)

#         # Critical Check: Ensure the DonationMatch is linked to an actual Donation
#         # This prevents `AttributeError: 'NoneType' object has no attribute 'status'
#         if not instance.donation:
#             logger.error(f"DonationMatch {instance.id} has no linked Donation. Cannot update status.")
#             return Response({"detail": "This match is not linked to a valid donation."}, status=status.HTTP_400_BAD_REQUEST)

#         # Prevent direct update if status is already fulfilled or declined (implies final state for match instance)
#         # 'declined' now covers both user-initiated and system-initiated declines.
#         if instance.status in ['fulfilled', 'declined']:
#             logger.info(f"Attempted to update final match {instance.id} (status: {instance.status}) to {new_status}. Aborting.")
#             return Response({"detail": f"This match is already in a final state ({instance.status}) and cannot be updated."}, status=status.HTTP_400_BAD_REQUEST)

#         # --- Handle status transitions and related Donation status updates ---

#         if new_status == 'accepted':
#             # Only allow acceptance if the donation is still 'pending'
#             if instance.donation.status != 'pending':
#                 logger.info(f"Cannot accept match {instance.id}: Linked donation {instance.donation.id} is in status '{instance.donation.status}'.")
#                 return Response({"detail": "Donation is no longer available or already matched to another recipient."}, status=status.HTTP_400_BAD_REQUEST)

#             # Mark this match as accepted
#             instance.status = new_status
#             instance.save()
#             logger.info(f"Match {instance.id} status updated to 'accepted'.")

#             # Mark the original Donation as 'matched'
#             instance.donation.status = 'matched'
#             instance.donation.save()
#             logger.info(f"Linked Donation {instance.donation.id} status updated to 'matched'.")

#             # IMPORTANT: Decline any other PENDING matches for this donation
#             # This prevents multiple recipients from accepting the same donation.
#             # These matches are now effectively declined by the system.
#             other_pending_matches_for_this_donation = DonationMatch.objects.filter(
#                 donation=instance.donation,
#                 status='pending'
#             ).exclude(id=instance.id)

#             if other_pending_matches_for_this_donation.exists():
#                 # **CHANGED: Use 'declined' here**
#                 updated_count = other_pending_matches_for_this_donation.update(status='declined')
#                 logger.info(f"Declined {updated_count} other pending matches for Donation {instance.donation.id}.")
            
#             return Response({"detail": "Match accepted and donation status updated to Matched. Other pending matches for this donation have been cancelled."}, status=status.HTTP_200_OK)

#         elif new_status == 'declined':
#             # Mark this specific match as declined by the recipient
#             instance.status = new_status
#             instance.save()
#             logger.info(f"Match {instance.id} status updated to 'declined'.")

#             # Check if there are any other 'accepted' matches for this donation.
#             # If not, and the donation was 'matched', then it can revert to 'pending'.
#             other_accepted_matches_exist = DonationMatch.objects.filter(
#                 donation=instance.donation,
#                 status='accepted'
#             ).exclude(id=instance.id).exists()

#             if not other_accepted_matches_exist and instance.donation.status == 'matched':
#                 # If this was the only 'accepted' match holding the donation, revert it
#                 instance.donation.status = 'pending'
#                 instance.donation.save()
#                 logger.info(f"Donation {instance.donation.id} status reverted to 'pending' as no other active matches found.")
#                 return Response({"detail": "Match declined and donation status reverted to Pending."}, status=status.HTTP_200_OK)
#             else:
#                 logger.info(f"Match {instance.id} declined, but Donation {instance.donation.id} status remains '{instance.donation.status}' (other accepted matches exist or it wasn't 'matched').")
#                 return Response({"detail": "Match declined. Donation status unchanged."}, status=status.HTTP_200_OK)

#         elif new_status == 'fulfilled':
#             # Recipient confirms pickup
#             if instance.status != 'accepted':
#                 logger.warning(f"Cannot fulfill match {instance.id}: Current status is '{instance.status}', not 'accepted'.")
#                 return Response({"detail": "Match must be 'accepted' to be fulfilled."}, status=status.HTTP_400_BAD_REQUEST)
            
#             instance.status = new_status
#             instance.save()
#             logger.info(f"Match {instance.id} status updated to 'fulfilled'.")

#             # Ensure the donation status is updated to 'fulfilled'
#             instance.donation.status = 'fulfilled'
#             instance.donation.save()
#             logger.info(f"Linked Donation {instance.donation.id} status updated to 'fulfilled'.")

#             # Decline any remaining 'pending' or 'accepted' matches for this specific donation,
#             # as it's now fulfilled.
#             DonationMatch.objects.filter(
#                 donation=instance.donation,
#                 status__in=['pending', 'accepted']
#             ).exclude(id=instance.id).update(status='declined') # **CHANGED: Use 'declined' here too**
#             logger.info(f"Marked other active matches for fulfilled Donation {instance.donation.id} as 'declined'.")

#             return Response({"detail": "Match fulfilled and donation status updated to Fulfilled."}, status=status.HTTP_200_OK)

#         else:
#             # This case should ideally be caught by the initial new_status validation,
#             # but acts as a final safeguard for unexpected values.
#             logger.error(f"Unexpected status transition attempt for match {instance.id}: {instance.status} -> {new_status}")
#             return Response({"detail": "Invalid status transition."}, status=status.HTTP_400_BAD_REQUEST)



# def get(self, request, *args, **kwargs):
#         user = request.user
#         role = user.role.lower()

#         if role == 'donor':
#             # Active contributions: pending, accepted
#             active_matches = DonationMatch.objects.filter(
#                 donor__user=user,
#                 status__in=['pending', 'accepted'] # Consider what 'active' means
#             ).select_related('recipient__user', 'donor__user', 'donation').order_by('-id')

#             # Past contributions: fulfilled, declined, cancelled, unavailable
#             past_matches = DonationMatch.objects.filter(
#                 donor__user=user,
#                 status__in=['fulfilled', 'declined', 'cancelled_by_donor', 'auto_cancelled_by_system']
#             ).select_related('recipient__user', 'donor__user', 'donation').order_by('-id')

#             # Also fetch their own donations (from the Donation model)
#             all_donations = Donation.objects.filter(donor__user=user).order_by('-created_at')

#             active_matches_data = []
#             for match in active_matches:
#                 active_matches_data.append({
#                     'id': match.id,
#                     'recipient_name': match.recipient.user.name,
#                     'food_type': match.food_type,
#                     'matched_quantity': match.matched_quantity,
#                     'food_description': match.food_description,
#                     'expiry_date': match.expiry_date.isoformat(),
#                     'match_score': match.match_score,
#                     'status': match.status,
#                     'original_donation_id': match.donation.id, # Link to original donation
#                     'original_donation_status': match.donation.status,
#                 })

#             past_matches_data = []
#             for match in past_matches:
#                 past_matches_data.append({
#                     'id': match.id,
#                     'recipient_name': match.recipient.user.name,
#                     'food_type': match.food_type,
#                     'matched_quantity': match.matched_quantity,
#                     'food_description': match.food_description,
#                     'expiry_date': match.expiry_date.isoformat(),
#                     'match_score': match.match_score,
#                     'status': match.status,
#                     'original_donation_id': match.donation.id,
#                     'original_donation_status': match.donation.status,
#                 })

#             donations_data = []
#             for donation in all_donations:
#                 donations_data.append({
#                     'id': donation.id,
#                     'food_type': donation.food_type,
#                     'quantity': donation.quantity,
#                     'expiry_date': donation.expiry_date.isoformat(),
#                     'food_description': donation.food_description,
#                     'status': donation.status,
#                     'created_at': donation.created_at.isoformat(),
#                 })

#             return Response({
#                 'profile': {'user': {'name': user.name, 'role': 'donor'}, 'role': 'donor'}, # Add profile info
#                 'active_matches': active_matches_data,
#                 'past_matches': past_matches_data,
#                 'donations': donations_data,
#             }, status=status.HTTP_200_OK)
        
#         elif role == 'recipient':
#             # Active requests: pending, accepted
#             active_matches = DonationMatch.objects.filter(
#                 recipient__user=user,
#                 status__in=['pending', 'accepted']
#             ).select_related('donor__user', 'recipient__user', 'donation').order_by('-id')

#             # Past requests: fulfilled, declined, cancelled
#             past_matches = DonationMatch.objects.filter(
#                 recipient__user=user,
#                 status__in=['fulfilled', 'declined', 'cancelled_by_donor', 'auto_cancelled_by_system']
#             ).select_related('donor__user', 'recipient__user', 'donation').order_by('-id')

#             active_matches_data = []
#             for match in active_matches:
#                 active_matches_data.append({
#                     'id': match.id,
#                     'donor_name': match.donor.user.name,
#                     'food_type': match.food_type,
#                     'matched_quantity': match.matched_quantity,
#                     'food_description': match.food_description,
#                     'expiry_date': match.expiry_date.isoformat(),
#                     'match_score': match.match_score,
#                     'status': match.status,
#                     'original_donation_id': match.donation.id,
#                     'original_donation_status': match.donation.status,
#                 })

#             past_matches_data = []
#             for match in past_matches:
#                 past_matches_data.append({
#                     'id': match.id,
#                     'donor_name': match.donor.user.name,
#                     'food_type': match.food_type,
#                     'matched_quantity': match.matched_quantity,
#                     'food_description': match.food_description,
#                     'expiry_date': match.expiry_date.isoformat(),
#                     'match_score': match.match_score,
#                     'status': match.status,
#                     'original_donation_id': match.donation.id,
#                     'original_donation_status': match.donation.status,
#                 })
#             # Also fetch recipient profile data as it is required for matching
#             recipient_profile = None
#             try:
#                 recipient_profile = user.recipient_profile
#                 # Ensure you return required_food_type and quantity for subsequent POST calls if needed
#                 recipient_profile_data = {
#                     'required_food_type': recipient_profile.required_food_type,
#                     'required_quantity': recipient_profile.required_quantity,
#                 }
#             except Recipient.DoesNotExist:
#                 recipient_profile_data = {} # Or handle as error if profile is mandatory

#             return Response({
#                 'profile': {'user': {'name': user.name, 'role': 'recipient'}, 'role': 'recipient', **recipient_profile_data},
#                 'active_matches': active_matches_data,
#                 'past_matches': past_matches_data,
#             }, status=status.HTTP_200_OK)



# class DonationsMatch(APIView):
#     serializer_class = DonationSerializer
#     permission_classes = [IsAuthenticated]
#     throttle_classes = [UserRateThrottle]

#     def post(self, request):
#         rf_model, le_food, _, _ = get_matching_models()
#         try:
#             user = request.user
#             try:
#                 recipient = user.recipient_profile
#             except Recipient.DoesNotExist:
#                 return Response({'error': 'Recipient profile not found.'}, status=404)

#             data = request.data
#             recipient_food = data.get('recipient_food_type', '').strip().lower()
#             required_quantity = float(data.get('required_quantity', 0))
#             recipient_lat = float(data.get('lat', recipient.lat))
#             recipient_lng = float(data.get('lng', recipient.lng))

#             if not recipient_food:
#                 return Response({'error': 'recipient_food_type is required.'}, status=400)
#             if not required_quantity:
#                 return Response({'error': 'required_quantity is required.'}, status=400)

#             try:
#                 recipient_food_encoded = le_food.transform([recipient_food])[0]
#             except ValueError:
#                 return Response({
#                     'error': f"Unsupported food_type: '{recipient_food}'",
#                     'supported_types': list(le_food.classes_)
#                 }, status=400)

#             donations = Donation.objects.filter(
#                 quantity__gte=0,
#                 expiry_date__gte=timezone.now().date(),
#                 donor__city__iexact=recipient.city
#             ).filter(
#                 Q(food_type__icontains=recipient_food) | Q(food_type__iexact=recipient_food)
#             ).select_related('donor__user')

#             match_inputs, donor_donation_map = [], []

#             for donation in donations:
#                 donor = donation.donor
#                 try:
#                     donation_food_encoded = le_food.transform([donation.food_type.strip().lower()])[0]
#                 except ValueError:
#                     continue

#                 distance_km = geodesic((recipient_lat, recipient_lng), (donor.lat, donor.lng)).km
#                 food_match = int(recipient_food_encoded == donation_food_encoded)
#                 quantity_match = int(donation.quantity >= required_quantity)

#                 match_inputs.append({
#                     'food_match': food_match,
#                     'quantity_match': quantity_match,
#                     'distance': distance_km,
#                 })
#                 donor_donation_map.append((donation, donor))

#             if not match_inputs:
#                 return Response({"message": "No donations currently available for matching based on initial filters."}, status=404)

#             df = pd.DataFrame(match_inputs)
#             predictions = rf_model.predict(df)

#             matched_details_for_response = []
#             notifications_to_send = []

#             channel_layer = get_channel_layer()

#             for i, pred in enumerate(predictions):
#                 if pred == 1:
#                     donation, donor = donor_donation_map[i]
#                     match_input = match_inputs[i]

#                     # --- DEDUPLICATION LOGIC START ---
#                     # check if instance exists first
#                     existing_match = DonationMatch.objects.filter(
#                         donor=donor,
#                         recipient=recipient,
#                         food_type=donation.food_type,
#                     ).first()

#                     if existing_match:
#                         logger.info(f"Skipping creation of duplicate match for {donor.user.name} and {recipient.user.name} for {donation.food_type}. Match ID: {existing_match.id}")
#                         match_to_add_to_response = {
#                             'id': existing_match.id,
#                             'donor_name': donor.user.name,
#                             'recipient_name': recipient.user.name,
#                             'food_type': existing_match.food_type,
#                             'matched_quantity': existing_match.matched_quantity,
#                             'food_description': existing_match.food_description,
#                             'expiry_date': existing_match.expiry_date.isoformat(),
#                             'status':existing_match.status
#                         }
#                         matched_details_for_response.append(match_to_add_to_response)
#                         continue 
#                     # --- DEDUPLICATION LOGIC END ---

#                     match_score = int((
#                         match_input['food_match'] * 0.4 +
#                         match_input['quantity_match'] * 0.3 +
#                         max(0, 1 - (match_input['distance'] / 50)) * 0.3
#                     ) * 100)

#                     # Create the new DonationMatch object in the database
#                     new_match = DonationMatch.objects.create(
#                         donation=donation,
#                         donor=donor,
#                         recipient=recipient,
#                         food_type=donation.food_type,
#                         matched_quantity=required_quantity,
#                         expiry_date=donation.expiry_date,
#                         food_description=donation.food_description or f"Auto-matched donation from {donor.user.name}",
#                         match_score=match_score,
#                         status=status
#                     )

#                     # Prepare data for API response (Dashboard display)
#                     matched_details_for_response.append({
#                         'id': new_match.id, 
#                         'donor_name': donor.user.name,
#                         'recipient_name': recipient.user.name,
#                         'food_type': donation.food_type,
#                         'matched_quantity': required_quantity,
#                         'food_description': donation.food_description,
#                         'expiry_date': donation.expiry_date.isoformat(),
#                         'status':donation.status
#                     })

#                     # --- Prepare data for real-time notifications ---
#                     # (Ensure these also use new_match.id where applicable)
#                     notifications_to_send.append({
#                         'group_name': f'user_{recipient.user.id}',
#                         'message_content': {
#                             'message': f"Great news! A donation of {donation.food_type} ({required_quantity}kg) from {donor.user.name} has been matched for you!",
#                             'notification_type': 'match_found_recipient',
#                             'data': {
#                                 'match_id': new_match.id,
#                                 'food_type': donation.food_type,
#                                 'matched_quantity': required_quantity,
#                                 'donor_name': donor.user.name,
#                                 'food_description': donation.food_description,
#                             }
#                         }
#                     })

#                     notifications_to_send.append({
#                         'group_name': f'user_{donor.user.id}',
#                         'message_content': {
#                             'message': f"Your donation of {donation.food_type} ({donation.quantity}kg) has been matched with {recipient.user.name}!",
#                             'notification_type': 'match_found_donor',
#                             'data': {
#                                 'match_id': new_match.id,
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
#                         "type": "send_notification",
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



# class UpdateOrDeleteDonation(APIView):
#     permission_classes = [IsAuthenticated]
#     throttle_classes = [UserRateThrottle]

#     def delete(self, request, pk):
#         user = request.user
#         if user.role.lower() != 'donor':
#             return Response({'error': 'Only donors can delete donations.'}, status=status.HTTP_403_FORBIDDEN)
        
#         try:
#             donation = Donation.objects.get(pk=pk, donor__user=user)
#         except Donation.DoesNotExist:
#             return Response({'error': 'Donation not found or you do not have permission to delete it.'}, status=status.HTTP_404_NOT_FOUND)
        
#         # Only allow deletion of 'pending' donations or if no matches exist
#         # Or, if matches exist, change their status to 'cancelled_by_donor'
#         if donation.status == 'pending':
#             donation.delete()
#             return Response(status=status.HTTP_204_NO_CONTENT)
#         else:
#             # If there are active matches, update their status and notify recipients
#             DonationMatch.objects.filter(donation=donation, status__in=['pending', 'accepted']).update(status='cancelled_by_donor')
#             # You might want to update the donation status as well, e.g., 'unavailable'
#             donation.status = 'unavailable'
#             donation.save()
            
#             # --- Send notifications to affected recipients ---
#             # (Similar logic as in your POST method for sending notifications)
#             channel_layer = get_channel_layer()
#             affected_matches = DonationMatch.objects.filter(donation=donation, status='cancelled_by_donor')
#             for match in affected_matches:
#                 async_to_sync(channel_layer.group_send)(
#                     f'user_{match.recipient.user.id}',
#                     {
#                         "type": "send_notification",
#                         "message": f"A donation of {match.food_type} from {match.donor.user.name} you were matched with has been cancelled.",
#                         "notification_type": "match_cancelled",
#                         "data": {
#                             'match_id': match.id,
#                             'food_type': match.food_type,
#                             'donor_name': match.donor.user.name,
#                             'reason': 'Donor cancelled original donation',
#                         }
#                     }
#                 )

#             return Response({'message': 'Donation status updated to unavailable and associated matches cancelled.'}, status=status.HTTP_200_OK)


# class MatchActionView(APIView):
#     permission_classes = [IsAuthenticated]
#     throttle_classes = [UserRateThrottle]

#     def post(self, request, pk):
#         user = request.user
#         if user.role.lower() != 'recipient':
#             return Response({'error': 'Only recipients can perform this action.'}, status=status.HTTP_403_FORBIDDEN)
        
#         action = request.data.get('action') # 'accept' or 'decline'

#         if action not in ['accept', 'decline']:
#             return Response({'error': 'Invalid action. Must be "accept" or "decline".'}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             match = DonationMatch.objects.get(pk=pk, recipient__user=user)
#         except DonationMatch.DoesNotExist:
#             return Response({'error': 'Match not found or you do not have permission to modify it.'}, status=status.HTTP_404_NOT_FOUND)

#         if match.status != 'pending':
#             return Response({'error': f'Match is already {match.status} and cannot be {action}ed.'}, status=status.HTTP_400_BAD_REQUEST)

#         channel_layer = get_channel_layer()

#         if action == 'accept':
#             match.status = 'accepted'
#             match.save()
#             message = f"Good news! {user.name} has accepted your donation match for {match.food_type}."
#             notification_type = 'match_accepted_donor'
#             # Notify the donor that the match has been accepted
#             async_to_sync(channel_layer.group_send)(
#                 f'user_{match.donor.user.id}',
#                 {
#                     "type": "send_notification",
#                     "message": message,
#                     "notification_type": notification_type,
#                     "data": {
#                         'match_id': match.id,
#                         'food_type': match.food_type,
#                         'recipient_name': user.name,
#                     }
#                 }
#             )
#             return Response({'message': 'Match accepted successfully.', 'match_id': match.id}, status=status.HTTP_200_OK)
#         elif action == 'decline':
#             match.status = 'declined'
#             match.save()
#             message = f"Heads up! {user.name} has declined your donation match for {match.food_type}."
#             notification_type = 'match_declined_donor'
#             # Notify the donor that the match has been declined
#             async_to_sync(channel_layer.group_send)(
#                 f'user_{match.donor.user.id}',
#                 {
#                     "type": "send_notification",
#                     "message": message,
#                     "notification_type": notification_type,
#                     "data": {
#                         'match_id': match.id,
#                         'food_type': match.food_type,
#                         'recipient_name': user.name,
#                     }
#                 }
#             )
#             return Response({'message': 'Match declined successfully.', 'match_id': match.id}, status=status.HTTP_200_OK)



# class FeedbackCreateView(APIView):
#     permission_classes = [IsAuthenticated]
#     throttle_classes = [UserRateThrottle]
#     serializer_class = FeedbackSerializer

#     def post(self, request):
#         user = request.user
#         match_id = request.data.get('match_id')
#         rating = request.data.get('rating')
#         comments = request.data.get('comments')

#         try:
#             match = DonationMatch.objects.get(id=match_id)
#         except DonationMatch.DoesNotExist:
#             return Response({'error': 'Donation match not found.'}, status=status.HTTP_404_NOT_FOUND)

#         # Determine who is giving feedback and who is receiving it
#         # Only allow feedback if the match is fulfilled
#         if match.status != 'fulfilled':
#             return Response({'error': 'Feedback can only be given for fulfilled matches.'}, status=status.HTTP_400_BAD_REQUEST)

#         if user == match.recipient.user:
#             submitted_by = user
#             submitted_for = match.donor.user
#         elif user == match.donor.user:
#             submitted_by = user
#             submitted_for = match.recipient.user
#         else:
#             return Response({'error': 'You are not authorized to give feedback for this match.'}, status=status.HTTP_403_FORBIDDEN)

#         # Check if feedback already exists for this match by this user
#         if Feedback.objects.filter(match=match, submitted_by=user).exists():
#             return Response({'error': 'You have already submitted feedback for this match.'}, status=status.HTTP_400_BAD_REQUEST)

#         data = {
#             'match': match.id,
#             'rating': rating,
#             'comments': comments,
#         }
#         serializer = self.serializer_class(data=data)
#         if serializer.is_valid():
#             serializer.save(submitted_by=submitted_by, submitted_for=submitted_for)
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# You might also want a view to get feedback given/received by a user
# class UserFeedbackListView(APIView):
#     permission_classes = [IsAuthenticated]
#     serializer_class = FeedbackSerializer

#     def get(self, request):
#         user = request.user
#         # Feedback given by the user
#         given_feedback = Feedback.objects.filter(submitted_by=user).order_by('-created_at')
#         given_serializer = self.serializer_class(given_feedback, many=True)

#         # Feedback received by the user
#         received_feedback = Feedback.objects.filter(submitted_for=user).order_by('-created_at')
#         received_serializer = self.serializer_class(received_feedback, many=True)

#         return Response({
#             'given_feedback': given_serializer.data,
#             'received_feedback': received_serializer.data,
#         }, status=status.HTTP_200_OK)


# class UpdateDonationMatchStatus(generics.UpdateAPIView):
#     # ... existing setup ...

#     def update(self, request, *args, **kwargs):
#         instance: DonationMatch = self.get_object()
#         user = request.user

#         if user.role.lower() != 'recipient' or instance.recipient.user != user:
#             raise PermissionDenied("You do not have permission to update this match status.")

#         new_status = request.data.get('status')

#         try:
#             if new_status == 'accepted':
#                 DonationWorkflowService.recipient_accepts_match(instance)
#                 return Response({"detail": "Match accepted and donation status updated."}, status=status.HTTP_200_OK)
#             elif new_status == 'declined':
#                 DonationWorkflowService.recipient_declines_match(instance)
#                 return Response({"detail": "Match declined and donation status reverted."}, status=status.HTTP_200_OK)
#             elif new_status == 'fulfilled':
#                 DonationWorkflowService.recipient_fulfills_match(instance)
#                 return Response({"detail": "Match fulfilled and donation marked as fulfilled."}, status=status.HTTP_200_OK)
#             else:
#                 return Response({"detail": "Invalid status provided."}, status=status.HTTP_400_BAD_REQUEST)
#         except ValidationError as e:
#             return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             # Catch other unexpected errors
#             return Response({"detail": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# class UpdateDonationStatus(generics.UpdateAPIView):
#     queryset = Donation.objects.all()
#     serializer_class = UpdateDonationStatusSerializer
#     permission_classes = [IsAuthenticated]
#     authentication_classes = [TokenAuthentication]
#     lookup_field = 'pk'

#     def update(self, request, *args, **kwargs):
#         instance = self.get_object()
#         user = request.user
#         role = user.role.lower()

#         if role != 'donor' or instance.donor.user != user:
#             raise PermissionDenied("You do not have permission to update this donation status.")

#         new_status = request.data.get('status')
#         if new_status not in dict(Donation.STATUS_CHOICES).keys():
#             return Response({"detail": "Invalid status provided."}, status=status.HTTP_400_BAD_REQUEST)

#         if new_status in ['matched', 'fulfilled']:
#             return Response({"detail": f"Status '{new_status}' cannot be set manually. It's updated via recipient actions."}, status=status.HTTP_400_BAD_REQUEST)

#         instance.status = new_status
#         instance.save()
#         return Response({"detail": f"Donation status updated to {new_status}."}, status=status.HTTP_200_OK)

# Your existing UpdateDonationStatus view can remain largely the same for donor-initiated updates (e.g., making it unavailable)
# but it should NOT be used for updates triggered by recipient actions.
# class UpdateDonationStatus(generics.UpdateAPIView):
#     queryset = Donation.objects.all()
#     serializer_class = UpdateDonationStatusSerializer
#     permission_classes = [IsAuthenticated]
#     authentication_classes = [TokenAuthentication]
#     lookup_field = 'pk'


#     def update(self, request, *args, **kwargs):
#         instance = self.get_object()
#         user = request.user
#         role = user.role.lower()

#         if role != 'donor' or instance.donor.user != user:
#             raise PermissionDenied("You do not have permission to update this donation status.")

#         new_status = request.data.get('status')
#         if new_status not in dict(Donation.STATUS_CHOICES).keys():
#             return Response({"detail": "Invalid status provided."}, status=status.HTTP_400_BAD_REQUEST)

#         # Restrict direct manual setting of 'accepted' or 'fulfilled' by donor.
#         # These should be set by the recipient's match actions.
#         if new_status in ['accepted', 'fulfilled', 'declined_by_recipient']: # Add 'declined_by_recipient' here
#             return Response({"detail": f"Status '{new_status}' cannot be set manually by donor. It's updated via recipient actions."}, status=status.HTTP_400_BAD_REQUEST)

#         instance.status = new_status
#         instance.save()
#         return Response({"detail": f"Donation status updated to {new_status}."}, status=status.HTTP_200_OK)


# class Feedback(models.Model):
#     RATING_CHOICES = [
#         (1, '1 Star'),
#         (2, '2 Stars'),
#         (3, '3 Stars'),
#         (4, '4 Stars'),
#         (5, '5 Stars'),
#     ]
    
#     match = models.ForeignKey(DonationMatch, on_delete=models.CASCADE, related_name='feedback')
#     submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_feedback')
#     submitted_for = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_feedback')
#     rating = models.IntegerField(choices=RATING_CHOICES)
#     comments = models.TextField(blank=True, null=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         unique_together = ('match', 'submitted_by') # One feedback per user per match
#         verbose_name_plural = "Feedback"

#     def __str__(self):
#         return f"Feedback for match {self.match.id} by {self.submitted_by.name}"


# class Availability(models.Model):

#     day_of_week = models.CharField(
#         max_length=10,
#         choices=[
#             ('monday', 'Monday'),
#             ('tuesday', 'Tuesday'),
#             ('wednesday', 'Wednesday'),
#             ('thursday', 'Thursday'),
#             ('friday', 'Friday'),
#             ('saturday', 'Saturday'),
#             ('sunday', 'Sunday'),
#         ],
#         null=True,
#         blank=True  # Optional to support more precise availability
#     )

#     # specific_date = models.DateField(null=True, blank=True)  # Exact date availability
#     # start_date = models.DateField(null=True, blank=True)     # Range start
#     # end_date = models.DateField(null=True, blank=True)       # Range end
#     # available_from = models.TimeField()
#     # available_until = models.TimeField()

#     class Meta:
#         verbose_name_plural = "Availabilities"

#     def __str__(self):
#         return f"{self.day_of_week.capitalize()}"
#         # if self.specific_date:
#         #     return f"{self.specific_date} from {self.available_from} to {self.available_until}"
#         # elif self.start_date and self.end_date:
#         #     return f"{self.start_date}–{self.end_date} from {self.available_from} to {self.available_until}"
#         # elif self.day_of_week:
#         #     return f"{self.day_of_week.capitalize()} from {self.available_from} to {self.available_until}"
#         # return f"Available from {self.available_from} to {self.available_until}"
    
#     def clean(self):
#         if not self.day_of_week:
#             raise ValidationError("You must specify a day of the week.")
#         # if not any([self.specific_date, (self.start_date and self.end_date), self.day_of_week]):
#         #     raise ValidationError("You must specify either a specific date, a date range, or a day of the week.")



# # Example ClaimMatchView (in views.py)
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.permissions import IsAuthenticated
# from django.db import transaction
# from django.shortcuts import get_object_or_404
# import logging

# logger = logging.getLogger(__name__)

# class ClaimMatchView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request, match_id):
#         try:
#             match = get_object_or_404(DonationMatch, id=match_id)

#             # Ensure only the recipient of this match can claim it
#             if request.user != match.recipient.user:
#                 return Response(
#                     {'error': 'You are not authorized to claim this donation match.'},
#                     status=status.HTTP_403_FORBIDDEN
#                 )

#             if match.is_claimed:
#                 return Response(
#                     {'message': 'This donation has already been claimed.'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             with transaction.atomic():
#                 match.is_claimed = True
#                 match.save()

#                 # --- Handle reduction of original donation quantity ---
#                 # If a donation can be partially claimed by multiple recipients,
#                 # you need to reduce the original donation's quantity.
#                 # If a donation is fully consumed by a single match, then just mark claimed.
#                 # For simplicity here, we'll just mark the donation as claimed if the match is claimed.
#                 # More complex logic (e.g., partial claims) would require adjusting Donation.quantity
#                 # based on match.matched_quantity.

#                 # Assuming for now, claiming a match means the original donation is claimed
#                 # and won't be listed for others (if matched_quantity == original donation.quantity).
#                 # If donations can be split, you'd subtract matched_quantity from donation.quantity
#                 # and only mark donation.is_claimed=True if donation.quantity <= 0.
                
#                 # Simple approach: If a match is claimed, the original donation should no longer be available for *new* matches
#                 # If you want to allow partial claims for the *same original donation*,
#                 # you'd need to manage the Donation.quantity more carefully.
                
#                 # For now, let's just mark the original donation as claimed too,
#                 # which will stop it from appearing in new AI matches (due to is_claimed=False filter)
#                 # and also if its quantity becomes 0.
#                 original_donation = match.donation
#                 original_donation.quantity -= match.matched_quantity # Deduct claimed amount
#                 if original_donation.quantity <= 0:
#                     original_donation.is_claimed = True # Mark fully claimed
#                     original_donation.quantity = 0 # Ensure quantity doesn't go negative
#                 original_donation.save()


#             return Response({'message': 'Donation claimed successfully!', 'match_id': match.id}, status=status.HTTP_200_OK)

#         except DonationMatch.DoesNotExist:
#             return Response({'error': 'Donation match not found.'}, status=status.HTTP_404_NOT_FOUND)
#         except Recipient.DoesNotExist: # If user logs in as donor, but tries to claim
#             return Response({'error': 'Recipient profile not found for this user.'}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             logger.exception("Error claiming donation match %s: %s", match_id, str(e))
#             return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class DonationsMatch(APIView):
#     serializer_class = DonationSerializer
#     permission_classes = [IsAuthenticated]
#     throttle_classes = [UserRateThrottle]

#     def post(self, request):
#         rf_model, le_food, _, _ = get_matching_models()
#         try:
#             user = request.user
#             try:
#                 recipient = user.recipient_profile
#             except Recipient.DoesNotExist:
#                 return Response({'error': 'Recipient profile not found.'}, status=404)

#             data = request.data
#             recipient_food_types_raw = data.get('recipient_food_type')

#             if not recipient_food_types_raw:
#                 return Response({'error': 'recipient_food_type is required and cannot be empty.'}, status=400)

#             if isinstance(recipient_food_types_raw, str):
#                 try:
#                     recipient_food_types = json.loads(recipient_food_types_raw)
#                     if not isinstance(recipient_food_types, list):
#                         raise ValueError("Decoded JSON is not a list.")
#                 except (json.JSONDecodeError, ValueError):
#                     recipient_food_types = [recipient_food_types_raw]
#             elif isinstance(recipient_food_types_raw, list):
#                 recipient_food_types = recipient_food_types_raw
#             else:
#                 return Response({'error': 'recipient_food_type must be a string or a list of strings.'}, status=400)

#             # Normalize and validate each food type in the list
#             recipient_food_types_normalized = {ft.strip().lower() for ft in recipient_food_types} # Use a set for faster lookups
            
#             supported_food_classes = set(le_food.classes_) # Convert to set for faster lookups
#             unsupported_foods = [
#                 food for food in recipient_food_types_normalized
#                 if food not in supported_food_classes
#             ]
#             if unsupported_foods:
#                 return Response({
#                     'error': f"Unsupported food type(s) requested: {', '.join(unsupported_foods)}",
#                     'supported_types': sorted(list(supported_food_classes)) # Return sorted for readability
#                 }, status=400)

#             required_quantity = float(data.get('required_quantity', 0))
#             recipient_lat = float(data.get('lat', recipient.lat))
#             recipient_lng = float(data.get('lng', recipient.lng))

            # if not required_quantity:
            #     return Response({'error': 'required_quantity is required.'}, status=400)

            # already_matched_ids = DonationMatch.objects.filter(recipient=recipient).values_list('donation_id', flat=True)
            
            # # Prepare Q objects for efficient database filtering based on multiple food types
            # # Convert recipient_food_types_normalized (set of lowercase strings)
            # # back to a list with original/expected casing for database lookup if needed,
            # # or ensure your Donation.food_type field matches normalized if it's stored lowercase.
            # # Assuming Donation.food_type is stored with typical capitalization (e.g., 'Beans')
            # # and you want to match any of the recipient's requested types.
            
            # # Option 1 (Recommended): Filter based on exact match (case-insensitive if your DB supports)
            # # or if `food_type` in Donation model is stored in a consistent case.
            # # Assuming your `Donation.food_type` is stored exactly as it would be if retrieved from le_food.classes_.
            
            # # Create a list of food types to match in the database, ensuring correct casing if necessary.
            # # If your Donation.food_type stores 'Beans', 'Rice', etc.
            # db_food_types_to_match = [ft.capitalize() for ft in recipient_food_types_normalized] # Example: ['Beans', 'Rice']

            # donations = Donation.objects.filter(
            #     is_claimed=False,
            #     quantity__gt=0,
            #     expiry_date__gte=timezone.now().date(),
            #     donor__lat__isnull=False,
            #     donor__lng__isnull=False,
            # ).exclude(id__in=already_matched_ids).filter(
            #     food_type__in=db_food_types_to_match # Use __in for list matching
            # ).select_related('donor')

            # # Debugging filter result:
            # logger.info(f"Donations filtered by food_type__in {db_food_types_to_match}: {donations.count()} found.")
            # for d in donations:
            #     logger.debug(f"Filtered Donation: ID={d.id}, Food={d.food_type}")


            # match_inputs, donor_donation_map = [], []

            # for donation in donations:
            #     donor = donation.donor
                
            #     # Normalize donation food type for comparison with recipient's requested types
            #     donation_food_type_normalized = donation.food_type.strip().lower()
                
            #     try:
            #         # Encode the *normalized donation food type* for the model if needed
            #         # This is used for features like 'donation_food_encoded' if your RF model uses it
            #         # otherwise, if 'food_match' is the only food-related feature, this specific encoding
            #         # might not be directly used as a feature value, but it's good to keep it if the original
            #         # model needed it.
            #         donation_food_encoded = le_food.transform([donation_food_type_normalized])[0]
            #     except ValueError:
            #         logger.warning(f"Donation food type '{donation.food_type}' not in LabelEncoder classes. Skipping.")
            #         continue # Skip this donation if its food type isn't recognized by the model

            #     distance_km = geodesic((recipient_lat, recipient_lng), (donor.lat, donor.lng)).km
                
            #     # --- CORRECTED FOOD_MATCH LOGIC ---
            #     # Check if the normalized donation food type is present in the recipient's normalized requested food types (set)
            #     food_match = int(donation_food_type_normalized in recipient_food_types_normalized)
            #     # --- END CORRECTED FOOD_MATCH LOGIC ---

            #     quantity_match = int(donation.quantity >= required_quantity)

            #     match_inputs.append({
            #         'food_match': food_match,
            #         'quantity_match': quantity_match,
            #         'distance': distance_km,
            #         # Add donation_food_encoded here IF your RF model explicitly uses it as a feature
            #         # 'donation_food_encoded': donation_food_encoded,
            #     })
            #     donor_donation_map.append((donation, donor))

            # if not match_inputs:
            #     return Response({"message": "No donations currently available for matching based on initial filters."}, status=200) # Changed to 200 for 'no results'

            # df = pd.DataFrame(match_inputs)
            
            # # Debugging DataFrame before prediction
            # logger.debug(f"DataFrame for prediction:\n{df.head()}")

            # predictions = rf_model.predict(df)
            
            # # Debugging predictions:
            # logger.debug(f"Raw predictions: {predictions}")


            # matched_details_for_response = []
            # notifications_to_send = []

            # channel_layer = get_channel_layer()

            # for i, pred in enumerate(predictions):
            #     if pred == 1: # If the model predicts a match
            #         donation, donor = donor_donation_map[i]
            #         match_input = match_inputs[i]

            #         existing_match = DonationMatch.objects.filter(
            #             donor=donor,
            #             recipient=recipient,
            #             donation=donation,
            #         ).first()

            #         if existing_match:
            #             logger.info(f"Skipping creation of duplicate match for {donor.user.name} and {recipient.user.name} for {donation.food_type}. Match ID: {existing_match.id}")
            #             matched_details_for_response.append({
            #                 'id': existing_match.id,
            #                 'donor_name': donor.user.name,
            #                 'recipient_name': recipient.user.name,
            #                 'food_type': existing_match.food_type,
            #                 'matched_quantity': existing_match.matched_quantity,
            #                 'food_description': existing_match.food_description,
            #                 'expiry_date': existing_match.expiry_date.isoformat(),
            #             })
            #             continue 
                    
            #         # Calculate match_score for the new match
            #         match_score = int((
            #             match_input['food_match'] * 0.4 +
            #             match_input['quantity_match'] * 0.3 +
            #             max(0, 1 - (match_input['distance'] / 50)) * 0.3
            #         ) * 100)

            #         actual_matched_quantity = min(donation.quantity, required_quantity)
                    
            #         new_match = DonationMatch.objects.create(
            #             donation=donation,
            #             donor=donor,
            #             recipient=recipient,
        #                 food_type=donation.food_type, # Store the actual donation food type
        #                 matched_quantity=actual_matched_quantity,
        #                 expiry_date=donation.expiry_date,
        #                 food_description=donation.food_description or f"Auto-matched donation from {donor.user.name}",
        #                 match_score=match_score,
        #             )

        #             matched_details_for_response.append({
        #                 'id': new_match.id, 
        #                 'donor_name': donor.user.name,
        #                 'recipient_name': recipient.user.name,
        #                 'food_type': donation.food_type,
        #                 'matched_quantity': actual_matched_quantity,
        #                 'food_description': donation.food_description,
        #                 'expiry_date': new_match.expiry_date.isoformat(),
        #             })

        #             notifications_to_send.append({
        #                 'group_name': f'user_{recipient.user.id}',
        #                 'message_content': {
        #                     'message': f"Great news! A donation of {donation.food_type} ({donation.quantity}kg) from {donor.user.name} has been matched for you!", # Use donation.quantity here as in original
        #                     'notification_type': 'match_found_recipient',
        #                     'data': {
        #                         'match_id': new_match.id,
        #                         'food_type': donation.food_type,
        #                         'matched_quantity': actual_matched_quantity,
        #                         'donor_name': donor.user.name,
        #                         'food_description': donation.food_description,
        #                     }
        #                 }
        #             })

        #             notifications_to_send.append({
        #                 'group_name': f'user_{donor.user.id}',
        #                 'message_content': {
        #                     'message': f"Your donation of {donation.food_type} ({donation.quantity}kg) has been matched with {recipient.user.name}!",
        #                     'notification_type': 'match_found_donor',
        #                     'data': {
        #                         'match_id': new_match.id,
        #                         'food_type': donation.food_type,
        #                         'donated_quantity': donation.quantity,
        #                         'recipient_name': recipient.user.name,
        #                         'food_description': donation.food_description,
        #                     }
        #                 }
        #             })

        #     for notif in notifications_to_send:
        #         async_to_sync(channel_layer.group_send)(
        #             notif['group_name'],
        #             {
        #                 "type": "send_notification",
        #                 "message": notif['message_content']['message'],
        #                 "notification_type": notif['message_content']['notification_type'],
        #                 "data": notif['message_content']['data']
        #             }
        #         )

        #     if not matched_details_for_response:
        #         return Response({'message': 'No suitable donations matched by the AI model.'}, status=200)

        #     return Response({'matches': matched_details_for_response}, status=200)

        # except Exception as e:
        #     logger.exception("Donation matching failed for user %s: %s", request.user, str(e))
        #     return Response({'error': 'An unexpected error occurred during matching.'}, status=500)

#  def get_ai_scored_donations(recipient, rf_model, le_food, top_n=5):
#     # ids of ALL matched donations regardless of claim status
#     already_matched_ids = DonationMatch.objects.filter(recipient=recipient).values_list('donation_id', flat=True)
#     # exclude claimed matches
#     potential_donations = Donation.objects.filter(
#         is_claimed=False,
#         quantity__gt=0,
#         expiry_date__gte=timezone.now().date(),
#         donor__lat__isnull=False,
#         donor__lng__isnull=False,
#     ).exclude(id__in=already_matched_ids).filter(
#         Q(food_type__icontains=recipient.required_food_type) |
#         Q(food_type__iexact=recipient.required_food_type)
#     ).select_related('donor')


#     recipient_food_encoded = le_food.transform([recipient.required_food_type])[0]
#     matches = []

#     for donation in potential_donations:
#         donor = donation.donor
#         distance_km = geodesic((recipient.lat, recipient.lng), (donor.lat, donor.lng)).km
#         if distance_km > 50:
#             continue

#         try:
#             donation_food_encoded = le_food.transform([donation.food_type.strip().lower()])[0]
#         except ValueError:
#             continue

#         features = pd.DataFrame([{
#             'food_match': int(recipient_food_encoded == donation_food_encoded),
#             'quantity_match': int(donation.quantity >= recipient.required_quantity),
#             'distance': distance_km,
#         }])

#         score = rf_model.predict_proba(features)[0][1]
#         # matches.append((score, donation))
#         # ensure donations with higher IDS come first
#         matches.append((score, -donation.id, donation))

#     matches.sort(reverse=True)
#     # return [donation for score, donation in matches[:top_n]]
#     # # When extracting, unpack the tuple correctly
#     return [donation for score, id_tie_breaker, donation in matches[:top_n]]


# def get_ai_scored_donations(recipient, rf_model, le_food): 
#     # le_food_donor for donor encoding if needed
#     #  ids of ALL matched donations regardless of claim status
#     already_matched_ids = DonationMatch.objects.filter(recipient=recipient).values_list('donation_id', flat=True)
#     # exclude claimed matches
#     donations = Donation.objects.filter(
#         is_claimed=False,
#         quantity__gt=0,
#         expiry_date__gte=timezone.now().date(),
#         donor__lat__isnull=False,
#         donor__lng__isnull=False,
#     ).exclude(id__in=already_matched_ids).filter(
#         Q(food_type__icontains=recipient.required_food_type) |
#         Q(food_type__iexact=recipient.required_food_type)
#     ).select_related('donor')

#     # recipient_food_types_normalized = le_food_donor
#     recipient_food_types_normalized = le_food.transform([recipient.required_food_type])[0]

#     scored_donations = []

#     for donation in donations:
#         donor = donation.donor
#         # 1. Determine food_match (boolean)
#         donor_food_type_normalized = donation.food_type.strip().lower()
#         food_match = donor_food_type_normalized in recipient_food_types_normalized

#         # 2. Determine quantity_match (boolean)
#         quantity_match = donation.quantity >= recipient.required_quantity

#         # 3. Determine distance
#         distance = float('inf')
#         if donor.lat is not None and donor.lng is not None and \
#            recipient.lat is not None and recipient.lng is not None:
#             distance = geodesic(
#                 (donor.lat, donor.lng),
#                 (recipient.lat, recipient.lng)
#             ).km

#         # 4. Prepare features for the model
#         features = pd.DataFrame([{
#             'food_match': int(food_match),        # Convert boolean to int (0 or 1)
#             'quantity_match': int(quantity_match), # Convert boolean to int (0 or 1)
#             'distance': distance
#         }])

#         # 5. Make prediction
#         try:
#             match_probability = rf_model.predict_proba(features)[:, 1][0]
#         except ValueError as e:
#             print(f"Error during prediction: {e}")
#             print(f"Features shape: {features.shape}, content: {features}")
#             match_probability = 0.0

#         donation.match_score = match_probability
#         scored_donations.append(donation)

#     scored_donations.sort(key=lambda d: d.match_score, reverse=True)
#     return scored_donations


# class DonationsMatch(APIView):
#     serializer_class = DonationSerializer
#     permission_classes = [IsAuthenticated]
#     throttle_classes = [UserRateThrottle]

#     def post(self, request):
#         rf_model, le_food, _, _ = get_matching_models()
#         try:
#             user = request.user
#             try:
#                 recipient = user.recipient_profile
#             except Recipient.DoesNotExist:
#                 return Response({'error': 'Recipient profile not found.'}, status=404)

#             data = request.data
#             # recipient_food = data.get('recipient_food_type', '').strip().lower()
#             recipient_food_types_raw = data.get('recipient_food_type')

#             if not recipient_food_types_raw:
#                 return Response({'error': 'recipient_food_type is required and cannot be empty.'}, status=400)

#             # Ensure it's a list. If the frontend sends a single string, or a JSON string of a list
#             # This part is crucial to handle various ways data might arrive
#             if isinstance(recipient_food_types_raw, str):
#                 try:
#                     # Attempt to parse it as a JSON string representing a list
#                     recipient_food_types = json.loads(recipient_food_types_raw)
#                     if not isinstance(recipient_food_types, list):
#                         raise ValueError("Decoded JSON is not a list.")
#                 except (json.JSONDecodeError, ValueError):
#                     # If it's a single string that's not JSON, treat it as a list with one item
#                     recipient_food_types = [recipient_food_types_raw]
#             elif isinstance(recipient_food_types_raw, list):
#                 recipient_food_types = recipient_food_types_raw
#             else:
#                 return Response({'error': 'recipient_food_type must be a string or a list of strings.'}, status=400)

#             # Normalize and validate each food type in the list
#             recipient_food_types_normalized = [ft.strip().lower() for ft in recipient_food_types]

            
#             # You might want to validate all requested food types against le_food.classes_
#             # before proceeding, to provide better error messages.
#             # supported_food_classes = le_food.classes
#             supported_food_classes = list(le_food.classes_)
#             unsupported_foods = [
#                 food for food in recipient_food_types_normalized
#                 if food not in supported_food_classes
#             ]
#             if unsupported_foods:
#                 return Response({
#                     'error': f"Unsupported food type(s) requested: {', '.join(unsupported_foods)}",
#                     'supported_types': supported_food_classes
#                 }, status=400)

#             required_quantity = float(data.get('required_quantity', 0))
#             recipient_lat = float(data.get('lat', recipient.lat))
#             recipient_lng = float(data.get('lng', recipient.lng))

#             # if not recipient_food:
#             #     return Response({'error': 'recipient_food_type is required.'}, status=400)
#             # if not required_quantity:
#             #     return Response({'error': 'required_quantity is required.'}, status=400)

#             # try:
#             #     recipient_food_encoded = le_food.transform([recipient_food])[0]
#             # except ValueError:
#             #     return Response({
#             #         'error': f"Unsupported food_type: '{recipient_food}'",
#             #         'supported_types': list(le_food.classes_)
#             #     }, status=400)

#             # ids of ALL matched donations regardless of claim status
#             already_matched_ids = DonationMatch.objects.filter(recipient=recipient).values_list('donation_id', flat=True)
#             # exclude claimed matches
#             donations = Donation.objects.filter(
#                 is_claimed=False,
#                 quantity__gt=0,
#                 expiry_date__gte=timezone.now().date(),
#                 donor__lat__isnull=False,
#                 donor__lng__isnull=False,
#             ).exclude(id__in=already_matched_ids).filter(
#                 # Q(food_type__icontains=recipient.required_food_type) |
#                 # Q(food_type__iexact=recipient.required_food_type)
#                 # match exactly as stored
#                 food_type__in=[f.capitalize() for f in recipient_food_types_normalized] 
#             ).select_related('donor')


#             match_inputs, donor_donation_map = [], []

#             for donation in donations:
#                 donor = donation.donor
#                 try:
#                     # donation_food_encoded = le_food.transform([donation.food_type.strip().lower()])[0]
#                     donation_food_type_normalized = donation.food_type.strip().lower()
#                     donation_food_encoded = le_food.transform([donation_food_type_normalized])[0]

#                 except ValueError:
#                     continue

#                 distance_km = geodesic((recipient_lat, recipient_lng), (donor.lat, donor.lng)).km
#                 # food_match = int(recipient_food_encoded == donation_food_encoded)
#                 # checking if donation's food type in requested recipient food types list
#                 food_match = int(donation_food_encoded in recipient_food_types_normalized)
#                 # donation_food_encoded = le_food.transform([donation_food_type_normalized])[0]
#                 quantity_match = int(donation.quantity >= required_quantity)

#                 match_inputs.append({
#                     'food_match': food_match,
#                     'quantity_match': quantity_match,
#                     'distance': distance_km,
#                 })
#                 donor_donation_map.append((donation, donor))

#             if not match_inputs:
#                 return Response({"message": "No donations currently available for matching based on initial filters."}, status=404)

#             df = pd.DataFrame(match_inputs)
#             predictions = rf_model.predict(df)

#             matched_details_for_response = []
#             notifications_to_send = []

#             channel_layer = get_channel_layer()

#             for i, pred in enumerate(predictions):
#                 if pred == 1:
#                     donation, donor = donor_donation_map[i]
#                     match_input = match_inputs[i]

#                     # check if instance exists first
#                     existing_match = DonationMatch.objects.filter(
#                         donor=donor,
#                         recipient=recipient,
#                         donation=donation,
#                     ).first()

#                     if existing_match:
#                         logger.info(f"Skipping creation of duplicate match for {donor.user.name} and {recipient.user.name} for {donation.food_type}. Match ID: {existing_match.id}")
#                         match_to_add_to_response = {
#                             'id': existing_match.id,
#                             'donor_name': donor.user.name,
#                             'recipient_name': recipient.user.name,
#                             'food_type': existing_match.food_type,
#                             'matched_quantity': existing_match.matched_quantity,
#                             'food_description': existing_match.food_description,
#                             'expiry_date': existing_match.expiry_date.isoformat(),
#                         }
#                         matched_details_for_response.append(match_to_add_to_response)
#                         continue 
#                     # --- DEDUPLICATION LOGIC END ---

#                     match_score = int((
#                         match_input['food_match'] * 0.4 +
#                         match_input['quantity_match'] * 0.3 +
#                         max(0, 1 - (match_input['distance'] / 50)) * 0.3
#                     ) * 100)

#                     actual_matched_quantity = min(donation.quantity, recipient.required_quantity)
#                     # exact or any quantity available in system
#                     # actual_matched_quantity = donation.quantity 

#                     # Create the new DonationMatch object in the database
#                     new_match = DonationMatch.objects.create(
#                         donation=donation,
#                         donor=donor,
#                         recipient=recipient,
#                         food_type=donation.food_type,
#                         # matched_quantity=required_quantity,
#                         # matched_quantity=donation.quantity,
#                         matched_quantity=actual_matched_quantity,
#                         expiry_date=donation.expiry_date,
#                         food_description=donation.food_description or f"Auto-matched donation from {donor.user.name}",
#                         match_score=match_score,
#                         # status=match_status
#                     )

#                     # Prepare data for API response (Dashboard display)
#                     matched_details_for_response.append({
#                         'id': new_match.id, 
#                         'donor_name': donor.user.name,
#                         'recipient_name': recipient.user.name,
#                         'food_type': donation.food_type,
#                         # 'matched_quantity': required_quantity,
#                         'matched_quantity': actual_matched_quantity,
#                         'food_description': donation.food_description,
#                         'expiry_date': donation.expiry_date.isoformat(),
#                         # 'status':donation.match_status
#                     })

#                     # --- Prepare data for real-time notifications ---
#                     # (Ensure these also use new_match.id where applicable)
#                     notifications_to_send.append({
#                         'group_name': f'user_{recipient.user.id}',
#                         'message_content': {
#                             'message': f"Great news! A donation of {donation.food_type} ({donation.uantity}kg) from {donor.user.name} has been matched for you!",
#                             'notification_type': 'match_found_recipient',
#                             'data': {
#                                 'match_id': new_match.id,
#                                 'food_type': donation.food_type,
#                                 'matched_quantity': actual_matched_quantity,
#                                 'donor_name': donor.user.name,
#                                 'food_description': donation.food_description,
#                             }
#                         }
#                     })

#                     notifications_to_send.append({
#                         'group_name': f'user_{donor.user.id}',
#                         'message_content': {
#                             'message': f"Your donation of {donation.food_type} ({donation.quantity}kg) has been matched with {recipient.user.name}!",
#                             'notification_type': 'match_found_donor',
#                             'data': {
#                                 'match_id': new_match.id,
#                                 'food_type': donation.food_type,
#                                 # 'donated_quantity': donation.quantity,
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
#                         "type": "send_notification",
#                         "message": notif['message_content']['message'],
#                         "notification_type": notif['message_content']['notification_type'],
#                         "data": notif['message_content']['data']
#                     }
#                 )

#             if not matched_details_for_response:
#                 # return Response({'message': 'No suitable donations matched by the AI model.'}, status=204)
#                 return Response({'message': 'No suitable donations matched by the AI model.'}, status=200)

#             return Response({'matches': matched_details_for_response}, status=200)

#         except Exception as e:
#             logger.exception("Donation matching failed for user %s: %s", request.user, str(e))
#             return Response({'error': 'An unexpected error occurred during matching.'}, status=500)


