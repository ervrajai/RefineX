import React, { useRef } from "react";

function OtpInput({ length = 6, value = "", onChange }) {
  const inputsRef = useRef([]);
  const otpArray = Array(length).fill("");

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (val && !/^\d+$/.test(val)) return;

    const newOtp = value.split("");
    newOtp[index] = val.slice(-1);
    const updatedValue = newOtp.join("");
    onChange(updatedValue);

    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const currentVal = value[index] || "";
      if (!currentVal && index > 0) {
        const newOtp = value.split("");
        newOtp[index - 1] = "";
        const updatedValue = newOtp.join("");
        onChange(updatedValue);
        inputsRef.current[index - 1]?.focus();
      } else {
        const newOtp = value.split("");
        newOtp[index] = "";
        const updatedValue = newOtp.join("");
        onChange(updatedValue);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const digitsOnly = pasteData.replace(/\D/g, "").slice(0, length);
    if (digitsOnly) {
      onChange(digitsOnly);
      const targetIndex = Math.min(digitsOnly.length - 1, length - 1);
      inputsRef.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 px-1 mt-3" onPaste={handlePaste}>
      {otpArray.map((_, index) => {
        const char = value[index] || "";
        return (
          <React.Fragment key={index}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={char}
              ref={(el) => (inputsRef.current[index] = el)}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
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
