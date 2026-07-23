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


def _send_otp(email, otp, subject):
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
        raise SMTPException("OTP email was not accepted by the SMTP backend.")


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

class SignupOtpRequestView(APIView):
    permission_classes = [AllowAny]

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
            _send_otp(email, otp, "Verify your Refinex signup")
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


class SignupOtpVerifyView(APIView):
    permission_classes = [AllowAny]

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


class CompleteSignupView(APIView):
    permission_classes = [AllowAny]

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
        )
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        login(request, user)
        _clear_otp(request, "signup")
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return


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


class ForgotPasswordOtpRequestView(APIView):
    permission_classes = [AllowAny]

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
            _send_otp(email, otp, "Reset your Refinex password")
        except (BadHeaderError, SMTPException, OSError):
            return _otp_email_error_response()

        _store_otp(request, "password_reset", email=email, otp=otp)
        return Response({"detail": "OTP has been sent to your email."})


class ForgotPasswordOtpVerifyView(APIView):
    permission_classes = [AllowAny]

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


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

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
            user.save()
        _clear_otp(request, "password_reset")
        return Response({"detail": "Password updated successfully."})


from .services import UserService, AccountSecurityService, OtpService
from .serializers import (
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    EmailUpdateOtpRequestSerializer,
    EmailUpdateVerifySerializer,
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
            "bio": profile.bio if profile else "",
            "phone": profile.phone if profile else "",
            "organization": profile.organization if profile else "",
            "job_title": profile.job_title if profile else "",
            "auth_provider": user.auth_provider,
            "is_email_verified": user.is_email_verified,
            "date_joined": user.date_joined,
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
            return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({"detail": str(err)}, status=status.HTTP_400_BAD_REQUEST)



class EmailUpdateOtpRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EmailUpdateOtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data["new_email"].lower()

        if new_email == request.user.email.lower():
            return Response({"detail": "New email cannot be the same as your current email."}, status=status.HTTP_400_BAD_REQUEST)

        if UserModel.objects.filter(email__iexact=new_email).exists():
            return Response({"detail": "An account with this email address already exists."}, status=status.HTTP_400_BAD_REQUEST)

        cooldown_response = _resend_cooldown_response(request, "email_update", new_email)
        if cooldown_response:
            return cooldown_response

        otp = OtpService.generate_otp()
        try:
            OtpService.send_otp_email(new_email, otp, "Verify your new Refinex email address")
        except (BadHeaderError, SMTPException, OSError):
            return _otp_email_error_response()

        OtpService.store_otp(request, "email_update", email=new_email, otp=otp)
        return Response({"detail": f"OTP verification code sent to {new_email}."})


class EmailUpdateVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EmailUpdateVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data["new_email"].lower()

        record, error = OtpService.get_otp_record(request, "email_update")
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        if record["email"] != new_email:
            return Response({"detail": "OTP does not match this email address."}, status=status.HTTP_400_BAD_REQUEST)

        if not secrets.compare_digest(record["otp"], serializer.validated_data["otp"]):
            record["attempts"] = record.get("attempts", 0) + 1
            request.session[_otp_session_key("email_update")] = record
            request.session.modified = True
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.email = new_email
        user.is_email_verified = True
        user.save(update_fields=["email", "is_email_verified"])

        OtpService.clear_otp(request, "email_update")
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


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
            _send_otp(email, otp, "Confirm Refinex Account Deletion")
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
            password = request.data.get("password")
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

        # Permanently erase physical CSV and model files from local PC disk storage
        for ds in user.datasets.all():
            if ds.original_file:
                try:
                    if os.path.isfile(ds.original_file.path):
                        os.remove(ds.original_file.path)
                except Exception:
                    pass
            if ds.cleaned_file:
                try:
                    if os.path.isfile(ds.cleaned_file.path):
                        os.remove(ds.cleaned_file.path)
                except Exception:
                    pass

        if hasattr(user, "model_training_jobs"):
            for job in user.model_training_jobs.all():
                if job.trained_model_file:
                    try:
                        if os.path.isfile(job.trained_model_file.path):
                            os.remove(job.trained_model_file.path)
                    except Exception:
                        pass

        # Delete database records (CASCADE deletes datasets, cleaning jobs, training jobs, graphs, profile)
        logout(request)
        user.delete()
        return Response({"detail": "Account and all associated files deleted successfully."}, status=status.HTTP_200_OK)



