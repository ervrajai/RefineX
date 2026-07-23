import secrets
import logging
from datetime import timedelta
from smtplib import SMTPException

from django.conf import settings
from django.contrib.auth import login, update_session_auth_hash
from django.core.mail import BadHeaderError, send_mail
from django.utils import timezone

from .models import User, UserProfile
from apps.core.services import ActivityService

logger = logging.getLogger(__name__)

OTP_TIMEOUT_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 30


class OtpService:
    @staticmethod
    def session_key(purpose):
        return f"{purpose}_otp"

    @staticmethod
    def generate_otp():
        return f"{secrets.randbelow(1_000_000):06d}"

    @classmethod
    def store_otp(cls, request, purpose, email, otp, extra=None):
        request.session[cls.session_key(purpose)] = {
            "email": email.lower(),
            "otp": otp,
            "expires_at": (timezone.now() + timedelta(minutes=OTP_TIMEOUT_MINUTES)).isoformat(),
            "last_sent_at": timezone.now().isoformat(),
            "verified": False,
            "attempts": 0,
            "extra": extra or {},
        }
        request.session.modified = True

    @classmethod
    def get_otp_record(cls, request, purpose):
        record = request.session.get(cls.session_key(purpose))
        if not record:
            return None, "No active OTP request found."

        expires_at = timezone.datetime.fromisoformat(record["expires_at"])
        if timezone.now() > expires_at:
            cls.clear_otp(request, purpose)
            return None, "OTP expired. Please request a new one."

        if record.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
            cls.clear_otp(request, purpose)
            return None, "Too many failed attempts. Please request a new OTP."

        return record, None

    @classmethod
    def clear_otp(cls, request, purpose):
        request.session.pop(cls.session_key(purpose), None)
        request.session.modified = True

    @staticmethod
    def send_otp_email(email, otp, subject):
        message = (
            f"Your Refinex verification code is {otp}. "
            f"It expires in {OTP_TIMEOUT_MINUTES} minutes."
        )
        sent_count = send_mail(
            subject,
            message,
            getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@refinex.local"),
            [email],
            fail_silently=False,
        )
        if sent_count != 1:
            raise SMTPException("OTP email was not accepted by SMTP gateway.")


class UserService:
    @staticmethod
    def update_profile(user, data, request=None):
        """
        Updates user first_name, last_name, username, profile_picture and UserProfile details.
        """
        first_name = data.get("first_name", user.first_name).strip()
        last_name = data.get("last_name", user.last_name).strip()
        username = data.get("username", user.username)
        profile_picture = data.get("profile_picture", user.profile_picture)
        avatar = data.get("avatar")

        if username and username != user.username:
            username = username.strip().lower()
            if User.objects.filter(username__iexact=username).exclude(id=user.id).exists():
                raise ValueError("This username is already taken.")
            user.username = username

        user.first_name = first_name
        user.last_name = last_name

        if profile_picture is not None:
            user.profile_picture = profile_picture

        user.save()

        # Update UserProfile model as well
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if avatar is not None:
            profile.avatar = avatar
        if "bio" in data:
            profile.bio = data["bio"]
        if "phone" in data:
            profile.phone = data["phone"]
        if "organization" in data:
            profile.organization = data["organization"]
        if "job_title" in data:
            profile.job_title = data["job_title"]
        profile.save()

        ActivityService.log_activity(
            user=user,
            action_type="update_profile",
            title="Profile Updated",
            description="User updated profile details.",
            request=request
        )

        return user


class AccountSecurityService:
    @staticmethod
    def change_password(user, old_password, new_password, request=None):
        """
        Validates old password and sets new password.
        """
        if not user.check_password(old_password):
            raise ValueError("Current password is incorrect.")

        if user.check_password(new_password):
            raise ValueError("New password cannot be identical to the old password.")

        user.set_password(new_password)
        user.password_last_updated = timezone.now()
        user.save()

        if request is not None:
            django_request = getattr(request, "_request", request)
            user.backend = "django.contrib.auth.backends.ModelBackend"
            update_session_auth_hash(django_request, user)
            login(django_request, user)

        ActivityService.log_activity(
            user=user,
            action_type="change_password",
            title="Password Changed",
            description="User changed account security password.",
            request=request
        )
        return user
