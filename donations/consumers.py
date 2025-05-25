# # USING TOKEN FROM DRF
# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from rest_framework.authtoken.models import Token # For token authentication

# class NotificationConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         # Authenticate the user from the token in the URL or headers (more complex)
#         # For simplicity, we'll assume the token is passed in the URL for now.
#         # A more secure way would be to pass it in a header and parse it.
#         query_string = self.scope['query_string'].decode()
#         token_key = None
#         for param in query_string.split('&'):
#             if param.startswith('token='):
#                 token_key = param.split('=')[1]
#                 break

#         self.user = None
#         if token_key:
#             self.user = await self.get_user_from_token(token_key)

#         if self.user and self.user.is_authenticated:
#             self.user_group_name = f'user_{self.user.id}'
#             await self.channel_layer.group_add(
#                 self.user_group_name,
#                 self.channel_name
#             )
#             await self.accept()
#             print(f"WebSocket connected for user: {self.user.name} (Group: {self.user_group_name})")
#         else:
#             print("WebSocket connection refused: User not authenticated.")
#             await self.close()

#     async def disconnect(self, close_code):
#         if self.user and self.user.is_authenticated:
#             print(f"WebSocket disconnected for user: {self.user.name}")
#             await self.channel_layer.group_discard(
#                 self.user_group_name,
#                 self.channel_name
#             )

#     # Receive message from WebSocket (not used for this specific notification flow, but good to have)
#     async def receive(self, text_data):
#         # We don't expect messages from the client in this notification-only scenario,
#         # but you could implement chat-like features here.
#         pass

#     # Receive message from channel layer (e.g., from your API view)
#     async def send_notification(self, event):
#         message = event['message']
#         notification_type = event.get('notification_type', 'info') # e.g., 'match_found', 'update'
#         notification_data = event.get('data', {})

#         # Send message to WebSocket
#         await self.send(text_data=json.dumps({
#             'message': message,
#             'type': notification_type,
#             'data': notification_data
#         }))

#     @database_sync_to_async
#     def get_user_from_token(self, token_key):
#         try:
#             token = Token.objects.select_related('user').get(key=token_key)
#             return token.user
#         except Token.DoesNotExist:
#             return None



# USING TOKEN FROM REST KNOX
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from knox.models import AuthToken
from django.utils import timezone
from django.conf import settings
import hashlib

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        token_key = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token_key = param.split('=')[1]
                break

        self.user = None
        if token_key:
            self.user = await self.get_user_from_knox_token(token_key)

        if self.user and self.user.is_authenticated:
            self.user_group_name = f'user_{self.user.id}'
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            await self.accept()
            print(f"WebSocket connected for user: {self.user.name} (Group: {self.user_group_name})")
        else:
            print("WebSocket connection refused: User not authenticated or token invalid/expired.")
            await self.close()

    async def disconnect(self, close_code):
        if self.user and self.user.is_authenticated:
            print(f"WebSocket disconnected for user: {self.user.name}")
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        pass

    async def send_notification(self, event):
        message = event['message']
        notification_type = event.get('notification_type', 'info')
        notification_data = event.get('data', {})

        await self.send(text_data=json.dumps({
            'message': message,
            'type': notification_type,
            'data': notification_data
        }))

    @database_sync_to_async
    def get_user_from_knox_token(self, full_token_string):
        """
        Authenticates a user using a Knox token string.
        `full_token_string` is the complete token received from the client.
        """
        try:
            # Get the expected token key length from settings
            knox_token_key_length = settings.REST_KNOX.get('TOKEN_KEY_LENGTH', 15)
            
            # The token_key in the DB is the prefix of the full token string
            # that's provided to the client.
            token_key_prefix = full_token_string[:knox_token_key_length]

            # The digest is the SHA hash of the full token string.
            # We need to hash the incoming full_token_string to compare it to the stored digest.
            secure_hash_algorithm = settings.REST_KNOX.get('SECURE_HASH_ALGORITHM', hashlib.sha512)
            
            # Ensure the algorithm is callable (from hashlib, as we fixed before)
            if not callable(secure_hash_algorithm):
                 raise ValueError("SECURE_HASH_ALGORITHM in settings must be a callable hash function (e.g., hashlib.sha512)")

            # Compute the digest of the incoming token string
            hashed_token = secure_hash_algorithm(full_token_string.encode('utf-8')).hexdigest()

            # Now, query for the token using both the token_key (prefix) and the computed digest
            # This is how Knox primarily validates tokens.
            token = AuthToken.objects.filter(
                token_key=token_key_prefix,
                digest=hashed_token
            ).select_related('user').first() # Use select_related to eager-load user

            if token:
                # Check for token expiry
                if token.expiry > timezone.now():
                    return token.user
                else:
                    # Token expired, delete it for cleanup
                    token.delete()
                    print(f"Knox token {token_key_prefix}... expired for user {token.user.name if token.user else 'Unknown'}.")
                    return None
            else:
                print(f"Knox token not found or digest mismatch for key prefix {token_key_prefix}...")
                return None
        except Exception as e:
            # Catching a broader exception to log any issues during token processing
            print(f"Error authenticating Knox token: {e}")
            return None
