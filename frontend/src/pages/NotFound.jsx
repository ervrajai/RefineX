import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Sparkles } from "lucide-react";
import logoImg from "../assets/logo/refinex_logo.png";

function NotFound() {
  const navigate = useNavigate();

  // Ensure theme settings apply even on direct deep link navigation
  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem("theme") || "auto";

    if (storedTheme === "dark") {
      root.classList.add("dark");
    } else if (storedTheme === "light") {
      root.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#212121] text-slate-900 dark:text-zinc-100 flex flex-col items-center justify-between p-6 relative overflow-hidden transition-colors duration-300 select-none">
      {/* Header Bar — Logo only */}
      <header className="w-full max-w-6xl flex items-center justify-start z-10 py-4">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <img
            src={logoImg}
            alt="RefineX Logo"
            className="w-9 h-9 md:w-10 md:h-10 object-cover rounded-xl shadow-sm transition-transform group-hover:scale-105"
          />
          <span className="sidebar-refine text-xl md:text-2xl tracking-wider inline-flex items-center text-slate-900 dark:text-white whitespace-nowrap">
            Refine<span className="font-sans text-[#673ab7] text-2xl md:text-3xl font-black ml-0.5 leading-none">X</span>
          </span>
        </Link>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex flex-col items-center justify-center z-10 max-w-lg text-center my-auto py-8">
        {/* Animated Face Container */}
        <div className="my-custom-face-container flex justify-center items-center h-[240px] sm:h-[280px] w-full text-[#1a1a1a] dark:text-white">
          <svg className="face w-40 sm:w-48" viewBox="0 0 320 380">
            <g
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={25}
            >
              <g className="face__eyes" transform="translate(0,112.5)">
                <g transform="translate(15,0)">
                  <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                  <polyline
                    className="face__pupil"
                    points="55,120 55,155"
                    strokeDasharray="35 35"
                  />
                </g>
                <g transform="translate(230,0)">
                  <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                  <polyline
                    className="face__pupil"
                    points="55,120 55,155"
                    strokeDasharray="35 35"
                  />
                </g>
              </g>
              <rect
                className="face__nose"
                x="132.5"
                y="112.5"
                width={55}
                height={155}
                rx={4}
                ry={4}
              />
              <g transform="translate(65,334)" strokeDasharray="102 102">
                <path className="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" />
                <path className="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" />
              </g>
            </g>
          </svg>
        </div>

        {/* 404 Text & Description */}
        <div className="space-y-3 mt-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-[#673ab7] dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#673ab7] dark:text-purple-300" /> 404 - Page Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Lost in Data Space?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md leading-relaxed">
            The page or link you requested does not exist, was renamed, or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 w-full">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#673ab7] hover:bg-[#5e35b1] text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
          >
            <Home className="w-4 h-4" /> Back to Landing Page
          </Link>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="z-10 text-[11px] text-slate-400 dark:text-zinc-500 py-2">
        © {new Date().getFullYear()} RefineX. All rights reserved.
      </footer>

      {/* Embedded SVG Keyframe Animations */}
      <style>{`
        .my-custom-face-container .face__eyes,
        .my-custom-face-container .face__eye-lid,
        .my-custom-face-container .face__mouth-left,
        .my-custom-face-container .face__mouth-right,
        .my-custom-face-container .face__nose,
        .my-custom-face-container .face__pupil {
          animation: eyes 1s 0.3s forwards;
        }

        .my-custom-face-container .face__eye-lid,
        .my-custom-face-container .face__pupil {
          animation-duration: 4s;
          animation-delay: 1.3s;
          animation-iteration-count: infinite;
        }

        .my-custom-face-container .face__eye-lid {
          animation-name: eye-lid;
        }
        .my-custom-face-container .face__mouth-left {
          animation-name: mouth-left;
        }
        .my-custom-face-container .face__mouth-right {
          animation-name: mouth-right;
        }
        .my-custom-face-container .face__nose {
          animation-name: nose;
        }
        .my-custom-face-container .face__pupil {
          animation-name: pupil;
        }

        @keyframes eye-lid {
          0%, 40%, 45%, 100% {
            transform: translateY(0);
          }
          42.5% {
            transform: translateY(17.5px);
          }
        }

        @keyframes eyes {
          from {
            transform: translateY(112.5px);
          }
          to {
            transform: translateY(15px);
          }
        }

        @keyframes pupil {
          0%, 37.5%, 40%, 45%, 87.5%, 100% {
            stroke-dashoffset: 0;
            transform: translate(0, 0);
          }
          12.5%, 25%, 62.5%, 75% {
            transform: translate(-35px, 0);
          }
          42.5% {
            stroke-dashoffset: 35;
            transform: translate(0, 17.5px);
          }
        }

        @keyframes mouth-left {
          from, 50% {
            stroke-dashoffset: -102;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes mouth-right {
          from, 50% {
            stroke-dashoffset: 102;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes nose {
          from {
            transform: translate(0, 0);
          }
          to {
            transform: translate(0, 22.5px);
          }
        }
      `}</style>
    </div>
  );
}

export default NotFound;
