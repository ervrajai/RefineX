from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class SignupOtpRequestSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    email = serializers.EmailField()


class OtpVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.RegexField(regex=r"^\d{6}$", error_messages={"invalid": "Enter a valid 6-digit OTP."})


class CompleteSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password", "")

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if user.auth_provider != User.AuthProvider.EMAIL:
            provider_display = dict(User.AuthProvider.choices).get(user.auth_provider, user.auth_provider.title())
            raise serializers.ValidationError(
                f"This account is associated with {provider_display}. Please sign in using {provider_display} instead."
            )

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")

        user.backend = "django.contrib.auth.backends.ModelBackend"
        attrs["user"] = user
        return attrs


class ForgotPasswordOtpRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs


class UpdateProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    profile_picture = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    avatar = serializers.CharField(max_length=500, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    organization = serializers.CharField(max_length=255, required=False, allow_blank=True)
    job_title = serializers.CharField(max_length=255, required=False, allow_blank=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "New passwords do not match."})
        validate_password(attrs["new_password"])
        return attrs


class EmailUpdateOtpRequestSerializer(serializers.Serializer):
    new_email = serializers.EmailField()


class EmailUpdateVerifySerializer(serializers.Serializer):
    new_email = serializers.EmailField()
    otp = serializers.RegexField(regex=r"^\d{6}$", error_messages={"invalid": "Enter a valid 6-digit OTP."})


class UserSerializer(serializers.ModelSerializer):
    uuid = serializers.UUIDField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "uuid",
            "email",
            "username",
            "first_name",
            "last_name",
            "auth_provider",
            "profile_picture",
            "social_id",
            "is_email_verified",
            "date_joined",
        )
        read_only_fields = ("date_joined", "uuid")

