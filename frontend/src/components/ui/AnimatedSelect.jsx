import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AnimatedSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select...", 
  disabled = false, 
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Normalize options to [{ value, label }] format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null && "value" in opt) {
      return opt;
    }
    return { value: String(opt), label: String(opt) };
  });

  // Find the label for the currently selected value
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  const handleSelectOption = (optValue) => {
    setIsOpen(false);
    if (onChange) {
      // Create synthetic event for backwards compatibility
      const syntheticEvent = {
        target: { value: optValue },
        currentTarget: { value: optValue },
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      onChange(optValue, syntheticEvent);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg border bg-white dark:bg-zinc-900 transition-all cursor-pointer font-semibold select-none ${
          disabled 
            ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-zinc-800" 
            : isOpen 
              ? "border-slate-900 ring-4 ring-slate-900/5 dark:border-white dark:ring-white/5" 
              : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
        } text-slate-900 dark:text-white`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ease-out ${
            isOpen 
              ? "rotate-180 text-slate-900 dark:text-white" 
              : "text-slate-400 dark:text-zinc-500"
          }`} 
        />
      </div>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-[999] w-full mt-2 bg-white dark:bg-[#212121] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
              {normalizedOptions.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelectOption(option.value)}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors duration-150 select-none ${
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AnimatedSelect;