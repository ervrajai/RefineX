import React from "react";
import { Check, X } from "lucide-react";

function PasswordChecklist({ password = "" }) {
  const checks = [
    {
      label: "8 to 15 characters",
      pass: password.length >= 8 && password.length <= 15,
    },
    {
      label: "At least one uppercase letter",
      pass: /[A-Z]/.test(password),
    },
    {
      label: "At least one special character",
      pass: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const passedCount = checks.filter((c) => c.pass).length;
  const isFullyValid = passedCount === checks.length;

  return (
    <div className="mt-2.5 rounded-2xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/90 p-3.5 backdrop-blur-md transition-colors duration-200">
      {/* Header bar with progress ratio */}
      <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800/80 pb-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
          Password Strength
        </span>
        <span
          className={`text-[11px] font-medium transition-colors duration-200 ${
            isFullyValid
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-slate-500 dark:text-zinc-400"
          }`}
        >
          {passedCount} of {checks.length} satisfied
        </span>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.label}
            className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
              check.pass
                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                : "text-rose-700 dark:text-rose-400"
            }`}
          >
            {/* Status Icon Indicator */}
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                check.pass
                  ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
              }`}
            >
              {check.pass ? (
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              ) : (
                <X className="h-2.5 w-2.5 stroke-[3]" />
              )}
            </div>

            {/* Label */}
            <span className="leading-none select-none tracking-tight">
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PasswordChecklist;