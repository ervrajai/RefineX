import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Star
} from "lucide-react";

function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/login";
  const isSignup = location.pathname === "/signup";

  const getDynamicContent = () => {
    switch (location.pathname) {
      case "/signup":
        return {
          badge: "RefineX Workspace",
          heading: (
            <>
              Join The<br />
              <span className="bg-gradient-to-br from-white via-white to-brand bg-clip-text text-transparent">
                RefineX
              </span><br />
              Workspace
            </>
          ),
          description: "Start designing, developing, and optimizing databases. Sign up for a free developer account today.",
          homeButtonText: "Back to Home",
        };
      case "/forgot-password":
        return {
          badge: "Account Security",
          heading: (
            <>
              Secure Your<br />
              <span className="bg-gradient-to-br from-white via-white to-brand bg-clip-text text-transparent">
                RefineX
              </span><br />
              Account
            </>
          ),
          description: "Follow the simple multi-step recovery process to verify your email and restore account access safely.",
          homeButtonText: "Back to Home",
        };
      case "/login":
      default:
        return {
          badge: "RefineX Platform",
          heading: (
            <>
              Welcome Back<br />
              To{" "}
              <span className="bg-gradient-to-br from-white via-white to-brand bg-clip-text text-transparent">
                RefineX
              </span>
            </>
          ),
          description: "Access your workspace, manage database records, run queries, and monitor performance in real-time.",
          homeButtonText: "Back to Home",
        };
    }
  };

  const dynamicContent = getDynamicContent();

  return (
    <div className="relative h-screen w-screen bg-[#070311] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d0e3a] via-zinc-950 to-zinc-950 text-white overflow-hidden font-sans flex flex-col justify-center items-center select-none">
      {/* SCOPED ANIMATIONS */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>

      {/* Background Image with Gradient Mask */}
      <div 
        className="absolute inset-0 z-0 bg-[url(https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/a72ca2f3-9dd1-4fe4-84ba-fe86468a5237_3840w.webp?w=800&q=80)] bg-cover bg-center opacity-15 pointer-events-none"
        style={{
          maskImage: "radial-gradient(circle, black 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 85%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center w-full max-h-[90vh]">
          
          {/* --- LEFT COLUMN (Hidden on Mobile) --- */}
          <div className="lg:col-span-7 hidden lg:flex flex-col justify-center space-y-5">
            {/* Badge */}
            <div className="animate-fade-in delay-100">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-md">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  {dynamicContent.badge}
                  <Star className="w-3 h-3 text-brand fill-brand" />
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in delay-200 text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tighter leading-[0.9]">
              {dynamicContent.heading}
            </h1>

            {/* Description */}
            <p className="animate-fade-in delay-300 max-w-md text-sm text-zinc-400 leading-relaxed">
              {dynamicContent.description}
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in delay-400 flex flex-col sm:flex-row gap-4">
              <Link to="/" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98]">
                {dynamicContent.homeButtonText}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* --- RIGHT COLUMN (Centered Form Card) --- */}
          <div className="lg:col-span-5 flex justify-center items-center w-full">
            {/* Auth Form Card */}
            <div className="w-full max-w-md animate-fade-in delay-200 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl flex flex-col">
              {/* Card Glow Effect */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 w-full">
                {/* Pill Switcher */}
                {(isLogin || isSignup) && (
                  <div className="relative mb-5 flex rounded-full border border-white/10 bg-white/5 p-0.5">
                    <div 
                      className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-brand transition-all duration-300 ease-in-out ${
                        isSignup ? "left-[calc(50%+1px)]" : "left-0.5"
                      }`}
                    />
                    <button
                      onClick={() => navigate("/login")}
                      className={`relative z-10 flex-1 rounded-full py-1.5 text-center text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                        isLogin ? "text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => navigate("/signup")}
                      className={`relative z-10 flex-1 rounded-full py-1.5 text-center text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                        isSignup ? "text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                )}

                {/* Form Header */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-white">{title}</h2>
                  <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">{subtitle}</p>
                </div>

                {/* Children forms */}
                {children}

                {/* Footer link for forgot password */}
                {footerText && !isLogin && !isSignup && (
                  <p className="mt-4 text-center text-xs text-zinc-400">
                    {footerText}{" "}
                    <Link to={footerLink} className="font-semibold text-brand hover:text-brandDark hover:underline transition-all">
                      {footerLabel}
                    </Link>
                  </p>
                )}
                
                {/* Fallback reset link for Login page */}
                {isLogin && (
                  <p className="mt-4 text-center text-xs text-zinc-400">
                    Having trouble logging in?{" "}
                    <Link to="/forgot-password" className="font-semibold text-brand hover:text-brandDark hover:underline transition-all">
                      Reset Password
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
