import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";

import AuthLayout from "../../components/Auth/AuthLayout";
import FormField from "../../components/Auth/FormField";
import PasswordChecklist from "../../components/Auth/PasswordChecklist";
import OtpInput from "../../components/Auth/OtpInput";
import api from "../../services/api";
import { validatePassword } from "../../utils/passwordPolicy";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ password: "", confirm_password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendIn((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendIn]);

  const handleEmailChange = (val) => {
    setEmail(val);
    setFieldErrors((current) => ({ ...current, email: null }));
    setError("");
  };

  const handlePasswordsChange = (name, val) => {
    setPasswords((current) => ({ ...current, [name]: val }));
    setFieldErrors((current) => ({ ...current, [name]: null }));
    setError("");
  };

  const handleOtpChange = (val) => {
    setOtp(val);
    setError("");
  };

  const requestOtp = async (event) => {
    event?.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await api.post("accounts/forgot-password/request-otp/", { email });
      setMessage(`OTP sent on this email: ${email}`);
      setResendIn(30);
      setStep(2);
    } catch (err) {
      if (err.response?.data?.retry_after) {
        setResendIn(err.response.data.retry_after);
      }
      const data = err.response?.data;
      if (data && typeof data === "object") {
        if (data.detail) {
          setError(data.detail);
        } else {
          setFieldErrors(data);
          setError("Please correct the errors in the form.");
        }
      } else {
        setError("Could not send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("accounts/forgot-password/verify-otp/", { email, otp });
      setMessage("OTP verified. Set your new password.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validatePassword(passwords.password)) {
      setError("Password must be 8-15 characters with one uppercase letter and one special character.");
      return;
    }
    if (passwords.password !== passwords.confirm_password) {
      setFieldErrors({ confirm_password: "Passwords do not match." });
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("accounts/forgot-password/reset/", { email, ...passwords });
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        if (data.detail) {
          setError(data.detail);
        } else {
          setFieldErrors(data);
          setError("Could not reset password.");
        }
      } else {
        setError("Could not reset password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Verify your email with an OTP, then choose a new secure password."
    >
      {/* Floating Alert Center/Right (iOS style main error toast) */}
      {error && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-zinc-900/90 px-4 py-3 text-sm text-rose-400 shadow-2xl backdrop-blur-md animate-fade-in max-w-sm">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1 font-medium">{error}</span>
          <button onClick={() => setError("")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Success Toast (iOS style) */}
      {message && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-brand/20 bg-zinc-900/90 px-4 py-3 text-sm text-brand shadow-2xl backdrop-blur-md animate-fade-in max-w-sm">
          <AlertCircle className="w-4 h-4 text-brand shrink-0" />
          <span className="flex-1 font-medium">{message}</span>
          <button onClick={() => setMessage("")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Progress Bar (no shadow, properly visible, h-1.5) */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((item) => (
          <span
            key={item}
            className={`h-1.5 rounded-full transition-colors duration-300 ${
              item <= step ? "bg-brand" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={requestOtp} className="space-y-4">
          <FormField 
            label="Email" 
            type="email" 
            value={email} 
            error={fieldErrors.email}
            onChange={(event) => handleEmailChange(event.target.value)} 
            required 
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-2.5 text-center text-white duration-200 bg-brand border-2 border-brand rounded-full hover:bg-transparent hover:text-brand focus:outline-none text-sm font-semibold cursor-pointer active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand disabled:hover:text-white"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verifyOtp} className="space-y-5">
          <div className="block">
            <span className="text-xs font-semibold text-zinc-400 block text-center mb-1">Verification Code</span>
            <OtpInput length={6} value={otp} onChange={handleOtpChange} />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full flex items-center justify-center px-6 py-2.5 text-center text-white duration-200 bg-brand border-2 border-brand rounded-full hover:bg-transparent hover:text-brand focus:outline-none text-sm font-semibold cursor-pointer active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand disabled:hover:text-white"
          >
            {loading ? "Checking..." : "Verify OTP"}
          </button>
          <button
            type="button"
            disabled={loading || resendIn > 0}
            onClick={() => requestOtp()}
            className="w-full text-center text-zinc-400 hover:text-white hover:underline font-semibold text-sm transition-colors py-2 cursor-pointer disabled:text-zinc-655 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={resetPassword} className="space-y-4">
          <FormField
            label="New password"
            type="password"
            value={passwords.password}
            error={fieldErrors.password}
            onChange={(e) => handlePasswordsChange("password", e.target.value)}
            required
          />
          <PasswordChecklist password={passwords.password} />
          <FormField
            label="Confirm password"
            type="password"
            value={passwords.confirm_password}
            error={fieldErrors.confirm_password}
            onChange={(e) => handlePasswordsChange("confirm_password", e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-2.5 text-center text-white duration-200 bg-brand border-2 border-brand rounded-full hover:bg-transparent hover:text-brand focus:outline-none text-sm font-semibold cursor-pointer active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand disabled:hover:text-white"
          >
            {loading ? "Saving..." : "Update password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
