import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { MdHistory } from "react-icons/md"; // Upgraded history icon
import {
  Download,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  TrendingUp,
  Info,
  Calendar,
  AlertCircle,
  Sparkles,
  BrainCircuit,
  LineChart,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function HistoryView({ 
  onLoadWorkspace, 
  onRestoreRedirect, 
  onTrainModelRedirect,
  onLoadTrainingWorkspace,
  onLoadVisualizationWorkspace
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingItem, setDeletingItem] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("history/");
      setHistory(res.data);
    } catch (err) {
      setError("Failed to retrieve execution records. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    setError("");
    try {
      await api.delete("history/");
      setHistory([]);
      setShowClearModal(false);
    } catch (err) {
      console.error("Clear history error:", err);
      setShowClearModal(false); // Close pop-up modal so user can see error banner!
      setError(err.response?.data?.detail || "Failed to clear history records and local media files. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteSingleItem = async () => {
    if (!itemToDelete) return;
    setDeletingItem(true);
    setError("");
    try {
      await api.delete(`history/${itemToDelete.id}/?type=${itemToDelete.type}`);
      setHistory(prev => prev.filter(item => !(item.id === itemToDelete.id && item.type === itemToDelete.type)));
      setItemToDelete(null);
    } catch (err) {
      console.error("Delete single history item error:", err);
      setItemToDelete(null); // Close pop-up modal so user can see error banner!
      setError(err.response?.data?.detail || "Failed to delete history record and media files. Please try again.");
    } finally {
      setDeletingItem(false);
    }
  };

  const handleDownload = (datasetId, type) => {
    const url = `http://localhost:8000/api/cleaning/${datasetId}/download/?type=${type}`;
    window.open(url, "_blank");
  };

  const handleDownloadML = (jobId, type) => {
    const url = `http://localhost:8000/api/model-training/jobs/${jobId}/download/?type=${type}`;
    window.open(url, "_blank");
  };

  const handleRestoreMLJob = async (job) => {
    setRestoreLoading(true);
    setError("");
    try {
      const res = await api.get(`cleaning/${job.dataset_id}/preview/?offset=0&limit=100`);
      const data = res.data;
      if (onLoadWorkspace) {
        onLoadWorkspace(
          job.dataset_id,
          data.metadata,
          null,
          null,
          [],
          data
        );
      }
      if (onLoadTrainingWorkspace) {
        onLoadTrainingWorkspace(job);
      }
    } catch (err) {
      setError("Failed to load dataset details for restoration. The file might have been deleted.");
    } finally {
      setRestoreLoading(false);
    }
  };

  const toggleExpand = (jobId) => {
    setExpandedJobId(prev => (prev === jobId ? null : jobId));
  };

  const handleRestore = async (job) => {
    setRestoreLoading(true);
    setError("");
    try {
      const res = await api.get(`cleaning/${job.dataset_id}/preview/?offset=0&limit=100`);
      const data = res.data;
      if (onLoadWorkspace) {
        onLoadWorkspace(
          job.dataset_id,
          data.metadata,
          job.before_stats,
          job.after_stats,
          job.logs,
          data
        );
      }
      if (onRestoreRedirect) {
        onRestoreRedirect();
      }
    } catch (err) {
      setError("Failed to load dataset details for restoration. The file might have been deleted.");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleTrainModel = async (job) => {
    setRestoreLoading(true);
    setError("");
    try {
      const res = await api.get(`cleaning/${job.dataset_id}/preview/?offset=0&limit=100`);
      const data = res.data;
      if (onLoadWorkspace) {
        onLoadWorkspace(
          job.dataset_id,
          data.metadata,
          job.before_stats,
          job.after_stats,
          job.logs,
          data
        );
      }
      if (onTrainModelRedirect) {
        onTrainModelRedirect();
      }
    } catch (err) {
      setError("Failed to load dataset for model training. The file might have been deleted.");
    } finally {
      setRestoreLoading(false);
    }
  };
  
  const handleRestoreVisualization = async (job) => {
    setRestoreLoading(true);
    setError("");
    try {
      let previewData = job.preview_data;
      let metaData = null;
      if (job.dataset_id) {
        const res = await api.get(`cleaning/${job.dataset_id}/preview/?offset=0&limit=100`);
        previewData = res.data;
        metaData = res.data.metadata;
      }
      
      if (onLoadWorkspace) {
        onLoadWorkspace(
          job.dataset_id,
          metaData,
          null,
          null,
          [],
          previewData
        );
      }
      
      if (onLoadVisualizationWorkspace) {
        onLoadVisualizationWorkspace(job);
      }
    } catch (err) {
      setError("Failed to restore chart. The dataset file might have been deleted.");
    } finally {
      setRestoreLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Just now";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return "Recently";
      }
      return date.toLocaleDateString("en-US", { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) + " • " + date.toLocaleTimeString("en-US", { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "Recently";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
          <div className="h-7 w-56 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />
            <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />
            <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-zinc-100 max-w-4xl mx-auto animate-fade-in font-sans pb-10">
      
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-3">
            <MdHistory className="w-7 h-7 text-primary" /> Execution & Audit History
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
            Browse and download previously cleaned datasets, quality score records, and cleaning logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-center shrink-0">
          <button 
            onClick={fetchHistory}
            className="px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition duration-150 cursor-pointer text-center shadow-sm"
          >
            Refresh Log
          </button>

          <button 
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-500/20 dark:hover:bg-rose-600 dark:text-rose-300 dark:hover:text-white border border-rose-500/30 dark:border-rose-500/40 transition duration-150 cursor-pointer text-center shadow-sm whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        </div>
      </div>

      {/* Clear History Confirmation Modal (No glow effect) */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 shadow-lg flex flex-col gap-5">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Clear All History?</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
              Are you sure you want to clear your history? <strong className="text-rose-500 font-bold">This action cannot be restored.</strong> All execution logs, dataset records, cleaned CSV files, and media files will be permanently deleted from your local PC storage and database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={clearing}
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={clearing}
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {clearing ? (
                  <span className="animate-pulse">Clearing Files...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Clear All History
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single History Item Deletion Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 shadow-lg flex flex-col gap-5">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete History Record?</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{itemToDelete.name}</strong>? <strong className="text-rose-500 font-bold">This action cannot be restored.</strong> The associated dataset, cleaned CSV files, and media will be permanently deleted from your local storage and database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={deletingItem}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={deletingItem}
                onClick={handleDeleteSingleItem}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {deletingItem ? (
                  <span className="animate-pulse">Deleting File...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-sm font-semibold text-rose-600 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl bg-slate-50/50 dark:bg-[#121212]/20">
          <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-base font-bold text-black dark:text-white">No execution records found</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-2 leading-relaxed">
            You haven't run any cleaning operations yet. Upload a dataset inside the Clean tab to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {history.map((job) => {
            const isExpanded = expandedJobId === job.id;
            const isML = job.type === "training";

            if (job.type === "visualization") {
              return (
                <div 
                  key={`vis-${job.id}`} 
                  className="rounded-2xl border border-violet-500/20 dark:border-violet-500/25 bg-white dark:bg-[#121212] shadow-sm overflow-hidden transition-all duration-300"
                >
                  <div 
                    onClick={() => toggleExpand(job.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition duration-150"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/15 mt-1">
                        <LineChart className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-black text-black dark:text-white tracking-tight">{job.name}</h3>
                          <span className="px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-wider">
                            {job.graph_type} ({job.library})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(job.created_at)}</span>
                          <span>• Dataset: <strong className="text-slate-700 dark:text-zinc-200 font-extrabold">{job.dataset_name}</strong></span>
                          <span>• Download Count: {job.download_count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete({ id: job.id, type: job.type, name: job.name || job.dataset_name || "Visualization Chart" });
                        }}
                        className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white cursor-pointer transition flex items-center gap-1.5 text-xs font-bold px-2.5"
                        title="Delete this history record"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                      <button className="text-slate-500 dark:text-zinc-400 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 transition">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 flex flex-col md:flex-row gap-6 animate-fade-in">
                      {job.preview_data && (
                        <div className="w-full md:w-1/3 bg-slate-100 dark:bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-200 dark:border-zinc-700 max-h-40">
                          <img src={job.preview_data} alt={job.name} className="max-h-full max-w-full object-contain rounded" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="text-xs text-slate-600 dark:text-zinc-350 space-y-2">
                          <p><span className="font-bold text-slate-700 dark:text-zinc-300">Chart Name:</span> {job.name}</p>
                          <p><span className="font-bold text-slate-700 dark:text-zinc-300">Target Library:</span> {job.library}</p>
                          <p><span className="font-bold text-slate-700 dark:text-zinc-300">Columns Plotted:</span> X: {job.config.x_column || "N/A"}, Y: {job.config.y_column || "N/A"}</p>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800 items-center justify-end">
                          <button 
                            onClick={() => handleRestoreVisualization(job)}
                            className="px-5 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 transition duration-150 flex justify-center items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <LineChart className="w-4 h-4" /> Open in Studio
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (isML) {
              const bestScore = job.best_model_score || 0;
              const hasMetrics = job.evaluation_metrics && Object.keys(job.evaluation_metrics).length > 0;
              const metricKey = hasMetrics ? (Object.values(job.evaluation_metrics)[0].metrics.r2 !== undefined ? "R²" : "Accuracy") : "Score";

              return (
                <div 
                  key={`ml-${job.id}`} 
                  className="rounded-2xl border border-primary/20 dark:border-primary/25 bg-white dark:bg-[#121212] shadow-sm overflow-hidden transition-all duration-300"
                >
                  
                  {/* ML Job Summary Row */}
                  <div 
                    onClick={() => toggleExpand(job.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition duration-150"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/15 mt-1 animate-pulse">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-black text-black dark:text-white tracking-tight">{job.dataset_name}</h3>
                          <span className="px-2.5 py-1 rounded-md bg-primary/15 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
                            ML Model
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(job.created_at)}</span>
                          <span>• Target (Y): <strong className="text-slate-700 dark:text-zinc-200 font-extrabold">{job.target_column}</strong></span>
                          <span>• Job ID: #{job.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score & Expand */}
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Best Model ({job.best_model_name?.replace('_', ' ') || "N/A"})</span>
                          <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">{metricKey}: {(bestScore * 100).toFixed(2)}%</strong>
                        </div>
                        <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <TrendingUp className="w-4 h-4" />
                        </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete({ id: job.id, type: job.type, name: job.dataset_name || "ML Training Job" });
                        }}
                        className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white cursor-pointer transition flex items-center gap-1.5 text-xs font-bold px-2.5"
                        title="Delete this history record"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                      <button className="text-slate-500 dark:text-zinc-400 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 transition">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                  </div>

                  {/* ML Expanded Details */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 space-y-5 animate-fade-in">
                      
                      {/* Stats Grid - Highlighted */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Champion Model</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block capitalize truncate">
                            {job.best_model_name?.replace('_', ' ') || "N/A"}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Evaluation Score</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 block">
                            {(bestScore * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Training Duration</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                            {job.training_duration ? `${job.training_duration.toFixed(2)}s` : "N/A"}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Pipeline Status</span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 block uppercase">
                            ✓ {job.status || "Completed"}
                          </span>
                        </div>
                      </div>

                      {/* Actions and Downloads */}
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800 items-center justify-between">
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                          <button 
                            onClick={() => handleDownloadML(job.id, "model")}
                            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition duration-150 flex justify-center items-center gap-2 cursor-pointer bg-white dark:bg-[#121212]"
                          >
                            <Download className="w-4 h-4 text-amber-500" /> PKL Model File
                          </button>
                          <button 
                            onClick={() => handleDownloadML(job.id, "predictions")}
                            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition duration-150 flex justify-center items-center gap-2 cursor-pointer bg-white dark:bg-[#121212]"
                          >
                            <Download className="w-4 h-4" /> Predictions CSV
                          </button>
                          <button 
                            onClick={() => handleDownloadML(job.id, "report")}
                            className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition duration-150 flex justify-center items-center gap-2 cursor-pointer bg-white dark:bg-[#121212]"
                          >
                            <Download className="w-4 h-4" /> PDF Report
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => handleRestoreMLJob(job)}
                          disabled={restoreLoading}
                          className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 transition duration-150 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          <BrainCircuit className="w-4 h-4" /> {restoreLoading ? "Loading..." : "Setup Training Workspace"}
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              );
            }

            // Data Cleaning Job layout
            const beforeScore = job.before_stats?.quality_score || 0;
            const afterScore = job.after_stats?.quality_score || 0;
            
            return (
              <div 
                key={`clean-${job.id}`} 
                className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm overflow-hidden transition-all duration-300"
              >
                
                {/* Data Cleaning Summary Row */}
                <div 
                  onClick={() => toggleExpand(job.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition duration-150"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/15 mt-1">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-black dark:text-white tracking-tight">{job.dataset_name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(job.created_at || job.cleaned_at)}</span>
                        <span>• Job ID: #{job.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Score & Expand */}
                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Score</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs line-through text-slate-400">{beforeScore}</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{afterScore}</span>
                        </div>
                      </div>
                      <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                      </span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete({ id: job.id, type: job.type, name: job.dataset_name || "Cleaning Record" });
                      }}
                      className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white cursor-pointer transition flex items-center gap-1.5 text-xs font-bold px-2.5"
                      title="Delete this history record"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>

                    <button className="text-slate-500 dark:text-zinc-400 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 transition">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                </div>

                {/* Expanded Details panel */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 space-y-5 animate-fade-in">
                    
                    {/* Stats comparison grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Rows Change</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                          {job.before_stats?.rows} <span className="text-slate-400">→</span> {job.after_stats?.rows}
                        </span>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Columns Change</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                          {job.before_stats?.columns} <span className="text-slate-400">→</span> {job.after_stats?.columns}
                        </span>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Missing Cells</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                          {job.before_stats?.missing_summary?.total_missing} <span className="text-slate-400">→</span> {job.after_stats?.missing_summary?.total_missing}
                        </span>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Duplicate Rows</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                          {job.before_stats?.duplicate_summary?.duplicate_rows_count} <span className="text-slate-400">→</span> {job.after_stats?.duplicate_summary?.duplicate_rows_count}
                        </span>
                      </div>
                    </div>

                    {/* Actions and Restore */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-zinc-800 items-center justify-between">
                      <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => handleDownload(job.dataset_id, "csv")}
                          className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-dark transition duration-150 flex justify-center items-center gap-2 cursor-pointer shadow-sm"
                        >
                          <Download className="w-4 h-4" /> CSV
                        </button>
                        <button 
                          onClick={() => handleDownload(job.dataset_id, "json")}
                          className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition duration-150 flex justify-center items-center gap-2 cursor-pointer bg-white dark:bg-[#121212]"
                        >
                          <Download className="w-4 h-4" /> JSON
                        </button>
                        <button 
                          onClick={() => handleDownload(job.dataset_id, "excel")}
                          className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition duration-150 flex justify-center items-center gap-2 cursor-pointer bg-white dark:bg-[#121212]"
                        >
                          <Download className="w-4 h-4" /> Excel
                        </button>
                        <button 
                          onClick={() => handleDownload(job.dataset_id, "report")}
                          className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition duration-150 flex justify-center items-center gap-2 cursor-pointer bg-white dark:bg-[#121212]"
                        >
                          <Download className="w-4 h-4" /> PDF Report
                        </button>
                      </div>

                      {onLoadWorkspace && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                          <button 
                            onClick={() => handleTrainModel(job)}
                            disabled={restoreLoading}
                            className="px-5 py-2.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary-dark text-white transition duration-150 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                          >
                            <BrainCircuit className="w-4 h-4" /> Train Model
                          </button>
                          <button 
                            onClick={() => handleRestore(job)}
                            disabled={restoreLoading}
                            className="px-5 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 transition duration-150 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                          >
                            <Sparkles className="w-4 h-4" /> {restoreLoading ? "Restoring..." : "Restore Workspace"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Logs Output */}
                    {job.logs && job.logs.length > 0 && (
                      <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <span className="text-[11px] uppercase font-bold text-slate-500 block">Actions Logs</span>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121212] font-mono text-xs text-slate-700 dark:text-zinc-300 space-y-1.5 max-h-48 overflow-y-auto shadow-inner">
                          {job.logs.map((log, lidx) => (
                            <div key={lidx} className="flex items-start gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-1 last:border-0 last:pb-0">
                              <span className="text-slate-400">›</span> 
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}