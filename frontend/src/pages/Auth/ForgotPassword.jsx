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
    <>
      {/* Floating Alert (iOS style main error toast) - Rendered at root viewport level */}
      {error && (
        <div className="fixed top-6 right-6 left-6 sm:left-auto z-[9999] flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-rose-600 dark:text-rose-400 shadow-2xl backdrop-blur-md animate-fade-in max-w-sm">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1 font-medium">{error}</span>
          <button onClick={() => setError("")} className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-355 transition-colors cursor-pointer focus:outline-none">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <AuthLayout
        title="Reset password"
        subtitle="Verify your email with an OTP, then choose a new secure password."
      >
        {/* Progress Bar */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <span
              key={item}
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                item <= step ? "bg-primary" : "bg-slate-200 dark:bg-white/10"
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
              className="w-full flex items-center justify-center px-6 py-2.5 text-center text-white duration-200 bg-primary border-2 border-primary rounded-full hover:bg-transparent hover:text-primary dark:hover:text-white hover:border-primary dark:hover:border-white focus:outline-none text-sm font-semibold cursor-pointer active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 dark:disabled:border-zinc-800"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-5">
            {/* Inline OTP sent suggestion inside card */}
            {message && (
              <div className="text-center bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-primary font-medium animate-fade-in leading-relaxed">
                OTP sent on this email:<br />
                <span className="font-bold text-slate-900 dark:text-white text-sm break-all">{email}</span>
              </div>
            )}

            <div className="block">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-400 block text-center mb-1">Verification Code</span>
              <OtpInput length={6} value={otp} onChange={handleOtpChange} />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center px-6 py-2.5 text-center text-white duration-200 bg-primary border-2 border-primary rounded-full hover:bg-transparent hover:text-primary dark:hover:text-white hover:border-primary dark:hover:border-white focus:outline-none text-sm font-semibold cursor-pointer active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-550 dark:disabled:border-zinc-800"
            >
              {loading ? "Checking..." : "Verify OTP"}
            </button>
            <button
              type="button"
              disabled={loading || resendIn > 0}
              onClick={() => requestOtp()}
              className="w-full text-center text-slate-555 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:underline font-semibold text-sm transition-colors py-2 cursor-pointer disabled:text-slate-400 dark:disabled:text-zinc-655 disabled:no-underline disabled:cursor-not-allowed"
            >
              {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={resetPassword} className="space-y-4">
            {/* Inline success message for OTP verification */}
            {message && (
              <div className="text-center bg-primary/10 border border-primary/20 rounded-xl p-2.5 text-xs text-primary font-medium animate-fade-in">
                {message}
              </div>
            )}

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
              className="w-full flex items-center justify-center px-6 py-2.5 text-center text-white duration-200 bg-primary border-2 border-primary rounded-full hover:bg-transparent hover:text-primary dark:hover:text-white hover:border-primary dark:hover:border-white focus:outline-none text-sm font-semibold cursor-pointer active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 dark:disabled:border-zinc-800"
            >
              {loading ? "Saving..." : "Update password"}
            </button>
          </form>
        )}
      </AuthLayout>
    </>
  );
}

export default ForgotPassword;
