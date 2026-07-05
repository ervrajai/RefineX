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
    def pre_social_login(self, request, sociallogin):
        email = (sociallogin.user.email or "").lower()
        provider = sociallogin.account.provider

        if not email or sociallogin.is_existing:
            return

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            sociallogin.user.auth_provider = provider
            return

        sociallogin.connect(request, user)
        user.auth_provider = user.auth_provider or User.AuthProvider.EMAIL
        user.save(update_fields=["auth_provider"])

    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form)
        provider = sociallogin.account.provider
        if provider in dict(User.AuthProvider.choices):
            user.auth_provider = provider
            user.save(update_fields=["auth_provider"])
        return user

    def authentication_error(
        self,
        request,
        provider_id,
        error=None,
        exception=None,
        extra_context=None,
    ):
        raise ImmediateHttpResponse(
            JsonResponse(
                {"detail": "OAuth authentication failed. Please try again."},
                status=400,
            )
        )
