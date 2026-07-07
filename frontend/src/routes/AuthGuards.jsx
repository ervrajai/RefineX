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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-md transition-colors duration-300">
      
      {/* SCOPED CSS KEYFRAMES */}
      <style>{`
        .loader-ball { animation: ballBouncing 4s infinite; }
        .loader-bar-1 { animation: barUp1 4s infinite; }
        .loader-bar-2 { animation: barUp2 4s infinite; }
        .loader-bar-3 { animation: barUp3 4s infinite; }
        .loader-bar-4 { animation: barUp4 4s infinite; }
        .loader-bar-5 { animation: barUp5 4s infinite; }

        @keyframes ballBouncing {
          0% { transform: translate(0, 0); }
          5% { transform: translate(8px, -14px); }
          10% { transform: translate(15px, -10px); }
          17% { transform: translate(23px, -24px); }
          20% { transform: translate(30px, -20px); }
          27% { transform: translate(38px, -34px); }
          30% { transform: translate(45px, -30px); }
          37% { transform: translate(53px, -44px); }
          40% { transform: translate(60px, -40px); }
          50% { transform: translate(60px, 0); }
          57% { transform: translate(53px, -14px); }
          60% { transform: translate(45px, -10px); }
          67% { transform: translate(37px, -24px); }
          70% { transform: translate(30px, -20px); }
          77% { transform: translate(22px, -34px); }
          80% { transform: translate(15px, -30px); }
          87% { transform: translate(7px, -44px); }
          90% { transform: translate(0, -40px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes barUp1 {
          0%, 40%, 100% { transform: scale(1, 0.2); }
          50%, 90% { transform: scale(1, 1); }
        }
        @keyframes barUp2 {
          0%, 40%, 100% { transform: scale(1, 0.4); }
          50%, 90% { transform: scale(1, 0.8); }
        }
        @keyframes barUp3 {
          0%, 100% { transform: scale(1, 0.6); }
        }
        @keyframes barUp4 {
          0%, 40%, 100% { transform: scale(1, 0.8); }
          50%, 90% { transform: scale(1, 0.4); }
        }
        @keyframes barUp5 {
          0%, 40%, 100% { transform: scale(1, 1); }
          50%, 90% { transform: scale(1, 0.2); }
        }
      `}</style>

      {/* ANIMATION CONTAINER */}
      <div className="relative w-[75px] h-[100px]">
        
        {/* The Bouncing Ball (RefineX Purple) */}
        <div className="loader-ball absolute bottom-[10px] left-0 w-[10px] h-[10px] bg-[#673ab7] rounded-full z-10 shadow-[0_0_12px_rgba(103,58,183,0.6)]"></div>
        
        {/* The Animated Bars (Adapts to Light/Dark Mode) */}
        <div className="loader-bar-1 absolute bottom-0 left-[0px] w-[10px] h-1/2 bg-slate-800 dark:bg-white origin-bottom rounded-[2px] shadow-sm"></div>
        <div className="loader-bar-2 absolute bottom-0 left-[15px] w-[10px] h-1/2 bg-slate-800 dark:bg-white origin-bottom rounded-[2px] shadow-sm"></div>
        <div className="loader-bar-3 absolute bottom-0 left-[30px] w-[10px] h-1/2 bg-slate-800 dark:bg-white origin-bottom rounded-[2px] shadow-sm"></div>
        <div className="loader-bar-4 absolute bottom-0 left-[45px] w-[10px] h-1/2 bg-slate-800 dark:bg-white origin-bottom rounded-[2px] shadow-sm"></div>
        <div className="loader-bar-5 absolute bottom-0 left-[60px] w-[10px] h-1/2 bg-slate-800 dark:bg-white origin-bottom rounded-[2px] shadow-sm"></div>
        
      </div>
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
