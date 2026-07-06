import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Star
} from "lucide-react";
import { Particles } from "./Particles";

function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/login";
  const isSignup = location.pathname === "/signup";
  const [hoveredTab, setHoveredTab] = useState(null);

  // Sync theme with landing page / prefers-color-scheme on mount
  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem("theme") || "auto";

    const applyTheme = (currentTheme) => {
      if (currentTheme === "dark") {
        root.classList.add("dark");
      } else if (currentTheme === "light") {
        root.classList.remove("dark");
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme(storedTheme);

    if (storedTheme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemChange = () => {
        applyTheme("auto");
      };
      mediaQuery.addEventListener("change", handleSystemChange);
      return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }
  }, []);

  const getDynamicContent = () => {
    switch (location.pathname) {
      case "/signup":
        return {
          badge: "RefineX Workspace",
          heading: (
            <>
              Join The<br />
              <span className="bg-gradient-to-br from-slate-900 via-slate-900 to-primary dark:from-white dark:via-white dark:to-primary bg-clip-text text-transparent pr-2 pb-1 inline-block">
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
              <span className="bg-gradient-to-br from-slate-900 via-slate-900 to-primary dark:from-white dark:via-white dark:to-primary bg-clip-text text-transparent pr-2 pb-1 inline-block">
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
              <span className="bg-gradient-to-br from-slate-900 via-slate-900 to-primary dark:from-white dark:via-white dark:to-primary bg-clip-text text-transparent pr-2 pb-1 inline-block">
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
    <div className="relative h-screen w-screen bg-white dark:bg-black text-slate-900 dark:text-white overflow-hidden font-sans flex flex-col justify-center items-center transition-colors duration-300 select-none">
      {/* SCOPED ANIMATIONS */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.2s ease-out forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.02s; }
        .delay-200 { animation-delay: 0.04s; }
        .delay-300 { animation-delay: 0.06s; }
        .delay-400 { animation-delay: 0.08s; }
      `}</style>

      {/* Interactive Background Particles */}
      <Particles className="absolute inset-0 z-0" color="#673ab7" quantity={120} staticity={40} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center w-full max-h-[90vh]">
          
          {/* --- LEFT COLUMN (Hidden on Mobile) --- */}
          <div className="lg:col-span-7 hidden lg:flex flex-col justify-center space-y-5">
            {/* Badge */}
            <div className="animate-fade-in delay-100">
              <div className="inline-flex items-center gap-2 rounded-full border border-lightBorder/55 dark:border-white/10 bg-gray-100/50 dark:bg-white/5 px-3 py-1 backdrop-blur-md">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 flex items-center gap-2">
                  {dynamicContent.badge}
                  <Star className="w-3 h-3 text-primary fill-primary" />
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in delay-200 text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tighter leading-[0.9] text-slate-900 dark:text-white">
              {dynamicContent.heading}
            </h1>

            {/* Description */}
            <p className="animate-fade-in delay-300 max-w-md text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              {dynamicContent.description}
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in delay-400 flex flex-col sm:flex-row gap-4">
              <Link to="/" className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-zinc-950 transition-all hover:scale-[1.02] hover:bg-slate-800 dark:hover:bg-zinc-200 active:scale-[0.98]">
                {dynamicContent.homeButtonText}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* --- RIGHT COLUMN (Centered Form Card) --- */}
          <div className="lg:col-span-5 flex justify-center items-center w-full">
            {/* Auth Form Card - Using Navbar Border & Background Style */}
            <div className="w-full max-w-md animate-fade-in delay-200 relative overflow-hidden rounded-2xl border border-lightBorder/55 dark:border-gray-800/80 bg-gray-50/80 dark:bg-[#121212]/80 p-6 backdrop-blur-xl shadow-2xl flex flex-col transition-colors duration-300">
              
              {/* Card Glow Effect */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 w-full">
                {/* Pill Switcher with Gliding Outline Hover Effect */}
                {(isLogin || isSignup) && (
                  <div 
                    className="relative mb-5 flex rounded-full border border-lightBorder/50 dark:border-gray-800/80 bg-gray-50/80 dark:bg-[#121212]/80 p-0.5"
                    onMouseLeave={() => setHoveredTab(null)}
                  >
                    
                    {/* Active Tab indicator (High contrast for light/dark mode visibility) */}
                    <div 
                      className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full border border-gray-900 dark:border-white bg-transparent transition-all duration-300 ease-in-out ${
                        isSignup ? "left-[calc(50%+1px)]" : "left-0.5"
                      }`}
                    />
                    
                    {/* Log In Tab */}
                    <button
                      onMouseEnter={() => setHoveredTab("login")}
                      onClick={() => navigate("/login")}
                      className={`relative z-10 flex-1 rounded-full py-1.5 text-center text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                        isLogin ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Log In
                      {/* Gliding transparent outline for hover tab - matching Navbar */}
                      {hoveredTab === "login" && !isLogin && (
                        <motion.div
                          layoutId="pill-hover"
                          className="absolute inset-0 border border-brand dark:border-white/50 rounded-full pointer-events-none"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </button>
                    
                    {/* Sign Up Tab */}
                    <button
                      onMouseEnter={() => setHoveredTab("signup")}
                      onClick={() => navigate("/signup")}
                      className={`relative z-10 flex-1 rounded-full py-1.5 text-center text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                        isSignup ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Sign Up
                      {/* Gliding transparent outline for hover tab - matching Navbar */}
                      {hoveredTab === "signup" && !isSignup && (
                        <motion.div
                          layoutId="pill-hover"
                          className="absolute inset-0 border border-brand dark:border-white/50 rounded-full pointer-events-none"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </button>
                  </div>
                )}

                {/* Form Header */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{subtitle}</p>
                </div>

                {/* Children forms */}
                {children}

                {/* Footer link for forgot password */}
                {footerText && !isLogin && !isSignup && (
                  <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                    {footerText}{" "}
                    <Link to={footerLink} className="font-semibold text-primary hover:text-primary-dark hover:underline transition-all">
                      {footerLabel}
                    </Link>
                  </p>
                )}
                
                {/* Fallback reset link for Login page */}
                {isLogin && (
                  <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                    Having trouble logging in?{" "}
                    <Link to="/forgot-password" className="font-semibold text-primary hover:text-primary-dark hover:underline transition-all">
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
