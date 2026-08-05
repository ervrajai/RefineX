"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const EASE_OUT = [0.16, 1, 0.3, 1];
const ROW_TRANSITION = { type: "spring", duration: 0.55, bounce: 0.38 };
const CONTENT_OPEN_TRANSITION = { type: "spring", duration: 0.58, bounce: 0.32 };
const CONTENT_CLOSE_TRANSITION = { type: "spring", duration: 0.46, bounce: 0.26 };
const DESCRIPTION_TRANSITION = { duration: 0.18, ease: EASE_OUT };
const CHEVRON_TRANSITION = { type: "spring", duration: 0.42, bounce: 0.28 };

function useControllableAccordionValue({ value, defaultValue, onValueChange }) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? null);
  const isControlled = value !== undefined;
  const currentValue = value ?? internalValue;

  const setValue = useCallback(
    (next) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return [currentValue, setValue];
}

function BouncyAccordionRow({
  item,
  open,
  isFirst,
  startsGroup,
  endsGroup,
  separatedFromPrevious,
  contentId,
  triggerId,
  reduce,
  classNames,
  onToggle,
}) {
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    const updateHeight = () => setContentHeight(node.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ marginTop: separatedFromPrevious ? 16 : (!isFirst ? -1 : 0) }}
      transition={reduce ? { duration: 0 } : ROW_TRANSITION}
    >
      <motion.div
        data-state={open ? "open" : "closed"}
        initial={false}
        animate={{
          borderTopLeftRadius: startsGroup ? 20 : 0,
          borderTopRightRadius: startsGroup ? 20 : 0,
          borderBottomLeftRadius: endsGroup ? 20 : 0,
          borderBottomRightRadius: endsGroup ? 20 : 0,
        }}
        transition={reduce ? { duration: 0 } : ROW_TRANSITION}
        className={cn(
          "overflow-hidden bg-white dark:bg-[#212121] shadow-sm border border-slate-200 dark:border-zinc-800 transition-colors relative z-0",
          open && "z-10",
          item.customClass, // Allows custom borders for ML vs Vis vs Cleaning
          item.disabled && "opacity-50",
          classNames?.item
        )}
      >
        <div
          id={triggerId}
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={onToggle}
          className={cn(
            "flex min-h-[54px] w-full items-center gap-4 px-5 py-4 text-left outline-none cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition duration-150",
            "disabled:pointer-events-none",
            classNames?.trigger
          )}
        >
          {item.icon && (
            <span className={cn("flex shrink-0 items-center justify-center text-slate-500", classNames?.icon)}>
              {item.icon}
            </span>
          )}

          <div className={cn("min-w-0 flex-1", classNames?.title)}>
            {item.title}
          </div>

          <motion.span
            aria-hidden
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : CHEVRON_TRANSITION}
            className={cn("grid h-8 w-8 shrink-0 place-items-center text-slate-500 dark:text-zinc-400 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800", classNames?.chevron)}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </div>

        <motion.div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          aria-hidden={!open}
          initial={false}
          animate={{ height: open && item.description ? contentHeight : 0 }}
          transition={
            reduce ? { duration: 0 } : open ? CONTENT_OPEN_TRANSITION : CONTENT_CLOSE_TRANSITION
          }
          className={cn("overflow-hidden", classNames?.content)}
        >
          <motion.div
            ref={contentRef}
            animate={{ opacity: open ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : DESCRIPTION_TRANSITION}
            className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20"
          >
            <div className={cn("p-5", classNames?.description)}>
              {item.description}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function BouncyAccordion({
  items,
  value,
  defaultValue = null,
  onValueChange,
  collapsible = true,
  className,
  classNames,
}) {
  const reduce = useReducedMotion();
  const baseId = useId();

  const [activeValue, setActiveValue] = useControllableAccordionValue({
    value,
    defaultValue,
    onValueChange,
  });

  const activeIndex = items.findIndex((item) => item.id === activeValue);

  const toggleItem = useCallback(
    (id) => {
      if (activeValue === id) {
        if (collapsible) setActiveValue(null);
        return;
      }
      setActiveValue(id);
    },
    [activeValue, collapsible, setActiveValue]
  );

  return (
    <div className={cn("w-full space-y-0", className, classNames?.root)}>
      {items.map((item, index) => {
        const isFirst = index === 0;
        const open = activeValue === item.id;
        const previousIsOpen = activeIndex === index - 1;
        const nextIsOpen = activeIndex === index + 1;
        const startsGroup = open || isFirst || previousIsOpen;
        const endsGroup = open || index === items.length - 1 || nextIsOpen;
        const separatedFromPrevious = !isFirst && (open || previousIsOpen);
        const contentId = `${baseId}-${item.id}-content`;
        const triggerId = `${baseId}-${item.id}-trigger`;

        return (
          <BouncyAccordionRow
            key={item.id}
            item={item}
            open={open}
            isFirst={isFirst}
            startsGroup={startsGroup}
            endsGroup={endsGroup}
            separatedFromPrevious={separatedFromPrevious}
            contentId={contentId}
            triggerId={triggerId}
            reduce={reduce}
            classNames={classNames}
            onToggle={() => toggleItem(item.id)}
          />
        );
      })}
    </div>
  );
}