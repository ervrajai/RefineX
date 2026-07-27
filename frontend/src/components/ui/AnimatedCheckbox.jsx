import React, { useId } from "react";

export function AnimatedCheckbox({ checked, onChange, label, className = "" }) {
  const id = useId();

  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <label
          htmlFor={id}
          className="cursor-pointer relative flex items-center justify-center w-[18px] h-[18px] [-webkit-tap-highlight-color:transparent]
            before:content-[''] before:absolute before:w-9 before:h-9 before:rounded-full before:bg-primary/10 dark:before:bg-primary/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200
            text-slate-300 dark:text-zinc-600 hover:text-primary dark:hover:text-primary
            peer-checked:text-primary dark:peer-checked:text-primary
            [&_path]:[stroke-dasharray:60] [&_path]:[stroke-dashoffset:0] [&_path]:transition-all [&_path]:duration-300
            peer-checked:[&_path]:[stroke-dashoffset:60]
            [&_polyline]:[stroke-dasharray:22] [&_polyline]:[stroke-dashoffset:66] [&_polyline]:transition-all [&_polyline]:duration-200
            peer-checked:[&_polyline]:[stroke-dashoffset:42] peer-checked:[&_polyline]:delay-150"
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 18 18" 
            className="relative z-10 fill-none stroke-current stroke-[1.5]" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z" />
            <polyline points="1 9 7 14 15 4" />
          </svg>
        </label>
      </div>
      
      {label && (
        <label htmlFor={id} className="cursor-pointer select-none w-full">
          {label}
        </label>
      )}
    </div>
  );
}