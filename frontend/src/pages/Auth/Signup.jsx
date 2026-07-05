import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";

import AuthLayout from "../../components/Auth/AuthLayout";
import FormField from "../../components/Auth/FormField";
import OAuthButtons from "../../components/Auth/OAuthButtons";
import PasswordChecklist from "../../components/Auth/PasswordChecklist";
import OtpInput from "../../components/Auth/OtpInput";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { validatePassword } from "../../utils/passwordPolicy";

const initialBasicInfo = {
  first_name: "",
  last_name: "",
  email: "",
};

function Signup() {
  const navigate = useNavigate();
  const { setLoggedIn } = useAuth();
  const [step, setStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState(initialBasicInfo);
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ password: "", confirm_password: "" });
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

  const handleBasicInfoChange = (name, val) => {
    setBasicInfo((current) => ({ ...current, [name]: val }));
    setFieldErrors((current) => ({ ...current, [name]: null }));
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
      await api.post("accounts/signup/request-otp/", basicInfo);
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
      await api.post("accounts/signup/verify-otp/", { email: basicInfo.email, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async (event) => {
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
      const res = await api.post("accounts/signup/complete/", {
        email: basicInfo.email,
        ...passwords,
      });
      setLoggedIn(res.data);
      setBasicInfo(initialBasicInfo);
      setOtp("");
      setPasswords({ password: "", confirm_password: "" });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        if (data.detail) {
          setError(data.detail);
        } else {
          setFieldErrors(data);
          setError("Could not complete signup.");
        }
      } else {
        setError("Could not complete signup.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start with your email, verify it, then set a secure password."
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

      {/* Progress Bar (no shadow, properly visible, h-1 text-zinc-800) */}
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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First name"
              name="first_name"
              value={basicInfo.first_name}
              error={fieldErrors.first_name}
              onChange={(e) => handleBasicInfoChange("first_name", e.target.value)}
              required
            />
            <FormField 
              label="Last name" 
              name="last_name" 
              value={basicInfo.last_name} 
              error={fieldErrors.last_name}
              onChange={(e) => handleBasicInfoChange("last_name", e.target.value)}
            />
          </div>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={basicInfo.email}
            error={fieldErrors.email}
            onChange={(e) => handleBasicInfoChange("email", e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-2.5 text-center text-white duration-200 bg-brand border-2 border-brand rounded-full hover:bg-transparent hover:text-brand focus:outline-none text-sm font-semibold cursor-pointer active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand disabled:hover:text-white"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
          <OAuthButtons mode="signup" />
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
            className="w-full text-center text-zinc-400 hover:text-white hover:underline font-semibold text-sm transition-colors py-2 cursor-pointer disabled:text-zinc-650 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={completeSignup} className="space-y-4">
          <FormField
            label="Password"
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
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default Signup;
