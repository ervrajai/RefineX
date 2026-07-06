import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const OAUTH_BASE = "http://localhost:8000/accounts";

function OAuthButtons({ mode = "signup" }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">or continue with</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>
      
      {/* Added w-full and gap-3 for proper spacing */}
      <div className="mt-4 flex w-full items-center justify-center gap-3">
        
        {/* Google Button */}
        <a
          href={`${OAUTH_BASE}/google/login/`}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-6 py-2.5 text-sm font-semibold text-slate-800 dark:text-zinc-200 transition-all hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.98]"
        >
          <FcGoogle className="h-5 w-5" />
          <span>Google</span>
        </a>
        
        {/* GitHub Button */}
        <a
          href={`${OAUTH_BASE}/github/login/`}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-6 py-2.5 text-sm font-semibold text-slate-800 dark:text-zinc-200 transition-all hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.98]"
        >
          <FaGithub className="h-5 w-5 text-slate-900 dark:text-white" />
          <span>GitHub</span>
        </a>
        
      </div>
    </div>
  );
}

export default OAuthButtons;