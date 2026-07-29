import React, { useState } from "react";

export default function RefreshButton({ onClick, loading = false, label = "Refresh Log", title }) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 500);
    if (onClick) onClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={title || label}
      className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 h-9 text-xs font-bold rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-white cursor-pointer transition-all duration-200 shadow-xs active:scale-95 disabled:opacity-50 select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className={`w-3.5 h-3.5 text-white dark:text-slate-900 transition-transform duration-500 ease-in-out ${
          isSpinning || loading ? "animate-spin" : "group-hover:rotate-180"
        }`}
      >
        <path
          d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"
        />
        <path
          fillRule="evenodd"
          d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
