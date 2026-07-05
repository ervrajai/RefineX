from allauth.account.adapter import DefaultAccountAdapter
from allauth.core.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from django.http import JsonResponse

User = get_user_model()


class RefinexAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        return True


class RefinexSocialAccountAdapter(DefaultSocialAccountAdapter):
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
