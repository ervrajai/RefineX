import React, { useState } from "react";

export default function AnimatedDownloadButton({
  label = "Download",
  completedLabel = "Done",
  onClick,
  className = "",
  color = "rgb(91, 91, 240)",
  successColor = "rgb(35, 174, 35)"
}) {
  const [checked, setChecked] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (checked) return;
    setChecked(true);

    try {
      if (onClick) {
        await onClick();
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      // Reset button state after the 4.2s animation sequence
      setTimeout(() => {
        setChecked(false);
      }, 4200);
    }
  };

  return (
    <div className={`download-btn-wrapper inline-block ${className}`}>
      <style>{`
        .download-btn-container {
          padding: 0;
          margin: 0;
          box-sizing: border-box;
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }

        .download-btn-label {
          background-color: transparent;
          border: 2px solid ${color};
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 50px;
          min-width: 135px;
          height: 38px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          padding: 3px 14px 3px 3px;
          position: relative;
          user-select: none;
          overflow: hidden;
          gap: 8px;
        }

        .download-btn-label::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #ffffff;
          width: 8px;
          height: 8px;
          transition: all 0.4s ease;
          border-radius: 100%;
          margin: auto;
          opacity: 0;
          visibility: hidden;
        }

        .download-btn-label .input {
          display: none;
        }

        .download-btn-label .title {
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          transition: all 0.3s ease;
          white-space: nowrap;
          margin: 0;
          padding: 0;
          line-height: 1;
          flex: 1;
          text-align: center;
        }

        .dark .download-btn-label .title {
          color: #f1f5f9;
        }

        .download-btn-label .title:last-child {
          opacity: 0;
          visibility: hidden;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: ${successColor};
        }

        .download-btn-label .circle {
          height: 28px;
          width: 28px;
          border-radius: 50%;
          background-color: ${color};
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.4s ease;
          position: relative;
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          overflow: hidden;
          flex-shrink: 0;
        }

        .download-btn-label .circle .icon {
          color: #ffffff;
          width: 16px;
          height: 16px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: all 0.4s ease;
        }

        .download-btn-label .circle .square {
          aspect-ratio: 1;
          width: 9px;
          border-radius: 2px;
          background-color: #ffffff;
          opacity: 0;
          visibility: hidden;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: all 0.4s ease;
        }

        .download-btn-label .circle::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          background-color: rgba(0, 0, 0, 0.25);
          width: 100%;
          height: 0;
          transition: all 0.4s ease;
        }

        .download-btn-label:has(.input:checked) {
          width: 38px;
          min-width: 38px;
          padding: 3px;
          animation: installed 0.4s ease 3.5s forwards;
        }

        .download-btn-label:has(.input:checked)::before {
          animation: rotate 3s ease-in-out 0.4s forwards;
        }

        .download-btn-label .input:checked + .circle {
          animation:
            pulse 1s forwards,
            circleDelete 0.2s ease 3.5s forwards;
          transform: rotate(180deg);
        }

        .download-btn-label .input:checked + .circle::before {
          animation: installing 3s ease-in-out forwards;
        }

        .download-btn-label .input:checked + .circle .icon {
          opacity: 0;
          visibility: hidden;
        }

        .download-btn-label .input:checked + .circle .square {
          opacity: 1;
          visibility: visible;
        }

        .download-btn-label .input:checked ~ .title {
          opacity: 0;
          visibility: hidden;
        }

        .download-btn-label .input:checked ~ .title:last-child {
          animation: showInstalledMessage 0.4s ease 3.5s forwards;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.95) rotate(180deg);
            box-shadow: 0 0 0 0 rgba(91, 91, 240, 0.7);
          }
          70% {
            transform: scale(1) rotate(180deg);
            box-shadow: 0 0 0 12px rgba(91, 91, 240, 0);
          }
          100% {
            transform: scale(0.95) rotate(180deg);
            box-shadow: 0 0 0 0 rgba(91, 91, 240, 0);
          }
        }

        @keyframes installing {
          from {
            height: 0;
          }
          to {
            height: 100%;
          }
        }

        @keyframes rotate {
          0% {
            transform: rotate(-90deg) translate(19px) rotate(0);
            opacity: 1;
            visibility: visible;
          }
          99% {
            transform: rotate(270deg) translate(19px) rotate(270deg);
            opacity: 1;
            visibility: visible;
          }
          100% {
            opacity: 0;
            visibility: hidden;
          }
        }

        @keyframes installed {
          100% {
            width: 120px;
            min-width: 120px;
            border-color: ${successColor};
          }
        }

        @keyframes circleDelete {
          100% {
            opacity: 0;
            visibility: hidden;
          }
        }

        @keyframes showInstalledMessage {
          100% {
            opacity: 1;
            visibility: visible;
          }
        }
      `}</style>

      <div className="download-btn-container">
        <label className="download-btn-label" onClick={handleClick}>
          <input
            type="checkbox"
            className="input"
            checked={checked}
            onChange={() => {}}
          />
          <span className="circle">
            <svg
              className="icon"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19V5m0 14-4-4m4 4 4-4"
              />
            </svg>
            <div className="square" />
          </span>
          <p className="title">{label}</p>
          <p className="title">{completedLabel}</p>
        </label>
      </div>
    </div>
  );
}
