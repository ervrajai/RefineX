import React, { useState, useRef, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Upload
} from "lucide-react";

/**
 * Format raw byte count into human-readable string (KB, MB, GB)
 */
const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Return appropriate React icon & accent color based on file extension
 */
const getFileIconAndBadge = (fileName = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "csv":
      return {
        icon: <FileSpreadsheet className="w-7 h-7 text-emerald-500" />,
        badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        label: "CSV"
      };
    case "xlsx":
    case "xls":
      return {
        icon: <FileSpreadsheet className="w-7 h-7 text-green-600" />,
        badgeBg: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        label: ext.toUpperCase()
      };
    case "json":
      return {
        icon: <FileCode className="w-7 h-7 text-amber-500" />,
        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        label: "JSON"
      };
    default:
      return {
        icon: <FileText className="w-7 h-7 text-[#673ab7]" />,
        badgeBg: "bg-[#673ab7]/10 text-[#673ab7] dark:text-purple-300 border-[#673ab7]/20",
        label: ext ? ext.toUpperCase() : "FILE"
      };
  }
};

const FileUpload = ({
  onFileUpload,
  uploading = false,
  progress = 0,
  loadedBytes = 0,
  totalBytes = 0,
  uploadSpeed = 0,
  errorMsg = "",
  successMsg = "",
  acceptedFormats = [".csv", ".xlsx", ".xls", ".json"],
  maxSizeMB = 100,
  onReset,
  onCancel
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [displayProgress, setDisplayProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Smooth real-time progress ticker for visual progress count-up
  useEffect(() => {
    if (!uploading) {
      if (successMsg) {
        setDisplayProgress(100);
      } else {
        setDisplayProgress(0);
      }
      return;
    }

    let target = Math.max(progress, 5);
    if (progress === 100 && uploading) {
      target = 98;
    }

    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev < target) {
          const diff = target - prev;
          const step = Math.max(1, Math.min(diff, Math.ceil(diff * 0.2)));
          return Math.min(100, prev + step);
        } else if (prev > target && progress < 100) {
          return target;
        }
        return prev;
      });
    }, 35);

    return () => clearInterval(interval);
  }, [uploading, progress, successMsg]);

  // Clear validation error when external error changes
  useEffect(() => {
    if (errorMsg) {
      setValidationError("");
    }
  }, [errorMsg]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const validateFile = (file) => {
    if (!file) return false;
    setValidationError("");

    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    const isValidFormat = acceptedFormats.some(
      (fmt) => fmt.toLowerCase() === fileExt
    );

    if (!isValidFormat) {
      setValidationError(
        `Unsupported file format (${fileExt}). Please select ${acceptedFormats.join(", ")}.`
      );
      return false;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setValidationError(
        `File size (${formatBytes(file.size)}) exceeds maximum limit of ${maxSizeMB}MB.`
      );
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateFile(file);
    }
  };

  const handleConfirmUpload = () => {
    if (!selectedFile) return;
    setDisplayProgress(5);
    if (onFileUpload) {
      onFileUpload(selectedFile);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setValidationError("");
    setDisplayProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onReset) onReset();
  };

  const fileDetails = selectedFile ? getFileIconAndBadge(selectedFile.name) : null;
  const isCompleted = !uploading && successMsg && selectedFile;
  const isFailed = !uploading && (errorMsg || validationError);

  const getStageMessage = () => {
    if (displayProgress < 25) return "Initializing upload stream...";
    if (displayProgress < 75) return `Transferring dataset... ${displayProgress}%`;
    if (displayProgress < 99) return "Verifying schema & profiling dataset columns...";
    return "Finalizing profile & building data view...";
  };

  const fileSize = selectedFile?.size || totalBytes || 0;

  return (
    <>
      <style>{`
        /* 3D Folder Container */
        .folder-container {
          --transition: 350ms;
          --folder-W: 110px;
          --folder-H: 75px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding: 12px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          border-radius: 20px;
          box-shadow: 0 12px 28px rgba(124, 58, 237, 0.35);
          height: calc(var(--folder-H) * 1.65);
          width: 210px;
          position: relative;
          user-select: none;
          perspective: 1000px;
        }

        .folder-element {
          position: absolute;
          top: -18px;
          left: calc(50% - 55px);
          width: var(--folder-W);
          height: var(--folder-H);
          transition: transform var(--transition) ease;
          transform-style: preserve-3d;
        }

        .group:hover .folder-element,
        .folder-container:hover .folder-element {
          transform: scale(1.04);
        }

        .folder-element .back-side {
          position: absolute;
          top: 0;
          left: 0;
          width: var(--folder-W);
          height: var(--folder-H);
          background: linear-gradient(135deg, #9333ea, #6b21a8);
          border-radius: 10px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
          transform-style: preserve-3d;
        }

        /* Inner Papers Stack (Symmetrical & Perfectly Aligned) */
        .folder-element .back-side::before,
        .folder-element .back-side::after {
          content: "";
          display: block;
          position: absolute;
          top: 4px;
          left: 8px;
          width: calc(var(--folder-W) - 16px);
          height: calc(var(--folder-H) - 10px);
          background-color: rgba(255, 255, 255, 0.7);
          border-radius: 6px;
          transform-origin: bottom center;
          transition: transform var(--transition) ease;
          z-index: 0;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .folder-element .back-side::after {
          background-color: rgba(255, 255, 255, 0.4);
          top: 2px;
          left: 12px;
          width: calc(var(--folder-W) - 24px);
        }

        .group:hover .folder-element .back-side::before,
        .folder-container:hover .back-side::before {
          transform: translateY(-6px) rotateX(-8deg);
        }

        .group:hover .folder-element .back-side::after,
        .folder-container:hover .back-side::after {
          transform: translateY(-12px) rotateX(-16deg);
        }

        /* Main Document Paper (Slides Up Centered) */
        .folder-element .paper {
          position: absolute;
          top: 6px;
          left: 10px;
          width: calc(var(--folder-W) - 20px);
          height: calc(var(--folder-H) - 12px);
          background: #ffffff;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
          transition: transform var(--transition) ease;
          z-index: 1;
        }

        .group:hover .folder-element .paper,
        .folder-container:hover .paper {
          transform: translateY(-14px);
        }

        /* Front Flap (Opens Forward Centered) */
        .folder-element .front-side {
          position: absolute;
          top: 0;
          left: 0;
          width: var(--folder-W);
          height: var(--folder-H);
          transform-origin: bottom center;
          transition: transform var(--transition) ease;
          z-index: 2;
        }

        .group:hover .folder-element .front-side,
        .folder-container:hover .front-side {
          transform: rotateX(-36deg);
        }

        .folder-element .tip {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          width: 65px;
          height: 14px;
          border-radius: 8px 8px 0 0;
          position: absolute;
          top: -8px;
          left: 0;
          z-index: 2;
        }

        .folder-element .cover {
          background: linear-gradient(135deg, #c084fc, #9333ea);
          width: var(--folder-W);
          height: var(--folder-H);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          position: relative;
          z-index: 3;
        }

        .custom-file-upload-btn {
          font-size: 0.9em;
          font-weight: 700;
          color: #ffffff;
          text-align: center;
          background: rgba(255, 255, 255, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          display: inline-block;
          width: 100%;
          padding: 8px 20px;
          position: relative;
          backdrop-filter: blur(4px);
        }

        /* Spinner Loader (From Uiverse.io by Fernando-sv) */
        .loader {
          border-width: 3px;
          border-style: solid;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin89345 0.9s linear infinite;
        }

        @keyframes spin89345 {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="w-full h-[380px] min-h-[380px] max-h-[380px] font-sans">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFormats.join(",")}
          className="hidden"
          id="refinex-file-input"
        />

        {/* STATE 1: DRAG & DROP ZONE (NO FILE SELECTED YET) */}
        {!selectedFile && !uploading ? (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            className={`relative group cursor-pointer w-full h-[380px] min-h-[380px] max-h-[380px] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 border-2 border-dashed outline-none overflow-hidden ${
              isDragging
                ? "border-purple-600 bg-purple-500/10 ring-4 ring-purple-500/20 shadow-xl"
                : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-md dark:shadow-black/40 hover:border-slate-400 dark:hover:border-zinc-700"
            }`}
          >
            {/* Stable 3D Folder Container */}
            <div className="mb-3 select-none my-2 pointer-events-none">
              <div className="folder-container">
                <div className="folder-element">
                  <div className="back-side" />
                  <div className="paper" />
                  <div className="front-side">
                    <div className="tip" />
                    <div className="cover" />
                  </div>
                </div>
                <span className="custom-file-upload-btn select-none">
                  Browse File
                </span>
              </div>
            </div>

            {/* Headline */}
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight mt-2 mb-1">
              {isDragging ? "Drop Dataset Here to Begin" : "Drag & Drop Dataset"}
            </h3>

            {/* Size limit subtext */}
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-3">
              Up to <strong className="text-purple-600 dark:text-purple-400 font-bold">{maxSizeMB}MB</strong>
            </p>

            {/* Accepted Formats Badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
              {acceptedFormats.map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700/80"
                >
                  {fmt.replace(".", "")}
                </span>
              ))}
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 max-w-md shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        ) : (
          /* STATE 2 & 3: SELECTED FILE / UPLOADING / COMPLETED CARD */
          <div className="w-full h-[380px] min-h-[380px] max-h-[380px] bg-white dark:bg-[#212121] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-slate-100/50 dark:shadow-none transition-all duration-300 relative overflow-hidden">
            
            {/* FILE DETAILS SECTION (Left Folder / File Icon + Right Dataset Name & Size) */}
            <div className="flex items-center gap-6 my-auto">
              {/* Left Side: 3D Folder Representation */}
              <div className="select-none shrink-0 scale-75 sm:scale-85 origin-left">
                <div className="folder-container">
                  <div className="folder-element">
                    <div className="back-side" />
                    <div className="paper" />
                    <div className="front-side">
                      <div className="tip" />
                      <div className="cover" />
                    </div>
                  </div>
                  <span className="custom-file-upload-btn uppercase tracking-wider text-[11px] font-extrabold">
                    {fileDetails?.label || "FILE"}
                  </span>
                </div>
              </div>

              {/* Right Side: File Name & Size */}
              <div className="min-w-0 flex-1">
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                  {selectedFile?.name || "Dataset"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium mt-1">
                  {formatBytes(fileSize)}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS (70% UPLOAD / 30% CANCEL - MINIMAL PILL SHAPE) */}
            {selectedFile && !uploading && !isCompleted && !isFailed && (
              <div className="w-full mt-auto pt-6 border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  className="w-[70%] py-3 px-5 text-xs sm:text-sm font-bold rounded-full bg-[#673ab7] hover:bg-[#522e93] text-white transition-all duration-300 ease-in-out cursor-pointer text-center whitespace-nowrap select-none active:scale-95 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Dataset</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="group w-[30%] py-3 px-4 text-xs sm:text-sm font-bold rounded-full bg-transparent text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500 dark:hover:border-rose-400 focus:text-rose-500 focus:border-rose-500 transition-all duration-300 ease-in-out cursor-pointer text-center whitespace-nowrap select-none active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4 text-slate-500 dark:text-zinc-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-300" />
                  <span>Cancel</span>
                </button>
              </div>
            )}

            {/* UPLOADING STATE (UIVERSE SPINNER & PROGRESS BAR) */}
            {uploading && (
              <div className="bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4 my-auto">
                {/* Progress Header with Spinner */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Uiverse Spinner (Black in Light mode, White in Dark mode) */}
                    <div className="loader border-slate-900/20 border-l-slate-900 dark:border-white/20 dark:border-l-white shrink-0" />
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {getStageMessage()}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                        Uploading dataset payload...
                      </span>
                    </div>
                  </div>

                  <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white shrink-0">
                    {displayProgress}%
                  </span>
                </div>

                {/* Progress Track & Bar (Black in Light mode, White in Dark mode) */}
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden relative">
                  <div
                    className="h-full bg-black dark:bg-white rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, displayProgress))}%` }}
                  />
                </div>
              </div>
            )}

            {/* SUCCESS BANNER */}
            {isCompleted && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-400 text-xs font-medium shadow-sm mt-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>
                    {successMsg || "Dataset uploaded and profiled successfully!"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 transition shrink-0 cursor-pointer"
                >
                  Upload Different File
                </button>
              </div>
            )}

            {/* ERROR BANNER */}
            {isFailed && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-red-600 dark:text-red-400 text-xs font-medium shadow-sm mt-4">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>
                    {errorMsg || validationError || "Failed to upload file. Please verify dataset structure."}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleConfirmUpload}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#673ab7] text-white hover:bg-[#522e93] transition cursor-pointer"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default FileUpload;