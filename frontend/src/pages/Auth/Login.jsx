import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AlertCircle, X } from "lucide-react";

import AuthLayout from "../../components/Auth/AuthLayout";
import FormField from "../../components/Auth/FormField";
import OAuthButtons from "../../components/Auth/OAuthButtons";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Login() {
  const navigate = useNavigate();
  const { setLoggedIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", remember_me: false });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleFieldChange = (name, val) => {
    setForm((current) => ({ ...current, [name]: val }));
    setFieldErrors((current) => ({ ...current, [name]: null }));
    setError("");
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await api.post("accounts/login/", form);
      setLoggedIn(res.data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        if (data.detail) {
          setError(data.detail);
        } else if (data.non_field_errors) {
          setError(data.non_field_errors[0]);
        } else {
          setFieldErrors(data);
          setError("Please correct the errors in the form.");
        }
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in with your Refinex account or continue with your OAuth provider."
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

      <form onSubmit={submitLogin} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={form.email}
          error={fieldErrors.email}
          onChange={(event) => handleFieldChange("email", event.target.value)}
          required
        />
        <FormField
          label="Password"
          type="password"
          value={form.password}
          error={fieldErrors.password}
          onChange={(event) => handleFieldChange("password", event.target.value)}
          required
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.remember_me}
              onChange={(event) => setForm((current) => ({ ...current, remember_me: event.target.checked }))}
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand focus:ring-brand/20 focus:ring-offset-zinc-950"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-brand hover:text-brandDark transition-colors">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-6 py-2.5 text-center text-white duration-200 bg-brand border-2 border-brand rounded-full hover:bg-transparent hover:text-brand focus:outline-none text-sm font-semibold cursor-pointer active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand disabled:hover:text-white"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <OAuthButtons mode="login" />
    </AuthLayout>
  );
}

export default Login;
