from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_refresh"


class LogoutView(APIView):
    """Revoke the caller's refresh token, including on another device."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        raw_refresh = request.data.get("refresh")
        if not isinstance(raw_refresh, str) or not raw_refresh:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(raw_refresh)
            if str(token.get("user_id")) != str(request.user.pk):
                return Response({"detail": "Refresh token belongs to another account."}, status=status.HTTP_403_FORBIDDEN)
            token.blacklist()
        except TokenError:
            # An already revoked or expired token cannot be used again.
            return Response({"detail": "Refresh token is invalid or already revoked."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)
