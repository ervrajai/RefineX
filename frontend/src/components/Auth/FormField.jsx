import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function FormField({ label, error, ...props }) {
  const isPassword = props.type === "password";
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : props.type;

  return (
    <label className="block text-left space-y-1.5">
      {/* Label */}
      {label && (
        <span className="block text-xs font-semibold text-slate-800 dark:text-zinc-200 pl-3">
          {label}
        </span>
      )}

      {/* Input Container */}
      <div className="relative">
        <input
          {...props}
          type={inputType}
          className={`w-full rounded-full bg-white dark:bg-zinc-900/60 pl-5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none transition-all duration-200 py-2.5 shadow-sm ${
            isPassword ? "pr-12" : "pr-5"
          } ${
            error
              ? "border-2 border-rose-500 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10"
              : "border border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500 focus:border-[#673AB7] dark:focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#673AB7]/15 dark:focus:ring-[#8b5cf6]/20"
          }`}
        />

        {/* Password Toggle Button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-full focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-rose-500 dark:text-rose-400 pl-3">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 inline-block shrink-0" />
          <span>{Array.isArray(error) ? error[0] : error}</span>
        </p>
      )}
    </label>
  );
}

export default FormField;