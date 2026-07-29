import React, { useId } from "react";

export function AnimatedCheckbox({
  checked,
  onChange,
  label,
  className = "",
  disabled = false,
  id: customId,
  size = 20,
  color,
  ...props
}) {
  const generatedId = useId();
  const id = customId || generatedId;

  return (
    <div
      className={`inline-flex items-center gap-2.5 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <label
        htmlFor={id}
        className={`refinex-checkbox relative inline-flex items-center justify-center cursor-pointer select-none -webkit-tap-highlight-color-transparent ${
          disabled ? "pointer-events-none" : ""
        }`}
        style={{
          "--checkbox-size": typeof size === "number" ? `${size}px` : size,
          ...(color ? { "--checkbox-color": color } : {}),
        }}
      >
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="checkbox-input sr-only"
          {...props}
        />
        <div className="checkbox-wrapper">
          <div className="checkbox-bg" />
          <svg className="checkbox-icon" viewBox="0 0 24 24" fill="none">
            <path
              className="check-path"
              d="M4 12L10 18L20 6"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </label>

      {label && (
        <label
          htmlFor={id}
          className="cursor-pointer select-none text-xs sm:text-sm text-slate-700 dark:text-zinc-300 w-full"
        >
          {label}
        </label>
      )}

      <style>{`
        .refinex-checkbox {
          --checkbox-size: 20px;
          --checkbox-color: var(--color-primary, #673ab7);
          --checkbox-glow: rgba(103, 58, 183, 0.25);
        }

        .checkbox-wrapper {
          position: relative;
          width: var(--checkbox-size);
          height: var(--checkbox-size);
          border-radius: 6px;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .checkbox-bg {
          position: absolute;
          inset: 0;
          border-radius: 6px;
          border: 2px solid #cbd5e1;
          background: #ffffff;
          transition: all 0.2s ease;
        }

        :is(.dark) .checkbox-bg {
          border-color: #3f3f46;
          background: #272727;
        }

        .checkbox-icon {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 80%;
          height: 80%;
          color: #ffffff;
          transform: scale(0);
          transition: transform 0.2s ease;
          pointer-events: none;
        }

        .check-path {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          transition: stroke-dashoffset 0.3s ease 0.1s;
        }

        /* Checked State */
        .refinex-checkbox input:checked + .checkbox-wrapper .checkbox-bg {
          background: var(--checkbox-color);
          border-color: var(--checkbox-color);
        }

        .refinex-checkbox input:checked + .checkbox-wrapper .checkbox-icon {
          transform: scale(1);
        }

        .refinex-checkbox input:checked + .checkbox-wrapper .check-path {
          stroke-dashoffset: 0;
        }

        /* Hover Effects */
        .refinex-checkbox:hover .checkbox-wrapper {
          transform: scale(1.06);
        }

        /* Active Animation */
        .refinex-checkbox:active .checkbox-wrapper {
          transform: scale(0.94);
        }

        /* Focus Styles */
        .refinex-checkbox input:focus-visible + .checkbox-wrapper .checkbox-bg {
          box-shadow: 0 0 0 4px var(--checkbox-glow);
        }

        /* Bounce Animation */
        @keyframes checkboxBounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.12);
          }
        }

        .refinex-checkbox input:checked + .checkbox-wrapper {
          animation: checkboxBounce 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}

export default AnimatedCheckbox;