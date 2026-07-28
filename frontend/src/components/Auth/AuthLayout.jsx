import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Particles } from "./Particles";
import logoImg from "../../assets/logo/refinex_logo.png";

function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/login";
  const isSignup = location.pathname === "/signup";

  // Track slide direction (-1 for left/login, 1 for right/signup)
  const [direction, setDirection] = useState(isSignup ? 1 : -1);

  const handleTabSwitch = (targetPath) => {
    if (location.pathname === targetPath) return;
    setDirection(targetPath === "/signup" ? 1 : -1);
    navigate(targetPath);
  };

  // Sync theme with system or stored settings
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
      const handleSystemChange = () => applyTheme("auto");
      mediaQuery.addEventListener("change", handleSystemChange);
      return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }
  }, []);

  const getDynamicContent = () => {
    switch (location.pathname) {
      case "/signup":
        return {
          heading: (
            <>
              Join The <br />
              <span className="text-[#673AB7] dark:text-[#8b5cf6]">RefineX</span> Workspace
            </>
          ),
          description: "Start designing, developing, and optimizing databases with developer-grade efficiency.",
          homeButtonText: "Back to Home",
        };
      case "/forgot-password":
        return {
          heading: (
            <>
              Secure Your <br />
              <span className="text-[#673AB7] dark:text-[#8b5cf6]">RefineX</span> Account
            </>
          ),
          description: "Follow the simple step-by-step process to verify your email and restore access.",
          homeButtonText: "Back to Home",
        };
      case "/login":
      default:
        return {
          heading: (
            <>
              Welcome Back To <br />
              <span className="text-[#673AB7] dark:text-[#8b5cf6]">RefineX</span>
            </>
          ),
          description: "Access your workspace, manage database records, and run real-time queries smoothly.",
          homeButtonText: "Back to Home",
        };
    }
  };

  const dynamicContent = getDynamicContent();

  const cardSlideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 15 : -15,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? -15 : 15,
      opacity: 0,
    }),
  };

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#0F0F0F] text-slate-900 dark:text-white font-sans flex items-center justify-center py-8 px-4 transition-colors duration-300 select-none overflow-hidden">
      
      {/* Background Smooth Keyframe Animations */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        .animate-glow-1 {
          animation: pulseGlow 10s ease-in-out infinite;
        }
      `}</style>

      {/* --- AMBIENT BACKDROP --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="animate-glow-1 absolute -top-24 -left-20 w-[450px] h-[450px] rounded-full bg-[#673ab7]/20 dark:bg-[#673ab7]/30 blur-[120px]" />
      </div>

      {/* Interactive Particles Layer */}
      <Particles className="absolute inset-0 z-0 opacity-60 dark:opacity-50 pointer-events-none" color="#bf80ff" quantity={70} staticity={40} />


      <div className="relative z-10 mx-auto max-w-5xl w-full flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-7 hidden lg:flex flex-col justify-center space-y-5 pr-4">
            
            {/* BRAND LOGO DISPLAY */}
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="RefineX Logo"
                className="w-10 h-10 object-contain rounded-xl"
              />
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                RefineX
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">
              {dynamicContent.heading}
            </h1>

            {/* Description */}
            <p className="max-w-md text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              {dynamicContent.description}
            </p>

            {/* CTA Button */}
            <div className="pt-1">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500 bg-slate-900 dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-slate-900 shadow-sm transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-100 focus:ring-4 focus:ring-[#673AB7]/15 active:scale-[0.98]"
              >
                {dynamicContent.homeButtonText}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* --- RIGHT COLUMN (Form Card) --- */}
          <div className="lg:col-span-5 flex justify-center items-center w-full">
            <div className="w-full max-w-sm relative overflow-hidden rounded-3xl border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-xl backdrop-blur-xl">
              
              <div className="relative z-10 w-full">
                
                {/* --- PILL SWITCHER --- */}
                {(isLogin || isSignup) && (
                  <div className="mb-5 flex justify-center">
                    <div className="relative flex w-full items-center rounded-full border border-slate-200/60 dark:border-zinc-800/80 bg-[#e3e3e8] dark:bg-[#1c1c1e] p-1 shadow-inner">
                      {/* Animated Capsule Indicator */}
                      <motion.div
                        className="absolute inset-y-1 rounded-full bg-white dark:bg-[#3a3a3c] shadow-sm border border-slate-200/60 dark:border-zinc-700/60"
                        initial={false}
                        animate={{
                          left: isLogin ? "4px" : "50%",
                          width: "calc(50% - 4px)",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />

                      {/* Log In Button */}
                      <button
                        type="button"
                        onClick={() => handleTabSwitch("/login")}
                        className={`relative z-10 w-1/2 py-1.5 text-center text-xs transition-colors duration-200 cursor-pointer ${
                          isLogin
                            ? "text-[#1c1c1e] dark:text-white font-bold"
                            : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white font-semibold"
                        }`}
                      >
                        Log In
                      </button>

                      {/* Sign Up Button */}
                      <button
                        type="button"
                        onClick={() => handleTabSwitch("/signup")}
                        className={`relative z-10 w-1/2 py-1.5 text-center text-xs transition-colors duration-200 cursor-pointer ${
                          isSignup
                            ? "text-[#1c1c1e] dark:text-white font-bold"
                            : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white font-semibold"
                        }`}
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                )}

                {/* --- SLIDING FORM CONTENT --- */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={location.pathname}
                    custom={direction}
                    variants={cardSlideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 350, damping: 30 },
                      opacity: { duration: 0.15 },
                    }}
                  >
                    {/* Form Header */}
                    <div className="mb-4 text-left">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400 leading-normal">{subtitle}</p>
                    </div>

                    {/* Dynamic Children (Inputs / Forms) */}
                    <div className="space-y-3.5">
                      {children}
                    </div>

                    {/* Footer Options */}
                    {footerText && !isLogin && !isSignup && (
                      <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                        {footerText}{" "}
                        <Link to={footerLink} className="font-semibold text-[#673AB7] dark:text-[#8b5cf6] hover:underline">
                          {footerLabel}
                        </Link>
                      </p>
                    )}
                    
                    {isLogin && (
                      <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                        Forgot your password?{" "}
                        <Link to="/forgot-password" className="font-semibold text-[#673AB7] dark:text-[#8b5cf6] hover:underline">
                          Reset Password
                        </Link>
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AuthLayout;