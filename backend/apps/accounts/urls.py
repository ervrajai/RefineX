from django.urls import path

from .views import (
    ChangePasswordView,
    CompleteSignupView,
    CurrentUserView,
    DeleteAccountConfirmView,
    DeleteAccountOtpRequestView,
    ForgotPasswordOtpRequestView,
    ForgotPasswordOtpVerifyView,
    LoginView,
    LogoutView,
    RegisterView,
    ResetPasswordView,
    SignupOtpRequestView,
    SignupOtpVerifyView,
    UserProfileView,
    VerifyPasswordView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("signup/request-otp/", SignupOtpRequestView.as_view(), name="signup-request-otp"),
    path("signup/verify-otp/", SignupOtpVerifyView.as_view(), name="signup-verify-otp"),
    path("signup/complete/", CompleteSignupView.as_view(), name="signup-complete"),
    path("login/", LoginView.as_view(), name="login"),

    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="me"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("verify-password/", VerifyPasswordView.as_view(), name="verify-password"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("forgot-password/request-otp/", ForgotPasswordOtpRequestView.as_view(), name="forgot-password-request-otp"),
    path("forgot-password/verify-otp/", ForgotPasswordOtpVerifyView.as_view(), name="forgot-password-verify-otp"),
    path("forgot-password/reset/", ResetPasswordView.as_view(), name="forgot-password-reset"),
    path("delete-account/request-otp/", DeleteAccountOtpRequestView.as_view(), name="delete-account-request-otp"),
    path("delete-account/confirm/", DeleteAccountConfirmView.as_view(), name="delete-account-confirm"),
]


