import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import AuthLayout from "../../components/Auth/AuthLayout";
import FormField from "../../components/Auth/FormField";
import OAuthButtons from "../../components/Auth/OAuthButtons";
import api from "../../services/api";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember_me: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("accounts/login/", form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in with your Refinex account or continue with your OAuth provider."
      footerText="New to Refinex?"
      footerLink="/signup"
      footerLabel="Create account"
    >
      {error && <div className="mb-5 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <form onSubmit={submitLogin} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
        <FormField
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          required
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={form.remember_me}
              onChange={(event) => setForm((current) => ({ ...current, remember_me: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-teal-700 hover:text-teal-800">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <OAuthButtons mode="login" />
    </AuthLayout>
  );
}

export default Login;
