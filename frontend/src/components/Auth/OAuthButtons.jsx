import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const OAUTH_BASE = "http://localhost:8000/accounts";

function OAuthButtons({ mode = "signup" }) {
  const label = mode === "signup" ? "Sign up" : "Log in";

  return (
    <div className="mt-7">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href={`${OAUTH_BASE}/google/login/`}
          className="flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <FcGoogle className="h-5 w-5" />
          {label} with Google
        </a>
        <a
          href={`${OAUTH_BASE}/github/login/`}
          className="flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <FaGithub className="h-5 w-5" />
          {label} with GitHub
        </a>
      </div>
    </div>
  );
}

export default OAuthButtons;
