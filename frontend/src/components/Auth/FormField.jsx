import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function FormField({ label, error, ...props }) {
  const isPassword = props.type === "password";
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : props.type;

  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-400">{label}</span>
      <div className="relative mt-1">
        <input
          {...props}
          type={inputType}
          className={`w-full rounded-lg border bg-white/5 pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:ring-1 ${
            error
              ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-white/10 focus:border-brand focus:ring-brand/20"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <span className="mt-1 block text-xs font-medium text-rose-400">{error}</span>}
    </label>
  );
}

export default FormField;
