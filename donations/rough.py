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




# s DonationsMatch(APIView):
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
