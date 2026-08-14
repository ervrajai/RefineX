import os
import secrets
from smtplib import SMTPException
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.core.mail import BadHeaderError, send_mail
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from apps.core.services import ActivityService
from .serializers import (
    CompleteSignupSerializer,
    ForgotPasswordOtpRequestSerializer,
    LoginSerializer,
    OtpVerifySerializer,
    ResetPasswordSerializer,
    SignupOtpRequestSerializer,
    UserSerializer,
)

UserModel = get_user_model()
OTP_TIMEOUT_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 30


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return


def _otp_session_key(purpose):
    return f"{purpose}_otp"


def _generate_otp():
    return f"{secrets.randbelow(1_000_000):06d}"


def _expires_at():
    return (timezone.now() + timedelta(minutes=OTP_TIMEOUT_MINUTES)).isoformat()


def _clear_otp(request, purpose):
    request.session.pop(_otp_session_key(purpose), None)
    request.session.modified = True


def _store_otp(request, purpose, *, email, otp, extra=None):
    request.session[_otp_session_key(purpose)] = {
        "email": email.lower(),
        "otp": otp,
        "expires_at": _expires_at(),
        "last_sent_at": timezone.now().isoformat(),
        "verified": False,
        "attempts": 0,
        "extra": extra or {},
    }
    request.session.modified = True


def _get_otp_record(request, purpose):
    record = request.session.get(_otp_session_key(purpose))
    if not record:
        return None, "No active OTP request found."

    expires_at = timezone.datetime.fromisoformat(record["expires_at"])
    if timezone.now() > expires_at:
        _clear_otp(request, purpose)
        return None, "OTP expired. Please request a new one."

    if record.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
        _clear_otp(request, purpose)
        return None, "Too many OTP attempts. Please request a new one."

    return record, None


def _resend_cooldown_response(request, purpose, email):
    record = request.session.get(_otp_session_key(purpose))
    if not record or record.get("email") != email.lower():
        return None

    last_sent_at = record.get("last_sent_at")
    if not last_sent_at:
        return None

    elapsed = (timezone.now() - timezone.datetime.fromisoformat(last_sent_at)).total_seconds()
    remaining = OTP_RESEND_COOLDOWN_SECONDS - int(elapsed)
    if remaining <= 0:
        return None

    return Response(
        {
            "detail": f"Please wait {remaining} seconds before requesting another OTP.",
            "retry_after": remaining,
        },
        status=status.HTTP_429_TOO_MANY_REQUESTS,
    )


from django.template.loader import render_to_string
from django.utils.html import strip_tags

PURPOSE_EMAIL_CONFIG = {
    "signup": {
        "template": "emails/signup_otp.html",
        "subject": "Verify your RefineX signup",
    },
    "password_reset": {
        "template": "emails/password_reset_otp.html",
        "subject": "Reset your RefineX password",
    },
    "delete_account": {
        "template": "emails/delete_account_otp.html",
        "subject": "Confirm RefineX Account Deletion",
    },
}


import base64
import logging
import os
import smtplib
import ssl
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests

logger = logging.getLogger(__name__)


def _send_email_via_gmail_api(to_email, subject, html_content, text_content):
    """
    Sends email directly via official Google Gmail REST API over HTTPS (Port 443).
    100% Google, zero SMTP port block issues on cloud hosts.
    """
    refresh_token = os.getenv("GMAIL_REFRESH_TOKEN", "").strip().strip("'\"")
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip().strip("'\"")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip().strip("'\"")
    user_email = getattr(settings, "EMAIL_HOST_USER", "refinexteam@gmail.com") or "refinexteam@gmail.com"

    if not (refresh_token and client_id and client_secret):
        return False

    try:
        # 1. Get short-lived Access Token from Google OAuth2 Endpoint
        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=8,
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            logger.error(f"[GMAIL API TOKEN ERROR] Failed to fetch access token: {token_data}")
            return False

        # 2. Build RFC 2822 Multipart Email
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"RefineX <{user_email}>"
        msg["To"] = to_email

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        raw_b64 = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")

        # 3. POST to Google Gmail Send API (HTTPS Port 443)
        send_resp = requests.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={"raw": raw_b64},
            timeout=8,
        )
        if send_resp.status_code in (200, 201):
            logger.info(f"[GMAIL API HTTPS 443] Successfully delivered OTP email to {to_email}")
            return True
        else:
            logger.error(f"[GMAIL API SEND ERROR {send_resp.status_code}] {send_resp.text}")
            return False
    except Exception as e:
        logger.error(f"[GMAIL API EXCEPTION] {e}")
        return False


def _send_email_direct_smtp(to_email, subject, html_content, text_content):
    """
    Primary: Google Gmail HTTPS API (Port 443).
    Secondary Fallback: Google SMTP (Port 465 / 587).
    """
    # 1. Try Official Google Gmail API over HTTPS (Port 443)
    if _send_email_via_gmail_api(to_email, subject, html_content, text_content):
        return True

    # 2. Fallback to Direct SMTP
    user = getattr(settings, "EMAIL_HOST_USER", "refinexteam@gmail.com") or "refinexteam@gmail.com"
    password = getattr(settings, "EMAIL_HOST_PASSWORD", "apbmgkakcgclllqv") or "apbmgkakcgclllqv"
    from_header = f"RefineX <{user}>"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = to_email

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    # Attempt 1: Port 465 (SSL)
    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx, timeout=8) as server:
            server.login(user, password)
            server.sendmail(user, [to_email], msg.as_string())
            logger.info(f"[SMTP 465] Successfully delivered email to {to_email}")
            return True
    except Exception as ssl_err:
        logger.warning(f"[SMTP 465 Error] {ssl_err}. Retrying via Port 587 STARTTLS...")

    # Attempt 2: Port 587 (STARTTLS)
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=8) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(user, [to_email], msg.as_string())
            logger.info(f"[SMTP 587] Successfully delivered email to {to_email}")
            return True
    except Exception as tls_err:
        logger.error(f"[SMTP FAILED] Could not send email to {to_email}: {tls_err}")
        return False

def _send_otp(email, otp, subject, purpose="signup"):
    config = PURPOSE_EMAIL_CONFIG.get(purpose, PURPOSE_EMAIL_CONFIG["signup"])
    final_subject = subject or config["subject"]
    context = {"otp_code": otp}
    html_message = render_to_string(config["template"], context)
    text_message = strip_tags(html_message)

    # Send in a daemon background thread so the HTTP API response is immediate (<50ms)
    t = threading.Thread(
        target=_send_email_direct_smtp,
        args=(email, final_subject, html_message, text_message),
        daemon=True,
    )
    t.start()

def _otp_email_error_response():
    return Response(
        {"detail": "Could not send OTP email right now. Please try again in a moment."},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


def _provider_label(provider):
    return dict(User.AuthProvider.choices).get(provider, provider.title())


class GetCSRFTokenView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({"detail": "CSRF cookie set successfully."})

@method_decorator(csrf_exempt, name='dispatch')
class SignupOtpRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        serializer = SignupOtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = data["email"].lower()

        existing_user = UserModel.objects.filter(email__iexact=email).first()
        if existing_user:
            if existing_user.auth_provider != User.AuthProvider.EMAIL:
                provider = _provider_label(existing_user.auth_provider)
                return Response(
                    {"detail": f"You already signed up with {provider}. Please log in using that method."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"detail": "An account with this email already exists. Please log in instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cooldown_response = _resend_cooldown_response(request, "signup", email)
        if cooldown_response:
            return cooldown_response

        otp = _generate_otp()
        try:
            _send_otp(email, otp, "Verify your RefineX signup", purpose="signup")
        except Exception as exc:
            logger.error(f"[SIGNUP OTP ERROR] {exc}")
            return _otp_email_error_response()

        _store_otp(
            request,
            "signup",
            email=email,
            otp=otp,
            extra={
                "first_name": data["first_name"],
                "last_name": data.get("last_name", ""),
            },
        )
        return Response({"detail": "OTP sent to your email."})


@method_decorator(csrf_exempt, name='dispatch')
class SignupOtpVerifyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record, error = _get_otp_record(request, "signup")
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"].lower()
        if record["email"] != email:
            return Response({"detail": "OTP does not match this email."}, status=status.HTTP_400_BAD_REQUEST)

        if not secrets.compare_digest(record["otp"], serializer.validated_data["otp"]):
            record["attempts"] = record.get("attempts", 0) + 1
            request.session[_otp_session_key("signup")] = record
            request.session.modified = True
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        record["verified"] = True
        request.session[_otp_session_key("signup")] = record
        request.session.modified = True
        return Response({"detail": "OTP verified."})


@method_decorator(csrf_exempt, name='dispatch')
class CompleteSignupView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        serializer = CompleteSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        record, error = _get_otp_record(request, "signup")
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        if record["email"] != email or not record.get("verified"):
            return Response({"detail": "Please verify your signup OTP first."}, status=status.HTTP_400_BAD_REQUEST)

        if UserModel.objects.filter(email__iexact=email).exists():
            _clear_otp(request, "signup")
            return Response({"detail": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = UserModel.objects.create_user(
            email=email,
            password=serializer.validated_data["password"],
            first_name=record["extra"].get("first_name", ""),
            last_name=record["extra"].get("last_name", ""),
            auth_provider=User.AuthProvider.EMAIL,
            is_email_verified=True,
        )
        user.backend = 'django.contrib.auth.backends.ModelBackend'

        guest_id = request.data.get("guest_id") or request.headers.get("X-Guest-ID")
        if guest_id:
            from apps.cleaning.models import Dataset, CleaningJob
            Dataset.objects.filter(guest_id=guest_id, user__isnull=True).update(user=user)
            CleaningJob.objects.filter(dataset__guest_id=guest_id, user__isnull=True).update(user=user)

        login(request, user)
        _clear_otp(request, "signup")
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)



@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        email = (request.data.get("email") or "").lower().strip()
        password = request.data.get("password") or ""
        first_name = request.data.get("first_name") or ""
        last_name = request.data.get("last_name") or ""
        guest_id = request.data.get("guest_id") or request.headers.get("X-Guest-ID")

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if UserModel.objects.filter(email__iexact=email).exists():
            return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = UserModel.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            auth_provider=User.AuthProvider.EMAIL,
            is_email_verified=True,
        )
        user.backend = 'django.contrib.auth.backends.ModelBackend'

        if guest_id:
            from apps.cleaning.models import Dataset, CleaningJob
            Dataset.objects.filter(guest_id=guest_id, user__isnull=True).update(user=user)
            CleaningJob.objects.filter(dataset__guest_id=guest_id, user__isnull=True).update(user=user)

        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)



@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        
        django_request = getattr(request, "_request", request)
        user.backend = "django.contrib.auth.backends.ModelBackend"
        login(django_request, user, backend="django.contrib.auth.backends.ModelBackend")
        
        django_request.session.set_expiry(60 * 60 * 24 * 30 if serializer.validated_data.get("remember_me") else 0)

        guest_id = request.data.get("guest_id") or request.headers.get("X-Guest-ID")
        if guest_id:
            from apps.cleaning.models import Dataset, CleaningJob
            Dataset.objects.filter(guest_id=guest_id, user__isnull=True).update(user=user)
            CleaningJob.objects.filter(dataset__guest_id=guest_id, user__isnull=True).update(user=user)


        ActivityService.log_activity(
            user=user,
            action_type="login",
            title="User Signed In",
            description=f"Logged in via {user.auth_provider}.",
            request=request
        )


        return Response(UserSerializer(user).data)


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response(None, status=status.HTTP_200_OK)
        return Response(UserSerializer(request.user).data)


@method_decorator(csrf_exempt, name='dispatch')
class ForgotPasswordOtpRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        serializer = ForgotPasswordOtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        user = UserModel.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {"detail": "User with this email does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.auth_provider != User.AuthProvider.EMAIL:
            provider = _provider_label(user.auth_provider)
            return Response(
                {"detail": f"This account is associated with {provider}. Please log in using {provider} instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cooldown_response = _resend_cooldown_response(request, "password_reset", email)
        if cooldown_response:
            return cooldown_response

        otp = _generate_otp()
        try:
            _send_otp(email, otp, "Reset your RefineX password", purpose="password_reset")
        except Exception as exc:
            logger.error(f"[FORGOT PASSWORD OTP ERROR] {exc}")
            return _otp_email_error_response()

        _store_otp(request, "password_reset", email=email, otp=otp)
        return Response({"detail": "OTP has been sent to your email."})


@method_decorator(csrf_exempt, name='dispatch')
class ForgotPasswordOtpVerifyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record, error = _get_otp_record(request, "password_reset")
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"].lower()
        if record["email"] != email:
            return Response({"detail": "OTP does not match this email."}, status=status.HTTP_400_BAD_REQUEST)

        if not secrets.compare_digest(record["otp"], serializer.validated_data["otp"]):
            record["attempts"] = record.get("attempts", 0) + 1
            request.session[_otp_session_key("password_reset")] = record
            request.session.modified = True
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        record["verified"] = True
        request.session[_otp_session_key("password_reset")] = record
        request.session.modified = True
        return Response({"detail": "OTP verified."})


@method_decorator(csrf_exempt, name='dispatch')
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        record, error = _get_otp_record(request, "password_reset")
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        if record["email"] != email or not record.get("verified"):
            return Response({"detail": "Please verify your password reset OTP first."}, status=status.HTTP_400_BAD_REQUEST)

        user = UserModel.objects.filter(email__iexact=email).first()
        if user:
            if user.check_password(serializer.validated_data["password"]):
                return Response(
                    {"detail": "New password cannot be the same as your old password."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data["password"])
            user.password_last_updated = timezone.now()
            user.save()
            logout(request)
        _clear_otp(request, "password_reset")
        return Response({"detail": "Password reset successfully. Please log in with your new password."})


from .services import UserService, AccountSecurityService, OtpService
from .serializers import (
    UpdateProfileSerializer,
    ChangePasswordSerializer,
)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, "profile", None)
        avatar = profile.avatar if profile else (user.profile_picture or "")
        return Response({
            "id": user.id,
            "uuid": str(user.uuid),
            "email": user.email,
            "username": user.username or (user.email.split("@")[0] if user.email else ""),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "profile_picture": user.profile_picture,
            "avatar": avatar,
            "auth_provider": user.auth_provider,
            "is_email_verified": user.is_email_verified,
            "date_joined": user.date_joined or user.created_at,
            "created_at": user.created_at,
            "password_last_updated": user.password_last_updated,
        })

    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            user = UserService.update_profile(request.user, serializer.validated_data, request=request)
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({"detail": str(err)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class VerifyPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        password = request.data.get("password")
        if not password:
            return Response({"valid": False, "detail": "Current password is required."}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.check_password(password):
            return Response({"valid": True, "detail": "Current password verified."}, status=status.HTTP_200_OK)
        return Response({"valid": False, "detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            AccountSecurityService.change_password(
                user=request.user,
                old_password=data["old_password"],
                new_password=data["new_password"],
                request=request
            )
            return Response({
                "detail": "Password updated successfully.",
                "user": UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({"detail": str(err)}, status=status.HTTP_400_BAD_REQUEST)




@method_decorator(csrf_exempt, name='dispatch')
class DeleteAccountOtpRequestView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        user = request.user
        email = user.email.lower()

        cooldown_response = _resend_cooldown_response(request, "delete_account", email)
        if cooldown_response:
            return cooldown_response

        otp = _generate_otp()
        try:
            _send_otp(email, otp, "Confirm RefineX Account Deletion", purpose="delete_account")
        except Exception as exc:
            logger.error(f"[DELETE ACCOUNT OTP ERROR] {exc}")
            return _otp_email_error_response()

        _store_otp(request, "delete_account", email=email, otp=otp)
        return Response({"detail": f"OTP sent to {email}"})


@method_decorator(csrf_exempt, name='dispatch')
class DeleteAccountConfirmView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        user = request.user
        provider = user.auth_provider

        if provider == User.AuthProvider.EMAIL:
            password = (request.data.get("password") or "").strip()
            if not password:
                return Response({"detail": "Password is required to delete account."}, status=status.HTTP_400_BAD_REQUEST)
            if not user.check_password(password):
                return Response({"detail": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            otp = request.data.get("otp")
            if not otp:
                return Response({"detail": "OTP is required to delete account."}, status=status.HTTP_400_BAD_REQUEST)
            record, error = _get_otp_record(request, "delete_account")
            if error:
                return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

            if record["email"] != user.email.lower():
                return Response({"detail": "OTP does not match this account email."}, status=status.HTTP_400_BAD_REQUEST)

            if not secrets.compare_digest(record["otp"], str(otp)):
                record["attempts"] = record.get("attempts", 0) + 1
                request.session[_otp_session_key("delete_account")] = record
                request.session.modified = True
                return Response({"detail": "Invalid OTP verification code."}, status=status.HTTP_400_BAD_REQUEST)

            _clear_otp(request, "delete_account")

        # Permanently erase dataset files and model files from storage
        for ds in user.datasets.all():
            if ds.original_file:
                try:
                    ds.original_file.delete(save=False)
                except Exception:
                    pass
            if ds.cleaned_file:
                try:
                    ds.cleaned_file.delete(save=False)
                except Exception:
                    pass

        if hasattr(user, "model_training_jobs"):
            for job in user.model_training_jobs.all():
                if job.trained_model_file:
                    try:
                        job.trained_model_file.delete(save=False)
                    except Exception:
                        pass

        # Delete database records (CASCADE deletes datasets, cleaning jobs, training jobs, graphs, profile)
        logout(request)
        user.delete()
        return Response({"detail": "Account and all associated files deleted successfully."}, status=status.HTTP_200_OK)



