from knox.auth import TokenAuthentication
import logging
logger = logging.getLogger(__name__)

class CookieTokenAuthentication(TokenAuthentication):
    def authenticate(self, request):
        # Check for token in 'Authorization' header first (standard)
        auth_header = super().authenticate(request)
        if auth_header:
            return auth_header

        # Fallback: Check in cookies
        token = request.COOKIES.get('auth_token')
        if token:
            logger.info(f"Token from cookies: {token} (type: {type(token)})")
            if isinstance(token, str):
              token = token.encode('utf-8')
            return self.authenticate_credentials(token)

        return None