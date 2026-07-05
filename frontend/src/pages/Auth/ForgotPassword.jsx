import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../../components/Auth/AuthLayout";
import FormField from "../../components/Auth/FormField";
import PasswordChecklist from "../../components/Auth/PasswordChecklist";
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

  const requestOtp = async (event) => {
    event?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("accounts/forgot-password/request-otp/", { email });
      setMessage(response.data.detail);
      setResendIn(30);
      setStep(2);
    } catch (err) {
      if (err.response?.data?.retry_after) {
        setResendIn(err.response.data.retry_after);
      }
      setError(err.response?.data?.detail || "Could not send OTP.");
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

    if (!validatePassword(passwords.password)) {
      setError("Password must be 8-15 characters with one uppercase letter and one special character.");
      return;
    }
    if (passwords.password !== passwords.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("accounts/forgot-password/reset/", { email, ...passwords });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Verify your email with an OTP, then choose a new secure password."
      footerText="Remembered it?"
      footerLink="/login"
      footerLabel="Log in"
    >
      <div className="mb-6 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((item) => (
          <span
            key={item}
            className={`h-1.5 rounded-full ${item <= step ? "bg-teal-700" : "bg-slate-200"}`}
          />
        ))}
      </div>

      {message && <div className="mb-5 rounded-md bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</div>}
      {error && <div className="mb-5 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {step === 1 && (
        <form onSubmit={requestOtp} className="space-y-4">
          <FormField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verifyOtp} className="space-y-4">
          <FormField
            label="OTP"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            required
          />
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Checking..." : "Verify OTP"}
          </button>
          <button
            type="button"
            disabled={loading || resendIn > 0}
            onClick={() => requestOtp()}
            className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
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
            onChange={(event) => setPasswords((current) => ({ ...current, password: event.target.value }))}
            required
          />
          <PasswordChecklist password={passwords.password} />
          <FormField
            label="Confirm password"
            type="password"
            value={passwords.confirm_password}
            onChange={(event) => setPasswords((current) => ({ ...current, confirm_password: event.target.value }))}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Saving..." : "Update password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
