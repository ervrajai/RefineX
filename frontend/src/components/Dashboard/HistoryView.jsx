import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  TrendingUp,
  Info,
  Calendar,
  AlertCircle,
  Sparkles,
  BrainCircuit
} from "lucide-react";

export default function HistoryView({ 
  onLoadWorkspace, 
  onRestoreRedirect, 
  onTrainModelRedirect,
  onLoadTrainingWorkspace
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedJobId, setExpandedJobId] = useState(null);

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
      setError("Failed to load dataset preview for restoration. The file might have been deleted.");
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

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) + " " + date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl animate-fade-in">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
          <div className="h-6 w-48 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />
            <div className="h-12 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />
            <div className="h-12 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-zinc-100 max-w-4xl animate-fade-in font-sans">
      
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Execution & Audit History
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Browse and download previously cleaned datasets, quality score records, and cleaning logs.
          </p>
        </div>
        <button 
          onClick={fetchHistory}
          className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition duration-150 cursor-pointer self-start sm:self-center"
        >
          Refresh Log
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-semibold text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" /> {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-[#121212]/20">
          <Info className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-black dark:text-white">No execution records found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto mt-2 leading-relaxed">
            You haven't run any cleaning operations yet. Upload a dataset inside the Clean tab to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((job) => {
            const isExpanded = expandedJobId === job.id;
            const isML = job.type === "training";

            if (isML) {
              const bestScore = job.best_model_score || 0;
              const hasMetrics = job.evaluation_metrics && Object.keys(job.evaluation_metrics).length > 0;
              const metricKey = hasMetrics ? (Object.values(job.evaluation_metrics)[0].metrics.r2 !== undefined ? "R²" : "Accuracy") : "Score";

              return (
                <div 
                  key={`ml-${job.id}`} 
                  className="rounded-2xl border border-primary/20 dark:border-primary/25 bg-white dark:bg-[#121212] shadow-sm overflow-hidden transition-all duration-300"
                >
                  
                  {/* Job Summary Row */}
                  <div 
                    onClick={() => toggleExpand(job.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition duration-150"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/15 mt-0.5 animate-pulse">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-black dark:text-white tracking-tight">{job.dataset_name}</h3>
                          <span className="px-2 py-0.5 rounded bg-primary/15 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-wider">
                            ML Model
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] font-bold text-slate-400 dark:text-zinc-550">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(job.created_at)}</span>
                          <span>• Target (Y): <strong className="text-slate-600 dark:text-zinc-300 font-extrabold">{job.target_column}</strong></span>
                          <span>• Job ID: #{job.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score comparison & Expand button */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[8.5px] uppercase font-bold text-slate-450 block">Best Model ({job.best_model_name?.replace('_', ' ') || "N/A"})</span>
                          <strong className="text-xs font-black text-emerald-500 block mt-0.5">{metricKey}: {(bestScore * 100).toFixed(2)}%</strong>
                        </div>
                        <span className="p-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <button className="text-slate-400 dark:text-zinc-500 p-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-[#fafafa] dark:bg-zinc-900 cursor-pointer">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>

                  {/* Expanded Details panel */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-950/10 space-y-4 animate-fade-in">
                      
                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                          <span className="text-[9px] uppercase font-bold text-slate-450 block">Champion Model</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1 block capitalize">
                            {job.best_model_name?.replace('_', ' ') || "N/A"}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                          <span className="text-[9px] uppercase font-bold text-slate-450 block">Best Performance</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1 block">
                            {(bestScore * 100).toFixed(2)}% ({metricKey})
                          </span>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                          <span className="text-[9px] uppercase font-bold text-slate-450 block">Target Column</span>
                          <span className="text-xs font-bold text-slate-850 dark:text-zinc-250 mt-1 block">
                            {job.target_column}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                          <span className="text-[9px] uppercase font-bold text-slate-450 block">Train Duration</span>
                          <span className="text-xs font-bold text-slate-850 dark:text-zinc-250 mt-1 block">
                            {job.training_duration?.toFixed(3)}s
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80 items-center">
                        <button 
                          onClick={() => handleDownloadML(job.id, "model")}
                          className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg bg-primary text-white hover:bg-primary-dark transition duration-150 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Download joblib Model
                        </button>
                        <button 
                          onClick={() => handleDownloadML(job.id, "predictions")}
                          className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 transition duration-150 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Predictions CSV
                        </button>
                        <button 
                          onClick={() => handleDownloadML(job.id, "report")}
                          className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 transition duration-150 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF Summary Report
                        </button>

                        <div className="flex items-center gap-2 ml-auto">
                          <button 
                            onClick={() => handleRestoreMLJob(job)}
                            disabled={restoreLoading}
                            className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-650 text-white hover:from-violet-700 hover:to-indigo-750 transition duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" /> {restoreLoading ? "Loading Workspace..." : "Setup Training Workspace"}
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            }

            // Otherwise, render Data Cleaning Job layout
            const beforeScore = job.before_stats?.quality_score || 0;
            const afterScore = job.after_stats?.quality_score || 0;
            
            return (
              <div 
                key={`clean-${job.id}`} 
                className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm overflow-hidden transition-all duration-300"
              >
                
                {/* Job Summary Row */}
                <div 
                  onClick={() => toggleExpand(job.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition duration-150"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/15 mt-0.5">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black dark:text-white tracking-tight">{job.dataset_name}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] font-bold text-slate-400 dark:text-zinc-550">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(job.cleaned_at)}</span>
                        <span>• Job ID: #{job.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Score comparison & Expand button */}
                  <div className="flex items-center gap-6">
                    
                    {/* Score badge */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Quality Score</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] line-through text-slate-400">{beforeScore}</span>
                          <span className="text-xs font-black text-emerald-500">{afterScore}</span>
                        </div>
                      </div>
                      <span className="p-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Expand icon */}
                    <button className="text-slate-400 dark:text-zinc-500 p-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-[#fafafa] dark:bg-zinc-900 cursor-pointer">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                  </div>

                </div>

                {/* Expanded Details panel */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-950/10 space-y-4 animate-fade-in">
                    
                    {/* Stats comparison grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      
                      <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <span className="text-[9px] uppercase font-bold text-slate-455 block">Rows Change</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1 block">
                          {job.before_stats?.rows} → {job.after_stats?.rows}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <span className="text-[9px] uppercase font-bold text-slate-455 block">Columns Change</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1 block">
                          {job.before_stats?.columns} → {job.after_stats?.columns}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <span className="text-[9px] uppercase font-bold text-slate-455 block">Missing Cells</span>
                        <span className="text-xs font-bold text-slate-850 dark:text-zinc-250 mt-1 block">
                          {job.before_stats?.missing_summary?.total_missing} → {job.after_stats?.missing_summary?.total_missing}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <span className="text-[9px] uppercase font-bold text-slate-455 block">Duplicate Rows</span>
                        <span className="text-xs font-bold text-slate-850 dark:text-zinc-250 mt-1 block">
                          {job.before_stats?.duplicate_summary?.duplicate_rows_count} → {job.after_stats?.duplicate_summary?.duplicate_rows_count}
                        </span>
                      </div>

                    </div>

                    {/* Actions and Restore */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80 items-center">
                      <button 
                        onClick={() => handleDownload(job.dataset_id, "csv")}
                        className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg bg-primary text-white hover:bg-primary-dark transition duration-150 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> CSV
                      </button>
                      <button 
                        onClick={() => handleDownload(job.dataset_id, "excel")}
                        className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 transition duration-150 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Excel
                      </button>
                      <button 
                        onClick={() => handleDownload(job.dataset_id, "report")}
                        className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 transition duration-150 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF Audit Report
                      </button>
                      <button 
                        onClick={() => handleDownload(job.dataset_id, "log")}
                        className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 transition duration-150 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Operations Log
                      </button>

                      {onLoadWorkspace && (
                        <div className="flex items-center gap-2 ml-auto">
                          <button 
                            onClick={() => handleTrainModel(job)}
                            disabled={restoreLoading}
                            className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg bg-primary hover:bg-primary-dark text-white transition duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" /> Train ML Model
                          </button>
                          <button 
                            onClick={() => handleRestore(job)}
                            disabled={restoreLoading}
                            className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-650 text-white hover:from-violet-700 hover:to-indigo-750 transition duration-150 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> {restoreLoading ? "Restoring..." : "Restore to Clean Workspace"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* logs */}
                    {job.logs && job.logs.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Actions Logs</span>
                        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono text-[9px] text-slate-600 dark:text-zinc-350 space-y-1 max-h-36 overflow-y-auto">
                          {job.logs.map((log, lidx) => (
                            <div key={lidx} className="flex items-start gap-1">
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
