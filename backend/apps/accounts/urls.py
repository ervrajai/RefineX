from django.urls import path

from .views import (
    ChangePasswordView,
    CompleteSignupView,
    CurrentUserView,
    EmailUpdateOtpRequestView,
    EmailUpdateVerifyView,
    ForgotPasswordOtpRequestView,
    ForgotPasswordOtpVerifyView,
    LoginView,
    LogoutView,
    ResetPasswordView,
    SignupOtpRequestView,
    SignupOtpVerifyView,
    UserProfileView,
)

urlpatterns = [
    path("signup/request-otp/", SignupOtpRequestView.as_view(), name="signup-request-otp"),
    path("signup/verify-otp/", SignupOtpVerifyView.as_view(), name="signup-verify-otp"),
    path("signup/complete/", CompleteSignupView.as_view(), name="signup-complete"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="me"),
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("email/request-otp/", EmailUpdateOtpRequestView.as_view(), name="email-request-otp"),
    path("email/verify-update/", EmailUpdateVerifyView.as_view(), name="email-verify-update"),
    path("forgot-password/request-otp/", ForgotPasswordOtpRequestView.as_view(), name="forgot-password-request-otp"),
    path("forgot-password/verify-otp/", ForgotPasswordOtpVerifyView.as_view(), name="forgot-password-verify-otp"),
    path("forgot-password/reset/", ResetPasswordView.as_view(), name="forgot-password-reset"),
]

