import React, { useRef } from "react";

function OtpInput({ length = 6, value = "", onChange }) {
  const inputsRef = useRef([]);

  // Handles raw input events — works correctly on Android IME & iOS
  const handleInput = (e, index) => {
    const raw = e.target.value;

    // Keep only the last digit typed (handles Android composing extra chars)
    const digit = raw.replace(/\D/g, "").slice(-1);

    const newOtp = value.split("").concat(Array(length).fill("")).slice(0, length);
    newOtp[index] = digit;
    const updated = newOtp.join("");
    onChange(updated);

    // Auto-advance to next box if a digit was entered
    if (digit && index < length - 1) {
      setTimeout(() => inputsRef.current[index + 1]?.focus(), 0);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const currentVal = value[index] || "";
      const newOtp = value.split("").concat(Array(length).fill("")).slice(0, length);

      if (!currentVal && index > 0) {
        // Current box empty — clear previous and move back
        newOtp[index - 1] = "";
        onChange(newOtp.join(""));
        inputsRef.current[index - 1]?.focus();
      } else {
        // Clear current box
        newOtp[index] = "";
        onChange(newOtp.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Clicking a filled box — select its content so typing replaces it
  const handleFocus = (e) => {
    e.target.select();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted.padEnd(length, "").slice(0, length).replace(/[^\d]/g, ""));
    // Actually build a clean string
    const digits = pasted.slice(0, length);
    onChange(digits);
    const focusIndex = Math.min(digits.length, length - 1);
    setTimeout(() => inputsRef.current[focusIndex]?.focus(), 0);
  };

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 px-1 mt-3" onPaste={handlePaste}>
      {Array(length).fill("").map((_, index) => {
        const char = value[index] || "";
        return (
          <React.Fragment key={index}>
            <input
              ref={(el) => (inputsRef.current[index] = el)}
              // type="tel" gives numeric keyboard on both iOS & Android
              // and avoids Android IME composing issues that affect type="text"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              // Enables SMS OTP auto-fill on iOS 12+ and Android
              autoComplete={index === 0 ? "one-time-code" : "off"}
              value={char}
              onInput={(e) => handleInput(e, index)}
              onChange={() => {}} // controlled — suppress React warning
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={handleFocus}
              className="otp-input w-10 h-12 sm:w-12 sm:h-14 text-center font-sans text-xl font-semibold rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-transparent focus:border-[#af52de] dark:focus:border-[#bf5af2] focus:bg-white dark:focus:bg-[#3a3a3c] focus:ring-4 focus:ring-[#af52de]/15 dark:focus:ring-[#bf5af2]/15 focus:scale-105 outline-none text-black dark:text-white transition-all duration-200 tracking-tight"
            />
            {index === 2 && (
              <span className="text-gray-400 dark:text-gray-500 font-bold mx-0.5 sm:mx-1">-</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default OtpInput;
