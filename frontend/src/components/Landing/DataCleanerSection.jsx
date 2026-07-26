import React, { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  Download, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  Layers, 
  FileText,
  ShieldCheck
} from "lucide-react";
import api from "../../services/api";
import { getGuestId } from "../../utils/guestSession";
import LimitModal from "./LimitModal";

function DataCleanerSection() {
  const [session, setSession] = useState({
    clean_count: 0,
    remaining_cleans: 3,
    limit_reached: false,
    datasets: []
  });
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanedResult, setCleanedResult] = useState(null);
  const [error, setError] = useState("");
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const fetchSession = async () => {
    const guestId = getGuestId();
    try {
      const res = await api.get("guest/session/", {
        params: { guest_id: guestId }
      });
      if (res.data) {
        setSession(res.data);
      }
    } catch (err) {
      console.error("Failed to load guest session:", err);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const validateAndSelectFile = (selectedFile) => {
    setError("");
    setCleanedResult(null);

    const ext = selectedFile.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setError("Unsupported format. Please upload a CSV or Excel file.");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("File size exceeds 25MB limit.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadAndClean = async () => {
    if (!file) return;

    if (session.limit_reached || session.remaining_cleans <= 0) {
      setIsLimitModalOpen(true);
      return;
    }

    setCleaning(true);
    setError("");
    const guestId = getGuestId();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("guest_id", guestId);

    try {
      const res = await api.post("guest/upload-and-clean/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setCleanedResult(res.data);
      setFile(null);
      fetchSession();
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.limit_reached) {
        setSession((prev) => ({ ...prev, limit_reached: true, remaining_cleans: 0 }));
        setIsLimitModalOpen(true);
      } else {
        const msg = err.response?.data?.error || err.response?.data?.message || "Data cleaning failed. Please try again.";
        setError(msg);
      }
    } finally {
      setCleaning(false);
    }
  };

  const triggerDownload = (url, filename) => {
    const fullUrl = url.startsWith("http") ? url : `${api.defaults.baseURL.replace(/\/api\/?$/, "")}${url}`;
    const link = document.createElement("a");
    link.href = fullUrl;
    link.setAttribute("download", filename || "cleaned_dataset.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left">
      <LimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 dark:bg-brand/20 border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Guest Tier</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Clean CSV Datasets Instantly
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            No signup required. Upload your dataset, let RefineX standardize & clean it in seconds.
          </p>
        </div>

        {/* Daily Clean Counter Pill */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl bg-lightElevated dark:bg-panel border border-lightBorder dark:border-borderDark shadow-sm">
          <Clock className="w-4 h-4 text-brand" />
          <div className="text-xs">
            <span className="text-slate-500 dark:text-zinc-400 block font-medium">Daily Guest Limit</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {session.remaining_cleans} of 3 cleans remaining
            </span>
          </div>
        </div>
      </div>

      {/* Main Cleaner Card */}
      <div className="bg-lightElevated dark:bg-panel border border-lightBorder dark:border-borderDark rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">

        {/* Dropzone Area */}
        {!cleanedResult && (
          <div>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                dragActive
                  ? "border-brand bg-brand/5 dark:bg-brand/10 scale-[1.01]"
                  : "border-lightBorder dark:border-borderDark bg-lightBg dark:bg-darkBg/60 hover:border-brand/50 dark:hover:border-brand/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand mb-4 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>

              {file ? (
                <div className="flex items-center gap-3 bg-white dark:bg-panel p-3 px-5 rounded-xl border border-brand/30 shadow-sm mb-2">
                  <FileSpreadsheet className="w-6 h-6 text-brand" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                    Click to upload or drag & drop CSV or Excel file
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    Supports .CSV, .XLSX, .XLS (Max 25MB)
                  </p>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Upload Action Button */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>20-Step Automated Pipeline applied automatically</span>
              </div>

              <button
                type="button"
                disabled={!file || cleaning || session.limit_reached}
                onClick={handleUploadAndClean}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand hover:bg-brandDark text-white font-semibold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cleaning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Cleaning Dataset...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Clean & Download Free</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Cleaned Result View */}
        {cleanedResult && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between pb-6 border-b border-lightBorder dark:border-borderDark mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Dataset Cleaned Successfully!</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {cleanedResult.metadata?.name} ({cleanedResult.metadata?.rows} rows, {cleanedResult.metadata?.columns} columns)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCleanedResult(null)}
                className="px-4 py-2 border border-lightBorder dark:border-borderDark rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-lightHover dark:hover:bg-hover transition-colors cursor-pointer"
              >
                Clean Another File
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-lightBg dark:bg-darkBg p-4 rounded-xl border border-lightBorder/50 dark:border-borderDark/50">
                <span className="text-xs text-slate-400 dark:text-zinc-500 block mb-1">Rows Preserved</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{cleanedResult.metadata?.rows}</span>
              </div>
              <div className="bg-lightBg dark:bg-darkBg p-4 rounded-xl border border-lightBorder/50 dark:border-borderDark/50">
                <span className="text-xs text-slate-400 dark:text-zinc-500 block mb-1">Columns</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{cleanedResult.metadata?.columns}</span>
              </div>
              <div className="bg-lightBg dark:bg-darkBg p-4 rounded-xl border border-lightBorder/50 dark:border-borderDark/50">
                <span className="text-xs text-slate-400 dark:text-zinc-500 block mb-1">Encoding</span>
                <span className="text-xl font-bold text-brand uppercase">{cleanedResult.metadata?.encoding}</span>
              </div>
              <div className="bg-lightBg dark:bg-darkBg p-4 rounded-xl border border-lightBorder/50 dark:border-borderDark/50">
                <span className="text-xs text-slate-400 dark:text-zinc-500 block mb-1">Quality Score</span>
                <span className="text-xl font-bold text-emerald-500">
                  {cleanedResult.after_report?.quality_score || 95}/100
                </span>
              </div>
            </div>

            {/* Cleaning Logs Preview */}
            {cleanedResult.logs && cleanedResult.logs.length > 0 && (
              <div className="mb-6 bg-lightBg dark:bg-darkBg/80 p-4 rounded-xl border border-lightBorder/60 dark:border-borderDark/60 max-h-36 overflow-y-auto">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block mb-2">
                  Applied Transformations Log
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-zinc-400 font-mono">
                  {cleanedResult.logs.map((log, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-emerald-500">✓</span>
                      <span>{log.replace(/^✓\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA Download Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand/5 dark:bg-brand/10 p-5 rounded-2xl border border-brand/20">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Your cleaned dataset is ready!</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Download the standardized CSV file directly.</p>
              </div>

              <button
                type="button"
                onClick={() => triggerDownload(cleanedResult.download_url, `cleaned_${cleanedResult.metadata?.name || 'dataset.csv'}`)}
                className="w-full sm:w-auto px-6 py-3 bg-brand hover:bg-brandDark text-white font-semibold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Download Cleaned CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Returning Guest History (Within 24 Hours) */}
      {session.datasets && session.datasets.length > 0 && (
        <div className="mt-12 bg-lightElevated dark:bg-panel border border-lightBorder dark:border-borderDark rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Your Cleaned Datasets (Last 24 Hours)
              </h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-zinc-500">
              Available without using extra cleans
            </span>
          </div>

          <div className="space-y-3">
            {session.datasets.map((ds) => (
              <div
                key={ds.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-lightBg dark:bg-darkBg/60 border border-lightBorder/60 dark:border-borderDark/60 hover:border-brand/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{ds.name}</h4>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                      {ds.rows || 0} rows • {ds.columns || 0} columns • {new Date(ds.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerDownload(ds.download_url, `cleaned_${ds.name}`)}
                  className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand dark:text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default DataCleanerSection;
