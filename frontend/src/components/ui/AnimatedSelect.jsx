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
  const [dropDirection, setDropDirection] = useState("down");
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

  // Smart Positioning: Decide whether to drop UP or DOWN based on screen space
  const handleToggle = () => {
    if (disabled) return;
    
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // If there is less than 220px of space below, open upwards
      if (spaceBelow < 220) {
        setDropDirection("up");
      } else {
        setDropDirection("down");
      }
    }
    
    setIsOpen(!isOpen);
  };

  // Normalize options to [{ value, label }] format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null && "value" in opt) {
      return opt;
    }
    return { value: String(opt), label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  const handleSelectOption = (optValue) => {
    setIsOpen(false);
    if (onChange) {
      const syntheticEvent = {
        target: { value: optValue },
        currentTarget: { value: optValue },
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      onChange(optValue, syntheticEvent);
    }
  };

  // Dynamic animation values based on direction
  const animationProps = dropDirection === "down" 
    ? { initial: { opacity: 0, y: -8, scale: 0.96 }, exit: { opacity: 0, y: -8, scale: 0.96 } }
    : { initial: { opacity: 0, y: 8, scale: 0.96 }, exit: { opacity: 0, y: 8, scale: 0.96 } };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        onClick={handleToggle}
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
              ? dropDirection === "down" ? "rotate-180 text-slate-900 dark:text-white" : "rotate-0 text-slate-900 dark:text-white" 
              : "text-slate-400 dark:text-zinc-500"
          }`} 
        />
      </div>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={animationProps.initial}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={animationProps.exit}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-[999] w-full bg-white dark:bg-[#212121] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden ${
              dropDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
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