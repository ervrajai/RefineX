import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Recalculate fixed portal coordinates relative to window viewport
  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Decide drop direction based on available space (220px threshold)
      const direction = spaceBelow < 220 && spaceAbove > 220 ? "up" : "down";
      setDropDirection(direction);

      setCoords({
        top: rect.bottom + 6,
        bottom: window.innerHeight - rect.top + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Update coordinates on scroll or window resize while open
  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    const handleScrollOrResize = (event) => {
      // If trigger element scrolled outside viewport, close menu
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false);
          return;
        }
      }
      updateCoords();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updateCoords]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
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

  // Inline style for absolute portal floating
  const dropdownStyle = {
    position: "fixed",
    left: `${coords.left}px`,
    width: `${coords.width}px`,
    zIndex: 999999,
    ...(dropDirection === "down" 
      ? { top: `${coords.top}px` } 
      : { bottom: `${coords.bottom}px` })
  };

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
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

      {/* Animated Dropdown Menu rendered via React Portal directly into body */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              style={dropdownStyle}
              initial={animationProps.initial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={animationProps.exit}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-[#212121] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
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
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export default AnimatedSelect;