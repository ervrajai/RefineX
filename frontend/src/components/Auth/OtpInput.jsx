import { useRef } from "react";

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
    <div className="flex justify-center gap-1.5 sm:gap-2.5 mt-2" onPaste={handlePaste}>
      {otpArray.map((_, index) => {
        const char = value[index] || "";
        return (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={char}
            ref={(el) => (inputsRef.current[index] = el)}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-9 h-9 sm:w-11 sm:h-11 text-center bg-white/5 border-b-2 border-zinc-700 focus:border-brand focus:outline-none text-white text-base sm:text-lg font-bold transition-colors rounded-t-md"
          />
        );
      })}
    </div>
  );
}

export default OtpInput;
