import React, { useState, useRef, useEffect } from "react";
import fileUploadImg from "../../assets/icons/file_upload.png";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Trash2,
  Sparkles,
  ArrowUpFromLine,
  Zap,
  Check,
  FileCheck2
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

  const validateAndProcessFile = (file) => {
    if (!file) return;
    setValidationError("");

    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    const isValidFormat = acceptedFormats.some(
      (fmt) => fmt.toLowerCase() === fileExt
    );

    if (!isValidFormat) {
      setValidationError(
        `Unsupported file format (${fileExt}). Please upload ${acceptedFormats.join(", ")}.`
      );
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setValidationError(
        `File size (${formatBytes(file.size)}) exceeds maximum limit of ${maxSizeMB}MB.`
      );
      return;
    }

    setSelectedFile(file);
    setDisplayProgress(5);
    if (onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleCancelUpload = () => {
    if (onCancel) onCancel();
    handleClear();
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
  const currentLoadedBytes =
    loadedBytes > 0
      ? loadedBytes
      : Math.round((fileSize * displayProgress) / 100);

  return (
    <>
      {/* Embedded CSS Keyframes & Animations (Ensures single-file drag-and-drop usability) */}
      <style>{`
        @keyframes shimmerGlow {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-shimmer-glow {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.45) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmerGlow 1.6s infinite ease-in-out;
        }
      `}</style>

      <div className="w-full max-w-4xl mx-auto space-y-4 font-sans">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFormats.join(",")}
          className="hidden"
          id="refinex-file-input"
        />

        {/* DRAG & DROP ZONE */}
        {!selectedFile && !uploading ? (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`relative group cursor-pointer w-full min-h-[340px] rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 border-2 border-dashed outline-none overflow-hidden ${
              isDragging
                ? "border-[#673ab7] bg-[#673ab7]/10 dark:bg-[#673ab7]/15 ring-4 ring-[#673ab7]/20 shadow-xl"
                : "border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#121212]/60 hover:border-[#673ab7]/70 hover:bg-slate-100/60 dark:hover:bg-zinc-900/60"
            }`}
          >
            {/* Ambient Dynamic Background Blur ("Goo" Glow) */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#673ab7]/20 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
                isDragging ? "opacity-100 scale-125" : "opacity-0 group-hover:opacity-45"
              }`}
            />

            {/* Top Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-200/60 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 text-[11px] font-semibold border border-slate-300/40 dark:border-zinc-700/50 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#673ab7]" />
              <span>Fast Profiler</span>
            </div>

            {/* Upload Image Icon */}
            <div className="mb-5 relative flex items-center justify-center">
              <img
                src={fileUploadImg}
                alt="File Upload"
                className={`w-24 h-24 sm:w-28 sm:h-28 object-contain select-none transition-all duration-300 ${
                  isDragging ? "opacity-100 scale-105" : "opacity-85 group-hover:opacity-100"
                }`}
              />
            </div>

            {/* Title & Instructions */}
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              {isDragging ? "Drop dataset here to begin" : "Drag & Drop dataset file"}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
              Drag your file here or click to browse. Supports{" "}
              <span className="font-semibold text-slate-700 dark:text-zinc-200">
                CSV, Excel (.xlsx, .xls) & JSON
              </span>{" "}
              up to {maxSizeMB}MB.
            </p>

            {/* CTA Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-6 py-2.5 rounded-full bg-[#673ab7] hover:bg-[#522e93] active:bg-[#43237e] text-white text-xs font-bold shadow-lg shadow-[#673ab7]/25 hover:shadow-[#673ab7]/40 transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Browse Computer</span>
            </button>

            {/* Accepted Formats Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {acceptedFormats.map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-200/60 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 border border-slate-300/50 dark:border-zinc-700/50"
                >
                  {fmt.replace(".", "")}
                </span>
              ))}
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 max-w-md shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE FILE / UPLOADING / COMPLETED CARD */
          <div className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-lg shadow-slate-100/50 dark:shadow-none transition-all duration-300 space-y-5 relative overflow-hidden">
            {/* Top Header: File metadata + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shrink-0 shadow-inner">
                  {fileDetails?.icon}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[280px] sm:max-w-[380px]">
                      {selectedFile?.name || "Dataset"}
                    </h4>
                    {fileDetails?.badgeBg && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${fileDetails.badgeBg}`}
                      >
                        {fileDetails.label}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                    <span>{formatBytes(fileSize)}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">
                      {uploading
                        ? `Uploading (${displayProgress}%)`
                        : isCompleted
                        ? "Uploaded & Profiled"
                        : isFailed
                        ? "Upload Failed"
                        : "Ready"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {uploading && (
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors duration-150 flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-zinc-800"
                    title="Cancel upload"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}

                {isCompleted && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload Different File</span>
                  </button>
                )}

                {isFailed && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => validateAndProcessFile(selectedFile)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#673ab7] text-white hover:bg-[#522e93] transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* REAL-TIME PROGRESS BAR SECTION */}
            {uploading && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#673ab7] dark:text-purple-400 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#673ab7] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#673ab7]"></span>
                    </span>
                    <span>{getStageMessage()}</span>
                  </span>
                  <span className="text-[#673ab7] dark:text-purple-300 font-extrabold text-sm tracking-tight">
                    {displayProgress}%
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-hidden relative p-0.5 shadow-inner">
                  {/* Glowing Active Fill Bar */}
                  <div
                    className="h-full bg-gradient-to-r from-[#673ab7] via-[#8e24aa] to-[#ab47bc] rounded-full transition-all duration-200 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min(100, Math.max(3, displayProgress))}%` }}
                  >
                    {/* Animated Shimmer Line */}
                    <div className="animate-shimmer-glow" />
                  </div>
                </div>

                {/* Transfer Metrics Footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5 font-medium">
                  <div className="flex items-center gap-3">
                    <span>
                      <strong className="text-slate-700 dark:text-zinc-200 font-semibold">
                        {formatBytes(currentLoadedBytes)}
                      </strong>{" "}
                      / {formatBytes(fileSize)}
                    </span>
                    {uploadSpeed > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-[#673ab7] dark:text-purple-300 font-bold flex items-center gap-1 border border-purple-500/20">
                        <Zap className="w-3 h-3 text-[#673ab7]" />
                        {formatBytes(uploadSpeed)}/s
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5" /> Real-time Stream
                  </span>
                </div>
              </div>
            )}

            {/* SUCCESS BANNER */}
            {isCompleted && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-400 text-xs font-medium shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>
                    {successMsg || "Dataset uploaded and profiled successfully!"}
                  </span>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 shrink-0">
                  <Check className="w-3 h-3" /> Ready
                </span>
              </div>
            )}

            {/* ERROR BANNER */}
            {isFailed && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-600 dark:text-red-400 text-xs font-medium shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span>
                  {errorMsg || validationError || "Failed to upload file. Please verify dataset structure."}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default FileUpload;