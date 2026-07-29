import React, { useState } from "react";

export default function AnimatedDownloadButton({ label = "Download", onClick, className = "" }) {
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
      // 4.2s timeout matches the full CSS animation cycle (3s fill + 0.5s morph + 0.7s completed display)
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
          border: 2px solid var(--primary-color, rgb(91, 91, 240));
          display: inline-flex;
          align-items: center;
          border-radius: 50px;
          height: 42px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          padding: 3px 16px 3px 3px;
          position: relative;
          user-select: none;
          gap: 10px;
        }

        .download-btn-label::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--primary-color, rgb(91, 91, 240));
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
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          transition: all 0.3s ease;
          white-space: nowrap;
          margin: 0;
          padding: 0;
          line-height: 1;
        }

        .dark .download-btn-label .title {
          color: #f4f4f5;
        }

        .download-btn-label .title:last-child {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          visibility: hidden;
          margin: 0;
          color: rgb(35, 174, 35);
        }

        .download-btn-label .circle {
          height: 32px;
          width: 32px;
          border-radius: 50%;
          background-color: var(--primary-color, rgb(91, 91, 240));
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.4s ease;
          position: relative;
          box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          overflow: hidden;
          shrink: 0;
        }

        .download-btn-label .circle .icon {
          color: #fff;
          width: 18px;
          height: 18px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: all 0.4s ease;
        }

        .download-btn-label .circle .square {
          aspect-ratio: 1;
          width: 12px;
          border-radius: 2px;
          background-color: #fff;
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
          background-color: #3333a8;
          width: 100%;
          height: 0;
          transition: all 0.4s ease;
        }

        .download-btn-label:has(.input:checked) {
          width: 42px;
          min-width: 42px;
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
          rotate: 180deg;
        }

        .download-btn-label .input:checked + .circle::before {
          animation: installing 3s ease-in-out forwards;
        }

        .download-btn-label .input:checked + .circle .icon {
          opacity: 0;
          visibility: hidden;
        }

        .download-btn-label .input:checked ~ .circle .square {
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
            scale: 0.95;
            box-shadow: 0 0 0 0 rgba(91, 91, 240, 0.7);
          }
          70% {
            scale: 1;
            box-shadow: 0 0 0 14px rgba(91, 91, 240, 0);
          }
          100% {
            scale: 0.95;
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
            transform: rotate(-90deg) translate(21px) rotate(0);
            opacity: 1;
            visibility: visible;
          }
          99% {
            transform: rotate(270deg) translate(21px) rotate(270deg);
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
            border-color: rgb(35, 174, 35);
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
                strokeWidth="1.5"
                d="M12 19V5m0 14-4-4m4 4 4-4"
              />
            </svg>
            <div className="square" />
          </span>
          <p className="title">{label}</p>
          <p className="title">Done</p>
        </label>
      </div>
    </div>
  );
}
