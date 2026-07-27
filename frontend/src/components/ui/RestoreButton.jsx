import React from "react";

export default function RestoreButton({ onClick, loading = false, title = "Restore workspace" }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (loading) return;
    if (onClick) onClick(e);
  };

  return (
    <div className="inline-block">
      <style>{`
        .restore-btn {
          height: 32px;
          padding: 0 12px 0 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background-color: rgba(147, 51, 234, 0.1);
          border-radius: 30px;
          color: #9333ea;
          font-weight: 700;
          font-size: 12px;
          border: 1px solid rgba(147, 51, 234, 0.25);
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
          user-select: none;
          white-space: nowrap;
        }

        .dark .restore-btn {
          background-color: rgba(168, 85, 247, 0.18);
          color: #c084fc;
          border-color: rgba(168, 85, 247, 0.35);
        }

        .restore-btn:hover {
          background-color: #9333ea;
          color: #ffffff;
          border-color: #9333ea;
        }

        .dark .restore-btn:hover {
          background-color: #a855f7;
          color: #ffffff;
          border-color: #a855f7;
        }

        .restore-btn:active {
          transform: scale(0.95);
        }

        .restore-btn-icon {
          width: 15px;
          height: 15px;
          fill: currentColor;
          transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          shrink: 0;
        }

        .restore-btn:hover .restore-btn-icon {
          transform: rotate(250deg);
        }

        .restore-btn.is-loading .restore-btn-icon {
          animation: restoreSpin 1s linear infinite;
        }

        @keyframes restoreSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={title}
        className={`restore-btn ${loading ? "is-loading opacity-80" : ""}`}
      >
        <svg
          className="restore-btn-icon"
          viewBox="0 0 512 512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
        </svg>
        <span>{loading ? "Restoring..." : "Restore"}</span>
      </button>
    </div>
  );
}
