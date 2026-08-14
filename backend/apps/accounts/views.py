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


import logging
logger = logging.getLogger(__name__)
from django.core.mail import get_connection, EmailMultiAlternatives

def _send_otp(email, otp, subject, purpose="signup"):
    config = PURPOSE_EMAIL_CONFIG.get(purpose, PURPOSE_EMAIL_CONFIG["signup"])
    final_subject = subject or config["subject"]
    context = {"otp_code": otp}
    html_message = render_to_string(config["template"], context)
    text_message = strip_tags(html_message)

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", getattr(settings, "EMAIL_HOST_USER", "refinexteam@gmail.com"))
    
    # 1. Attempt using configured settings
    try:
        msg = EmailMultiAlternatives(final_subject, text_message, from_email, [email])
        msg.attach_alternative(html_message, "text/html")
        sent = msg.send(fail_silently=False)
        if sent >= 1:
            return
    except Exception as first_err:
        logger.warning(f"Primary email connection failed ({first_err}). Attempting fallback port...")
        print(f"Primary email connection failed ({first_err}). Attempting fallback port...")
        
        # 2. Attempt using alternate TLS/SSL port
        try:
            curr_use_ssl = getattr(settings, "EMAIL_USE_SSL", False)
            fallback_port = 587 if curr_use_ssl else 465
            fallback_use_tls = curr_use_ssl
            fallback_use_ssl = not curr_use_ssl
            
            fallback_connection = get_connection(
                backend="django.core.mail.backends.smtp.EmailBackend",
                host=getattr(settings, "EMAIL_HOST", "smtp.gmail.com"),
                port=fallback_port,
                username=getattr(settings, "EMAIL_HOST_USER", ""),
                password=getattr(settings, "EMAIL_HOST_PASSWORD", ""),
                use_tls=fallback_use_tls,
                use_ssl=fallback_use_ssl,
                timeout=15,
            )
            msg = EmailMultiAlternatives(final_subject, text_message, from_email, [email], connection=fallback_connection)
            msg.attach_alternative(html_message, "text/html")
            sent = msg.send(fail_silently=False)
            if sent >= 1:
                logger.info(f"OTP successfully sent to {email} via fallback port {fallback_port}.")
                return
        except Exception as fallback_err:
            logger.error(f"[EMAIL FAILED] Primary: {first_err} | Fallback: {fallback_err}")
            print(f"[EMAIL FAILED] Primary: {first_err} | Fallback: {fallback_err}")
            raise first_err

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
        except (BadHeaderError, SMTPException, OSError):
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
        except (BadHeaderError, SMTPException, OSError):
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
        except (BadHeaderError, SMTPException, OSError):
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



