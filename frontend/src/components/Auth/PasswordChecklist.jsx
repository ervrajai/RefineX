import { Check, X } from "lucide-react";

function PasswordChecklist({ password }) {
  const checks = [
    { label: "8 to 15 characters", pass: password.length >= 8 && password.length <= 15 },
    { label: "At least one uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "At least one special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="rounded-md bg-slate-50 p-3">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-2 py-1 text-xs text-slate-600">
          {check.pass ? <Check className="h-4 w-4 text-teal-700" /> : <X className="h-4 w-4 text-slate-400" />}
          <span>{check.label}</span>
        </div>
      ))}
    </div>
  );
}

export default PasswordChecklist;
