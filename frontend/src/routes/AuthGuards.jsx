import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * Wraps pages that require authentication (e.g. /dashboard).
 * - While session is being checked: shows a full-screen spinner.
 * - If unauthenticated: redirects to /login (replace so Back button skips it).
 * - If authenticated: renders children normally.
 */
export function ProtectedRoute({ children }) {
  const { user, checking } = useAuth();

  if (checking) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * GuestRoute
 * Wraps pages that should only be visible when NOT logged in
 * (e.g. /login, /signup, /forgot-password).
 * - While session is being checked: shows a full-screen spinner.
 * - If authenticated: redirects straight to /dashboard (replace so Back button skips login).
 * - If unauthenticated: renders children normally.
 */
export function GuestRoute({ children }) {
  const { user, checking } = useAuth();

  if (checking) return <AuthSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

/* ── Minimal full-screen spinner shown while checking session ── */
function AuthSpinner() {
  return (
    <div style={styles.overlay}>
      <div style={styles.ring} />
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a1a",
    zIndex: 9999,
  },
  ring: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "3px solid rgba(167,139,250,0.2)",
    borderTopColor: "#a78bfa",
    animation: "spin 0.75s linear infinite",
  },
};

/* Inject keyframe once */
if (typeof document !== "undefined") {
  const id = "__auth-spinner-keyframe__";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
}
