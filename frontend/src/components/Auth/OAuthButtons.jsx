import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const OAUTH_BASE = "http://localhost:8000/accounts";

function OAuthButtons({ mode = "signup" }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">or continue with</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <a
          href={`${OAUTH_BASE}/google/login/`}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
        >
          <FcGoogle className="h-4 w-4" />
          <span>Google</span>
        </a>
        <a
          href={`${OAUTH_BASE}/github/login/`}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
        >
          <FaGithub className="h-4 w-4 text-white" />
          <span>GitHub</span>
        </a>
      </div>
    </div>
  );
}

export default OAuthButtons;
