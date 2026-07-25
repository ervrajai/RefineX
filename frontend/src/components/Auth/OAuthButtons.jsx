import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const OAUTH_BASE = "http://localhost:8000/accounts";

function OAuthButtons({ mode = "signup" }) {
  return (
    <div className="mt-5">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/15" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400">
          Or continue with
        </span>
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/15" />
      </div>
      
      {/* OAuth Buttons Container */}
      <div className="mt-4 flex w-full items-center justify-center gap-3">
        
        {/* Google Button */}
        <a
          href={`${OAUTH_BASE}/google/login/`}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900/60 px-5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-zinc-800/80 focus:ring-4 focus:ring-[#673AB7]/15 dark:focus:ring-[#8b5cf6]/20 active:scale-[0.98]"
        >
          <FcGoogle className="h-4 w-4 shrink-0" />
          <span>Google</span>
        </a>
        
        {/* GitHub Button */}
        <a
          href={`${OAUTH_BASE}/github/login/`}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500 bg-white dark:bg-zinc-900/60 px-5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-zinc-800/80 focus:ring-4 focus:ring-[#673AB7]/15 dark:focus:ring-[#8b5cf6]/20 active:scale-[0.98]"
        >
          <FaGithub className="h-4 w-4 shrink-0 text-slate-900 dark:text-white" />
          <span>GitHub</span>
        </a>
        
      </div>
    </div>
  );
}

export default OAuthButtons;