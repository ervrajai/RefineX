import os
from django.conf import settings
from allauth.account.adapter import DefaultAccountAdapter
from allauth.core.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from django.http import JsonResponse

User = get_user_model()


def _get_frontend_base_url(request=None):
    env_url = os.getenv("FRONTEND_BASE_URL")
    if env_url and env_url.strip():
        return env_url.strip().rstrip("/")
    if request:
        origin = request.headers.get("origin") or request.META.get("HTTP_ORIGIN")
        if origin and "onrender.com" not in origin:
            return origin.rstrip("/")
        referer = request.headers.get("referer") or request.META.get("HTTP_REFERER")
        if referer and "onrender.com" not in referer:
            from urllib.parse import urlparse
            p = urlparse(referer)
            if p.scheme and p.netloc:
                return f"{p.scheme}://{p.netloc}"
    return getattr(settings, "FRONTEND_BASE_URL", "https://refinex-kappa.vercel.app").rstrip("/")


class RefinexAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return True

    def get_login_redirect_url(self, request):
        base = _get_frontend_base_url(request)
        return f"{base}/dashboard"

    def get_logout_redirect_url(self, request):
        base = _get_frontend_base_url(request)
        return f"{base}/login"


class RefinexSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_login_redirect_url(self, request):
        base = _get_frontend_base_url(request)
        return f"{base}/dashboard"

    def get_connect_redirect_url(self, request, socialaccount):
        base = _get_frontend_base_url(request)
        return f"{base}/dashboard"
    def _update_user_from_social(self, user, sociallogin):
        provider = sociallogin.account.provider
        extra_data = sociallogin.account.extra_data or {}

        # Set provider
        if not user.auth_provider or user.auth_provider == User.AuthProvider.EMAIL:
            if provider in dict(User.AuthProvider.choices):
                user.auth_provider = provider

        # Update social ID (Google 'sub', GitHub 'id')
        social_id = extra_data.get("sub") or extra_data.get("id")
        if social_id:
            user.social_id = str(social_id)

        # Update profile picture
        profile_picture = extra_data.get("picture") or extra_data.get("avatar_url")
        if profile_picture:
            user.profile_picture = profile_picture

        # Update first and last name if they aren't set
        if not user.first_name:
            if provider == "google":
                user.first_name = extra_data.get("given_name", "")
                user.last_name = extra_data.get("family_name", "")
            elif provider == "github":
                full_name = extra_data.get("name", "") or ""
                if full_name:
                    parts = full_name.split(" ", 1)
                    user.first_name = parts[0]
                    if len(parts) > 1:
                        user.last_name = parts[1]

        # Verify email since they authenticated via Google/GitHub
        user.is_email_verified = True

    def pre_social_login(self, request, sociallogin):
        email = (sociallogin.user.email or "").lower()
        provider = sociallogin.account.provider

        if not email or sociallogin.is_existing:
            return

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            self._update_user_from_social(sociallogin.user, sociallogin)
            return

        sociallogin.connect(request, user)
        self._update_user_from_social(user, sociallogin)
        user.save()

    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form)
        self._update_user_from_social(user, sociallogin)
        user.save()
        return user

    def on_authentication_error(
        self,
        request,
        provider,
        error=None,
        exception=None,
        extra_context=None,
    ):
        import logging
        logger = logging.getLogger(__name__)
        logger.error(
            f"OAuth Authentication Error - Provider: {provider}, "
            f"Error: {error}, Exception: {exception}, Context: {extra_context}"
        )
        print(f"\n--- OAuth Authentication Error Details ---")
        print(f"Provider: {provider}")
        print(f"Error: {error}")
        print(f"Exception: {exception}")
        print(f"Extra Context: {extra_context}")
        print(f"-----------------------------------------\n")
        raise ImmediateHttpResponse(
            JsonResponse(
                {"detail": f"OAuth authentication failed: {error or exception or 'Unknown error'}. Please try again."},
                status=400,
            )
        )
