import React from "react";
import { X, Sparkles, ArrowRight, LogIn, UserPlus, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LimitModal({
  isOpen,
  onClose,
  title = "Daily Guest Limit Reached",
  badge = "Guest Tier Limit",
  message = "You've used your 3 free guest dataset cleans for today. Log in or create a free account to unlock unlimited data cleaning, interactive visualizations, and ML training!"
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-left relative transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded-xl bg-slate-100 dark:bg-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800 focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#673ab7]/10 dark:bg-[#673ab7]/25 border border-[#673ab7]/20 dark:border-[#673ab7]/30 flex items-center justify-center text-[#673ab7] dark:text-[#a855f7] shrink-0 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#673ab7] dark:text-[#a855f7] block">
              {badge}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
          </div>
        </div>

        {/* Body Message */}
        <p className="text-sm text-slate-700 dark:text-zinc-300 mb-6 leading-relaxed font-medium">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              navigate("/login", { state: { message: "Please log in to your account to continue." } });
            }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 bg-[#673ab7] hover:bg-[#522e93] text-white font-bold text-sm rounded-2xl border border-transparent transition-colors duration-200 cursor-pointer active:scale-[0.99]"
          >
            <LogIn className="w-4.5 h-4.5" />
            <span>Log In to Existing Account</span>
            <ArrowRight className="w-4.5 h-4.5 ml-auto opacity-80" />
          </button>

          <button
            onClick={() => {
              onClose();
              navigate("/signup", { state: { message: "Please create a free account to unlock ML training, visualizations, and unlimited cleaning." } });
            }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-bold text-sm rounded-2xl border border-slate-300/80 dark:border-zinc-700 transition-colors duration-200 cursor-pointer active:scale-[0.99]"
          >
            <UserPlus className="w-4.5 h-4.5 text-[#673ab7] dark:text-[#a855f7]" />
            <span>Create New Free Account</span>
            <ArrowRight className="w-4.5 h-4.5 ml-auto text-slate-400 dark:text-zinc-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LimitModal;
