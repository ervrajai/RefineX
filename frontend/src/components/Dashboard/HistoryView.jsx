import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { MdHistory } from "react-icons/md"; // Upgraded history icon
import {
  Download,
  BrushCleaning,
  Info,
  Calendar,
  AlertCircle,
  Sparkles,
  BrainCircuit,
  LineChart,
  Trash2,
  AlertTriangle,
  FileText,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X
} from "lucide-react";
import { BouncyAccordion } from "../ui/BouncyAccordion";
import AnimatedDownloadButton from "../ui/AnimatedDownloadButton";
import RestoreButton from "../ui/RestoreButton";
import RefreshButton from "../ui/RefreshButton";
import { AnimatedSelect } from "../ui/AnimatedSelect";
import { AnimatedCheckbox } from "../ui/AnimatedCheckbox";

// Mobile Download Dropdown Component
function MobileDownloadDropdown({ options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-white transition cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-44 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-zinc-700 shadow-xl p-1 z-50 animate-fade-in">
          <div className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-zinc-500 px-2.5 py-1.5 border-b border-slate-100 dark:border-zinc-800/60">
            Select Format
          </div>
          <div className="py-1 space-y-0.5">
            {options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  opt.onClick();
                  setIsOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-lg transition flex items-center justify-between cursor-pointer"
              >
                <span>{opt.label}</span>
                <Download className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Exact Delete Trash Button from Uiverse.io by philipo30 with animated lid
function DeleteButton({ onClick, title = "Delete item" }) {
  return (
    <button
      type="button"
      aria-label={title}
      onClick={onClick}
      title={title}
      className="group relative p-1 bg-transparent border-0 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
    >
      <svg
        className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.08] group-hover:rotate-3 group-active:scale-[0.96] group-active:-rotate-1 overflow-visible drop-shadow-xs"
        viewBox="0 -10 64 74"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="trash-can">
          <rect
            x="16"
            y="24"
            width="32"
            height="30"
            rx="3"
            ry="3"
            fill="#e74c3c"
          />
          <g
            id="lid-group"
            style={{ transformOrigin: "12px 18px" }}
            className="transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-[28deg] group-hover:translate-y-[2px] group-active:-rotate-[12deg] group-active:scale-[0.98]"
          >
            <rect
              x="12"
              y="12"
              width="40"
              height="6"
              rx="2"
              ry="2"
              fill="#c0392b"
            />
            <rect
              x="26"
              y="8"
              width="12"
              height="4"
              rx="2"
              ry="2"
              fill="#c0392b"
            />
          </g>
        </g>
      </svg>
    </button>
  );
}

export default function HistoryView({ 
  historyList = [],
  historyHasMore = false,
  historyLoading = false,
  historyLoadingMore = false,
  onFetchMoreHistory,
  onRefreshHistory,
  onLoadWorkspace, 
  onRestoreRedirect, 
  onTrainModelRedirect,
  onLoadTrainingWorkspace,
  onLoadVisualizationWorkspace
}) {
  const [history, setHistory] = useState(historyList);
  const [loading, setLoading] = useState(historyLoading);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [activeRestoringId, setActiveRestoringId] = useState(null);
  const [error, setError] = useState("");
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [openLogsJobId, setOpenLogsJobId] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [itemDetails, setItemDetails] = useState({});

  // Selection & Batch Delete States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [showConfirmDeleteSelectedModal, setShowConfirmDeleteSelectedModal] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);

  // Search, Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset to page 1 whenever search query or active filter changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedJobId(null);
    setOpenLogsJobId(null);
  }, [searchQuery, activeFilter]);

  // Reset expanded item and open logs when page changes, and scroll scroll container to top
  useEffect(() => {
    setExpandedJobId(null);
    setOpenLogsJobId(null);
    const container = document.getElementById("main-scroll-container");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  // Next page pagination handler (fetches more from backend if needed)
  const handleNextPage = async () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (historyHasMore && onFetchMoreHistory) {
      await onFetchMoreHistory();
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Compute filtered items
  const filteredHistory = history.filter((item) => {
    // 0. Exclude cancelled jobs
    if (item.status === "cancelled" || item.status === "canceled") return false;

    // 1. Category Filter
    if (activeFilter === "Cleaning") {
      if (item.type && item.type !== "clean" && item.type !== "cleaning") return false;
    } else if (activeFilter === "Model Training") {
      if (item.type !== "training") return false;
    } else if (activeFilter === "Visualization") {
      if (item.type !== "visualization") return false;
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const datasetName = (item.dataset_name || item.name || "").toLowerCase();
      const targetCol = (item.target_column || "").toLowerCase();
      const bestModel = (item.best_model_name || "").toLowerCase();
      const chartName = (item.name || "").toLowerCase();

      return (
        datasetName.includes(q) ||
        targetCol.includes(q) ||
        bestModel.includes(q) ||
        chartName.includes(q)
      );
    }

    return true;
  });

  // Compute pagination values
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Clamp page if currentPage exceeds totalPages (e.g. after deletion)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleRefreshHistory = async () => {
    setExpandedJobId(null);
    setOpenLogsJobId(null);
    if (onRefreshHistory) {
      await onRefreshHistory();
    }
  };

  useEffect(() => {
    if (historyList) {
      setHistory(historyList);
    }
  }, [historyList]);

  useEffect(() => {
    setLoading(historyLoading);
  }, [historyLoading]);

  // Infinite Scroll Event Listener
  useEffect(() => {
    const handleScroll = () => {
      if (historyLoadingMore || !historyHasMore) return;
      const container = document.getElementById("main-scroll-container");
      if (!container) return;

      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNearBottom && onFetchMoreHistory) {
        onFetchMoreHistory();
      }
    };

    const container = document.getElementById("main-scroll-container");
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [historyLoadingMore, historyHasMore, onFetchMoreHistory]);

  // Deferred Detail Fetching for a single history item
  const fetchItemDetail = async (item) => {
    if (!item || !item.id) return null;
    if (itemDetails[item.id]) return itemDetails[item.id];
    try {
      const res = await api.get(`history/${item.id}/`);
      setItemDetails((prev) => ({ ...prev, [item.id]: res.data }));
      return res.data;
    } catch (err) {
      console.error("Failed to fetch item detail:", err);
      return null;
    }
  };

  // Toggle Logs with Deferred Fetching
  const toggleLogs = async (jobId) => {
    if (openLogsJobId !== jobId) {
      await fetchItemDetail({ id: jobId });
    }
    setOpenLogsJobId((prev) => (prev === jobId ? null : jobId));
  };

  const getItemUniqueId = (item) => `${item.type || "clean"}-${item.id}`;

  const handleStartSelectionMode = () => {
    setIsSelectionMode(true);
    // Initially select ALL current/filtered items by default
    const targetList = filteredHistory.length > 0 ? filteredHistory : history;
    const allIds = new Set(targetList.map((item) => getItemUniqueId(item)));
    setSelectedItemIds(allIds);
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedItemIds(new Set());
  };

  const isAllFilteredSelected =
    filteredHistory.length > 0 &&
    filteredHistory.every((item) => selectedItemIds.has(getItemUniqueId(item)));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedItemIds(new Set());
    } else {
      const newSet = new Set(selectedItemIds);
      filteredHistory.forEach((item) => newSet.add(getItemUniqueId(item)));
      setSelectedItemIds(newSet);
    }
  };

  const handleToggleSelectItem = (e, item) => {
    if (e) e.stopPropagation();
    const id = getItemUniqueId(item);
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelectedItems = async () => {
    if (selectedItemIds.size === 0) return;
    setDeletingSelected(true);
    setError("");
    try {
      const selectedItems = history.filter((item) =>
        selectedItemIds.has(getItemUniqueId(item))
      );

      if (selectedItems.length >= history.length && history.length > 0) {
        await api.delete("history/");
        setHistory([]);
      } else {
        await Promise.all(
          selectedItems.map((item) =>
            api.delete(`history/${item.id}/?type=${item.type}`)
          )
        );
        setHistory((prev) =>
          prev.filter((item) => !selectedItemIds.has(getItemUniqueId(item)))
        );
      }

      setSelectedItemIds(new Set());
      setIsSelectionMode(false);
      setShowConfirmDeleteSelectedModal(false);

      if (onRefreshHistory) {
        await onRefreshHistory();
      }
    } catch (err) {
      console.error("Delete selected history items error:", err);
      setShowConfirmDeleteSelectedModal(false);
      setError(
        err.response?.data?.detail ||
          "Failed to delete selected history records. Please try again."
      );
    } finally {
      setDeletingSelected(false);
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
      setShowClearModal(false);
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
      setItemToDelete(null);
      setError(err.response?.data?.detail || "Failed to delete history record and media files. Please try again.");
    } finally {
      setDeletingItem(false);
    }
  };

  const handleDownload = async (datasetId, type) => {
    try {
      const res = await api.get(`cleaning/${datasetId}/download/?type=${type}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = type === "excel" ? "xlsx" : type === "json" ? "json" : type === "report" ? "pdf" : "csv";
      link.setAttribute("download", `cleaned_dataset.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download cleaning dataset error:", err);
    }
  };

  const handleDownloadML = async (jobId, type) => {
    try {
      const res = await api.get(`model-training/jobs/${jobId}/download/?type=${type}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = type === "model" ? "pkl" : type === "report" ? "pdf" : "csv";
      link.setAttribute("download", `model_record.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download ML model error:", err);
    }
  };

  const handleExportVisualization = async (job, format) => {
    try {
      const res = await api.post(
        "visualization/export/",
        {
          dataset_id: job.dataset_id,
          config: job.config,
          format: format,
        },
        { responseType: "blob" }
      );
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileExt = format === "html" ? "html" : format;
      link.setAttribute("download", `${job.name || "refinex_chart"}.${fileExt}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export visualization error:", err);
    }
  };

  const handleRestoreMLJob = async (job, itemId) => {
    if (itemId) setActiveRestoringId(itemId);
    setRestoreLoading(true);
    setError("");
    try {
      // Fetch full ML job details to include selected_features, feature_encodings, etc.
      const jobRes = await api.get(`model-training/jobs/${job.id}/`);
      const fullJob = jobRes.data;

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
        onLoadTrainingWorkspace(fullJob);
      }
    } catch (err) {
      setError("Failed to load dataset details for restoration. The file might have been deleted.");
    } finally {
      setRestoreLoading(false);
      setActiveRestoringId(null);
    }
  };

  const handleRestore = async (job, itemId) => {
    if (itemId) setActiveRestoringId(itemId);
    setRestoreLoading(true);
    setError("");
    try {
      const detail = await fetchItemDetail(job);
      const targetJob = detail || job;
      const targetDatasetId = targetJob.dataset_id || targetJob.id;

      // Fetch dataset profile report and preview
      const res = await api.get(`cleaning/${targetDatasetId}/analyze/`);
      const data = res.data;

      const profileReport = data.report || targetJob.after_stats || targetJob.before_stats;
      const beforeRep = targetJob.before_stats || profileReport;
      const afterRep = targetJob.after_stats || profileReport;
      const logs = targetJob.logs || [];

      if (onLoadWorkspace) {
        onLoadWorkspace(
          targetDatasetId,
          data.metadata,
          beforeRep,
          afterRep,
          logs,
          data.preview || data
        );
      }
      if (onRestoreRedirect) {
        onRestoreRedirect();
      }
    } catch (err) {
      console.error("Restore dataset error:", err);
      setError("Failed to load dataset details for restoration. The file might have been deleted.");
    } finally {
      setRestoreLoading(false);
      setActiveRestoringId(null);
    }
  };

  const handleRestoreVisualization = async (job, itemId) => {
    if (itemId) setActiveRestoringId(itemId);
    setRestoreLoading(true);
    setError("");
    try {
      let fullGraph = job;
      if (job.id) {
        try {
          const detailRes = await api.get(`history/${job.id}/?type=visualization`);
          fullGraph = detailRes.data || job;
        } catch (e) {
          fullGraph = job;
        }
      }

      let previewData = fullGraph.preview_data;
      let metaData = null;
      if (fullGraph.dataset_id) {
        const res = await api.get(`cleaning/${fullGraph.dataset_id}/preview/?offset=0&limit=100`);
        previewData = res.data;
        metaData = res.data?.metadata;
      }
      
      if (onLoadWorkspace) {
        onLoadWorkspace(
          fullGraph.dataset_id,
          metaData,
          null,
          null,
          [],
          previewData
        );
      }
      
      if (onLoadVisualizationWorkspace) {
        onLoadVisualizationWorkspace(fullGraph);
      }
    } catch (err) {
      console.error("Restore visualization error:", err);
      setError("Failed to restore chart. The dataset file might have been deleted.");
    } finally {
      setRestoreLoading(false);
      setActiveRestoringId(null);
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
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0 py-1 mb-6">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            History
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            Browse and download previously cleaned datasets, quality score records, and cleaning logs
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          <RefreshButton onClick={handleRefreshHistory} loading={loading} />

          {isSelectionMode ? (
            <button 
              type="button"
              onClick={handleExitSelectionMode}
              className="group flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/20 transition-all duration-300 ease-in-out cursor-pointer text-center shadow-xs whitespace-nowrap select-none active:scale-95"
            >
              <X className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Exit Selection</span>
            </button>
          ) : (
            <button 
              type="button"
              disabled={history.length === 0}
              onClick={handleStartSelectionMode}
              className="group flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full bg-transparent text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500 dark:hover:border-rose-400 focus:text-rose-500 focus:border-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 ease-in-out cursor-pointer text-center shadow-xs whitespace-nowrap select-none active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-300" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch Selection Toolbar Panel */}
      {isSelectionMode && (
        <div className="p-4 sm:p-4.5 rounded-3xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3.5 animate-fade-in my-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Select All Checkbox Button */}
            <div
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 transition cursor-pointer select-none text-xs font-bold text-slate-800 dark:text-zinc-100 shadow-xs active:scale-95"
            >
              <AnimatedCheckbox
                checked={isAllFilteredSelected}
                onChange={() => {}}
                size={18}
                color="#f59e0b"
                className="pointer-events-none"
              />
              <span>Select All</span>
            </div>

            {/* Selected Count Indicator */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-900/80 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Selected: <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{selectedItemIds.size}</strong> of {filteredHistory.length} items</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExitSelectionMode}
              className="px-4 py-2 text-xs font-bold rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer active:scale-95 shadow-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedItemIds.size === 0}
              onClick={() => setShowConfirmDeleteSelectedModal(true)}
              className="flex items-center gap-2 px-4.5 py-2 text-xs font-bold rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition cursor-pointer shadow-sm active:scale-95 select-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedItemIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar (Filter Left, Search Right) */}
      <div className="flex flex-col md:flex-row items-center gap-3 w-full my-4">
        {/* Left Side: Filter Control */}
        <div className="w-full md:w-7/12">
          {/* Desktop & Tablet: 4-Pill Segmented Switcher */}
          <div className="hidden md:grid grid-cols-4 p-1 rounded-full bg-[#e3e3e8] dark:bg-[#1c1c1e] border border-slate-200/60 dark:border-zinc-800/80 shadow-inner w-full">
            {[
              { id: "All", label: "All" },
              { id: "Cleaning", label: "Cleaning" },
              { id: "Model Training", label: "Model Training" },
              { id: "Visualization", label: "Visualization" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`py-1.5 px-2 text-xs rounded-full transition-all duration-200 cursor-pointer text-center whitespace-nowrap select-none ${
                  activeFilter === tab.id
                    ? "bg-white dark:bg-[#3a3a3c] text-[#1c1c1e] dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-zinc-700/60"
                    : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white font-semibold"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Screens: Pill Dropdown */}
          <div className="block md:hidden w-full">
            <AnimatedSelect
              value={activeFilter}
              onChange={(val) => setActiveFilter(val)}
              options={[
                { value: "All", label: "All Categories" },
                { value: "Cleaning", label: "Cleaning" },
                { value: "Model Training", label: "Model Training" },
                { value: "Visualization", label: "Visualization" },
              ]}
              placeholder="Filter by category..."
              className="w-full"
              triggerClassName="w-full rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-900 dark:text-white px-5 py-2.5 text-xs font-semibold shadow-xs"
            />
          </div>
        </div>

        {/* Right Side: Search Bar */}
        <div className="relative w-full md:w-5/12">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by dataset or name..."
            className="w-full rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 focus:border-[#673AB7] dark:focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#673AB7]/15 dark:focus:ring-[#8b5cf6]/20 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Batch Selection Deletion Modal */}
      {showConfirmDeleteSelectedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#1c1c21] border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col gap-5 relative">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Move {selectedItemIds.size} {selectedItemIds.size === 1 ? "Item" : "Items"} to Recently Deleted?
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-400">10-Day Retention Period</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed space-y-2">
              <p>
                You are about to move <strong className="text-slate-900 dark:text-white font-bold">{selectedItemIds.size} selected history {selectedItemIds.size === 1 ? "record" : "records"}</strong> to Recently Deleted.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Items will stay in Settings → Recently Deleted for 10 days before auto-purging.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                disabled={deletingSelected}
                onClick={() => setShowConfirmDeleteSelectedModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <button
                disabled={deletingSelected}
                onClick={handleDeleteSelectedItems}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {deletingSelected ? (
                  <span className="animate-pulse">Moving Selected...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Move Selected ({selectedItemIds.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#1c1c21] border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col gap-5 relative">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Move All to Recently Deleted?</h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-400">10-Day Retention Period</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed space-y-2">
              <p>
                All history items will be moved to <strong className="text-slate-900 dark:text-white font-bold">Recently Deleted</strong> in Settings.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Items will be automatically purged permanently after 10 days.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                disabled={clearing}
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <button
                disabled={clearing}
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {clearing ? (
                  <span className="animate-pulse">Moving to Recently Deleted...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Move All to Recently Deleted
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single History Item Deletion Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#1c1c21] border border-slate-200 dark:border-zinc-800 shadow-xl flex flex-col gap-5 relative">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Move Item to Recently Deleted?</h3>
                <p className="text-[11px] text-slate-400 dark:text-zinc-400">10-Day Retention Period</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed space-y-2">
              <p>
                Are you sure you want to remove <strong className="text-slate-900 dark:text-white font-bold">{itemToDelete.name}</strong>?
              </p>
              <div className="flex items-center gap-2 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>This item will stay in Settings → Recently Deleted for 10 days before auto-purging.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                disabled={deletingItem}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <button
                disabled={deletingItem}
                onClick={handleDeleteSingleItem}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {deletingItem ? (
                  <span className="animate-pulse">Moving Item...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Move to Recently Deleted
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
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl bg-slate-50/50 dark:bg-[#212121]/20">
          <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-base font-bold text-black dark:text-white">No execution records found</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-2 leading-relaxed">
            You haven't run any cleaning operations yet. Upload a dataset inside the Clean tab to get started.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-10 text-center border border-slate-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/50 shadow-xs space-y-3">
          <Search className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No matching records found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
            No history items matched your search query or selected category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("All");
            }}
            className="px-4 py-2 text-xs font-bold rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer shadow-xs active:scale-95"
          >
            Reset Search & Filter
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <BouncyAccordion
            key={`history-accordion-p${currentPage}-f${activeFilter}-q${searchQuery}`}
            items={paginatedHistory.map((itemRaw) => {
            const job = itemDetails[itemRaw.id] || itemRaw;
            const isML = job.type === "training";
            const isVis = job.type === "visualization";
            const itemId = getItemUniqueId(job);
            const isSelected = selectedItemIds.has(itemId);

            // Visualization Module Accordion Item
            if (isVis) {
              return {
                id: itemId,
                customClass: isSelectionMode && isSelected 
                  ? "border-amber-500/50 dark:border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/5 shadow-xs" 
                  : "border-slate-200 dark:border-white/10 dark:bg-white/[0.02]",
                title: (
                  <div className="flex items-center justify-between gap-4 w-full pr-1">
                    <div className="flex items-center gap-3 sm:gap-4.5 min-w-0 flex-1">
                      {isSelectionMode && (
                        <div
                          onClick={(e) => handleToggleSelectItem(e, job)}
                          className="shrink-0 p-1 cursor-pointer select-none"
                          title={isSelected ? "Unselect item" : "Select item"}
                        >
                          <AnimatedCheckbox
                            checked={isSelected}
                            onChange={() => {}}
                            size={18}
                            color="#f59e0b"
                            className="pointer-events-none"
                          />
                        </div>
                      )}
                      <LineChart className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 ml-0.5" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-snug">
                          {job.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {formatDate(job.created_at)}</span>
                          <span className="text-slate-300 dark:text-zinc-600">•</span>
                          <span>Dataset: <strong className="text-slate-700 dark:text-zinc-200 font-semibold">{job.dataset_name}</strong></span>
                        </p>
                      </div>
                    </div>
                    {/* Desktop Only Actions in Header */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <RestoreButton 
                        onClick={() => handleRestoreVisualization(job, itemId)}
                        loading={restoreLoading && activeRestoringId === itemId}
                        title="Restore graph workspace"
                      />
                      <DeleteButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete({ id: job.id, type: job.type, name: job.name || job.dataset_name || "Visualization Chart" });
                        }}
                        title="Delete visualization record"
                      />
                    </div>
                  </div>
                ),
                description: (
                  <div className="space-y-5">
                    {/* DESKTOP VIEW */}
                    <div className="hidden sm:block space-y-5">
                      <div className="flex flex-col md:flex-row gap-5 items-stretch">
                        {job.preview_data && (
                          <div className="w-full md:w-5/12 bg-slate-100 dark:bg-zinc-800/80 rounded-xl overflow-hidden flex items-center justify-center p-3 border border-slate-200 dark:border-zinc-700 min-h-[160px] max-h-56 shadow-inner">
                            <img src={job.preview_data} alt={job.name} className="max-h-52 max-w-full object-contain rounded" />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-between gap-3 w-full">
                          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Chart Name</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block truncate">
                              {job.name || "Untitled Chart"}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Library</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block capitalize">
                              {job.library || "Plotly"}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Columns Plotted</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block">
                              X: <span className="text-purple-600 dark:text-purple-400 font-extrabold">{job.config?.x_column || "N/A"}</span>
                              <span className="mx-1.5 text-slate-300 dark:text-zinc-600">•</span>
                              Y: <span className="text-purple-600 dark:text-purple-400 font-extrabold">{job.config?.y_column || "N/A"}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Export Options */}
                      <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">Download Options</span>
                        <div className="flex flex-wrap items-center gap-3">
                          <AnimatedDownloadButton label="PNG Image" onClick={() => handleExportVisualization(job, "png")} />
                          <AnimatedDownloadButton label="SVG Vector" onClick={() => handleExportVisualization(job, "svg")} />
                          <AnimatedDownloadButton label="JPEG Image" onClick={() => handleExportVisualization(job, "jpeg")} />
                          <AnimatedDownloadButton label="PDF Document" onClick={() => handleExportVisualization(job, "pdf")} />
                          <AnimatedDownloadButton label="HTML File" onClick={() => handleExportVisualization(job, "html")} />
                        </div>
                      </div>
                    </div>

                    {/* MOBILE VIEW */}
                    <div className="block sm:hidden space-y-4">
                      {/* 1. Picture of Graph */}
                      {job.preview_data && (
                        <div className="w-full bg-slate-100 dark:bg-zinc-800/80 rounded-xl overflow-hidden flex items-center justify-center p-2.5 border border-slate-200 dark:border-zinc-700 min-h-[140px] max-h-48 shadow-inner">
                          <img src={job.preview_data} alt={job.name} className="max-h-44 max-w-full object-contain rounded" />
                        </div>
                      )}

                      {/* 2. [ | | ] 3-Column Row for Visualize */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-xs text-center min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">Chart Name</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1 block truncate">
                            {job.name || "Chart"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-xs text-center min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">Library</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1 block capitalize truncate">
                            {job.library || "Plotly"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-xs text-center min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">Columns</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1 block truncate">
                            {job.config?.x_column || "X"} / {job.config?.y_column || "Y"}
                          </span>
                        </div>
                      </div>

                      {/* 3. Mobile Footer Bar: [ Download Dropdown | Restore | Delete ] */}
                      <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <MobileDownloadDropdown
                          options={[
                            { label: "PNG Image", onClick: () => handleExportVisualization(job, "png") },
                            { label: "SVG Vector", onClick: () => handleExportVisualization(job, "svg") },
                            { label: "JPEG Image", onClick: () => handleExportVisualization(job, "jpeg") },
                            { label: "PDF Document", onClick: () => handleExportVisualization(job, "pdf") },
                            { label: "HTML File", onClick: () => handleExportVisualization(job, "html") },
                          ]}
                        />
                        <div className="flex items-center gap-2">
                          <RestoreButton
                            onClick={() => handleRestoreVisualization(job, itemId)}
                            loading={restoreLoading && activeRestoringId === itemId}
                            title="Restore chart workspace"
                          />
                          <DeleteButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete({ id: job.id, type: job.type, name: job.name || job.dataset_name || "Visualization Chart" });
                            }}
                            title="Delete visualization record"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              };
            }

            // Model Training Module Accordion Item
            if (isML) {
              const bestScore = job.best_model_score || 0;

              return {
                id: itemId,
                customClass: isSelectionMode && isSelected 
                  ? "border-amber-500/50 dark:border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/5 shadow-xs" 
                  : "border-slate-200 dark:border-white/10 dark:bg-white/[0.02]",
                title: (
                  <div className="flex items-center justify-between gap-4 w-full pr-1">
                    <div className="flex items-center gap-3 sm:gap-4.5 min-w-0 flex-1">
                      {isSelectionMode && (
                        <div
                          onClick={(e) => handleToggleSelectItem(e, job)}
                          className="shrink-0 p-1 cursor-pointer select-none"
                          title={isSelected ? "Unselect item" : "Select item"}
                        >
                          <AnimatedCheckbox
                            checked={isSelected}
                            onChange={() => {}}
                            size={18}
                            color="#f59e0b"
                            className="pointer-events-none"
                          />
                        </div>
                      )}
                      <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 ml-0.5" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-snug">
                          {job.dataset_name}
                        </h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {formatDate(job.created_at)}</span>
                          <span className="text-slate-300 dark:text-zinc-600">•</span>
                          <span>Target (Y): <strong className="text-slate-700 dark:text-zinc-200 font-semibold">{job.target_column}</strong></span>
                        </p>
                      </div>
                    </div>
                    {/* Desktop Only Actions in Header */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <RestoreButton 
                        onClick={() => handleRestoreMLJob(job, itemId)}
                        loading={restoreLoading && activeRestoringId === itemId}
                        title="Restore training model workspace"
                      />
                      <DeleteButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete({ id: job.id, type: job.type, name: job.dataset_name || "ML Training Job" });
                        }}
                        title="Delete training model record"
                      />
                    </div>
                  </div>
                ),
                description: (
                  <div className="space-y-5">
                    {/* DESKTOP VIEW */}
                    <div className="hidden sm:block space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Champion Model</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block capitalize truncate">
                            {job.best_model_name?.replace('_', ' ') || "N/A"}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Evaluation Score</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 block">
                            {(bestScore * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Training Duration</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                            {job.training_duration ? `${job.training_duration.toFixed(2)}s` : "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">Download Options</span>
                        <div className="flex flex-wrap items-center gap-3">
                          <AnimatedDownloadButton label="PKL Model File" onClick={() => handleDownloadML(job.id, "model")} />
                          <AnimatedDownloadButton label="Predictions CSV" onClick={() => handleDownloadML(job.id, "predictions")} />
                          <AnimatedDownloadButton label="PDF Report" onClick={() => handleDownloadML(job.id, "report")} />
                        </div>
                      </div>
                    </div>

                    {/* MOBILE VIEW */}
                    <div className="block sm:hidden space-y-4">
                      {/* 1. [ | | ] 3-Column Row for ML */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-xs text-center min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">Model</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1 block capitalize truncate">
                            {job.best_model_name?.replace('_', ' ') || "N/A"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-xs text-center min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">Score</span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
                            {(bestScore * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-xs text-center min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">Duration</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 mt-1 block truncate">
                            {job.training_duration ? `${job.training_duration.toFixed(1)}s` : "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* 2. Mobile Footer Bar: [ Download Dropdown | Restore | Delete ] */}
                      <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <MobileDownloadDropdown
                          options={[
                            { label: "PKL Model File", onClick: () => handleDownloadML(job.id, "model") },
                            { label: "Predictions CSV", onClick: () => handleDownloadML(job.id, "predictions") },
                            { label: "PDF Report", onClick: () => handleDownloadML(job.id, "report") },
                          ]}
                        />
                        <div className="flex items-center gap-2">
                          <RestoreButton
                            onClick={() => handleRestoreMLJob(job, itemId)}
                            loading={restoreLoading && activeRestoringId === itemId}
                            title="Restore training model workspace"
                          />
                          <DeleteButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete({ id: job.id, type: job.type, name: job.dataset_name || "ML Training Job" });
                            }}
                            title="Delete training model record"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              };
            }

            // Data Cleaning Module Accordion Item
            return {
              id: itemId,
              customClass: isSelectionMode && isSelected 
                ? "border-amber-500/50 dark:border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/5 shadow-xs" 
                : "border-slate-200 dark:border-white/10 dark:bg-white/[0.02]",
              title: (
                <div className="flex items-center justify-between gap-4 w-full pr-1">
                  <div className="flex items-center gap-3 sm:gap-4.5 min-w-0 flex-1">
                    {isSelectionMode && (
                      <div
                        onClick={(e) => handleToggleSelectItem(e, job)}
                        className="shrink-0 p-1 cursor-pointer select-none"
                        title={isSelected ? "Unselect item" : "Select item"}
                      >
                        <AnimatedCheckbox
                          checked={isSelected}
                          onChange={() => {}}
                          size={18}
                          color="#f59e0b"
                          className="pointer-events-none"
                        />
                      </div>
                    )}
                    <BrushCleaning className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 ml-0.5" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-snug">
                        {job.dataset_name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>{formatDate(job.created_at || job.cleaned_at)}</span>
                      </p>
                    </div>
                  </div>
                  {/* Desktop Only Actions in Header */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {onLoadWorkspace && (
                      <RestoreButton 
                        onClick={() => handleRestore(job, itemId)}
                        loading={restoreLoading && activeRestoringId === itemId}
                        title="Restore cleaning workspace"
                      />
                    )}
                    <DeleteButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemToDelete({ id: job.id, type: job.type, name: job.dataset_name || "Cleaning Record" });
                      }}
                      title="Delete cleaning record"
                    />
                  </div>
                </div>
              ),
              description: (
                <div className="space-y-5">
                  {/* DESKTOP VIEW */}
                  <div className="hidden sm:block space-y-5">
                    {(() => {
                      const beforeRows = job.before_stats?.rows ?? job.before_stats?.overview?.rows ?? job.rows ?? "-";
                      const afterRows = job.after_stats?.rows ?? job.after_stats?.overview?.rows ?? job.rows ?? "-";
                      const beforeCols = job.before_stats?.columns ?? job.before_stats?.overview?.columns ?? job.columns ?? "-";
                      const afterCols = job.after_stats?.columns ?? job.after_stats?.overview?.columns ?? job.columns ?? "-";
                      const beforeMissing = job.before_stats?.missing_summary?.total_missing ?? job.before_stats?.overview?.total_missing ?? job.before_stats?.total_missing ?? 0;
                      const afterMissing = job.after_stats?.missing_summary?.total_missing ?? job.after_stats?.overview?.total_missing ?? job.after_stats?.total_missing ?? 0;
                      const beforeDups = job.before_stats?.duplicate_summary?.duplicate_rows_count ?? job.before_stats?.overview?.duplicate_rows ?? job.before_stats?.duplicate_rows ?? 0;
                      const afterDups = job.after_stats?.duplicate_summary?.duplicate_rows_count ?? job.after_stats?.overview?.duplicate_rows ?? job.after_stats?.duplicate_rows ?? 0;

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Rows Change</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                              {beforeRows} <span className="text-slate-400">→</span> {afterRows}
                            </span>
                          </div>
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Columns Change</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                              {beforeCols} <span className="text-slate-400">→</span> {afterCols}
                            </span>
                          </div>
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Missing Cells</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                              {beforeMissing} <span className="text-slate-400">→</span> {afterMissing}
                            </span>
                          </div>
                          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Duplicate Rows</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1.5 block">
                              {beforeDups} <span className="text-slate-400">→</span> {afterDups}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {job.logs && job.logs.length > 0 && (
                      <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-zinc-800">
                        <button 
                          onClick={() => toggleLogs(job.id)}
                          className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition duration-150 flex justify-center items-center gap-2 cursor-pointer bg-white dark:bg-[#212121] text-slate-800 dark:text-zinc-200"
                        >
                          <FileText className="w-4 h-4 text-primary" /> {openLogsJobId === job.id ? "Hide Action Logs" : `Action Logs (${job.logs.length})`}
                        </button>
                      </div>
                    )}

                    {openLogsJobId === job.id && job.logs && job.logs.length > 0 && (
                      <div className="space-y-2 pt-2 animate-fade-in">
                        <span className="text-[11px] uppercase font-bold text-slate-500 block">Actions Logs</span>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#18181b] font-mono text-xs text-slate-700 dark:text-zinc-300 space-y-1.5 max-h-48 overflow-y-auto shadow-inner">
                          {job.logs.map((log, lidx) => (
                            <div key={lidx} className="flex items-start gap-2 border-b border-slate-100 dark:border-zinc-800/50 pb-1 last:border-0 last:pb-0">
                              <span className="text-slate-400">›</span> 
                              <span>{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                      <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">Download Options</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <AnimatedDownloadButton label="CSV File" onClick={() => handleDownload(job.dataset_id, "csv")} />
                        <AnimatedDownloadButton label="JSON File" onClick={() => handleDownload(job.dataset_id, "json")} />
                        <AnimatedDownloadButton label="Excel File" onClick={() => handleDownload(job.dataset_id, "excel")} />
                        <AnimatedDownloadButton label="PDF Report" onClick={() => handleDownload(job.dataset_id, "report")} />
                      </div>
                    </div>
                  </div>

                  {/* MOBILE VIEW */}
                  <div className="block sm:hidden space-y-4">
                    {/* 1. [ | | | ] 4-Column Row for Cleaning */}
                    {(() => {
                      const beforeRows = job.before_stats?.rows ?? job.before_stats?.overview?.rows ?? job.rows ?? "-";
                      const afterRows = job.after_stats?.rows ?? job.after_stats?.overview?.rows ?? job.rows ?? "-";
                      const beforeCols = job.before_stats?.columns ?? job.before_stats?.overview?.columns ?? job.columns ?? "-";
                      const afterCols = job.after_stats?.columns ?? job.after_stats?.overview?.columns ?? job.columns ?? "-";
                      const beforeMissing = job.before_stats?.missing_summary?.total_missing ?? job.before_stats?.overview?.total_missing ?? job.before_stats?.total_missing ?? 0;
                      const afterMissing = job.after_stats?.missing_summary?.total_missing ?? job.after_stats?.overview?.total_missing ?? job.after_stats?.total_missing ?? 0;
                      const beforeDups = job.before_stats?.duplicate_summary?.duplicate_rows_count ?? job.before_stats?.overview?.duplicate_rows ?? job.before_stats?.duplicate_rows ?? 0;
                      const afterDups = job.after_stats?.duplicate_summary?.duplicate_rows_count ?? job.after_stats?.overview?.duplicate_rows ?? job.after_stats?.duplicate_rows ?? 0;

                      return (
                        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                          <div className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#212121] shadow-xs text-center min-w-0">
                            <span className="text-[8px] uppercase font-bold text-slate-500 block truncate">Rows</span>
                            <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block truncate">
                              {beforeRows}→{afterRows}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#212121] shadow-xs text-center min-w-0">
                            <span className="text-[8px] uppercase font-bold text-slate-500 block truncate">Cols</span>
                            <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block truncate">
                              {beforeCols}→{afterCols}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#212121] shadow-xs text-center min-w-0">
                            <span className="text-[8px] uppercase font-bold text-slate-500 block truncate">Missing</span>
                            <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block truncate">
                              {beforeMissing}→{afterMissing}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#212121] shadow-xs text-center min-w-0">
                            <span className="text-[8px] uppercase font-bold text-slate-500 block truncate">Dups</span>
                            <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 mt-0.5 block truncate">
                              {beforeDups}→{afterDups}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. Action Log Button */}
                    {job.logs && job.logs.length > 0 && (
                      <div className="space-y-2">
                        <button 
                          onClick={() => toggleLogs(job.id)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 transition duration-150 flex justify-center items-center gap-2 cursor-pointer bg-white dark:bg-[#212121] text-slate-800 dark:text-zinc-200"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" /> {openLogsJobId === job.id ? "Hide Action Logs" : `Action Logs (${job.logs.length})`}
                        </button>

                        {openLogsJobId === job.id && (
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#18181b] font-mono text-[11px] text-slate-700 dark:text-zinc-300 space-y-1 max-h-40 overflow-y-auto shadow-inner animate-fade-in">
                            {job.logs.map((log, lidx) => (
                              <div key={lidx} className="flex items-start gap-1.5 border-b border-slate-100 dark:border-zinc-800/50 pb-1 last:border-0 last:pb-0">
                                <span className="text-slate-400">›</span> 
                                <span>{log}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. Mobile Footer Bar: [ Download Dropdown | Restore | Delete ] */}
                    <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <MobileDownloadDropdown
                        options={[
                          { label: "CSV File", onClick: () => handleDownload(job.dataset_id, "csv") },
                          { label: "JSON File", onClick: () => handleDownload(job.dataset_id, "json") },
                          { label: "Excel File", onClick: () => handleDownload(job.dataset_id, "excel") },
                          { label: "PDF Report", onClick: () => handleDownload(job.dataset_id, "report") },
                        ]}
                      />
                      <div className="flex items-center gap-2">
                        {onLoadWorkspace && (
                          <RestoreButton
                            onClick={() => handleRestore(job, itemId)}
                            loading={restoreLoading && activeRestoringId === itemId}
                            title="Restore cleaning workspace"
                          />
                        )}
                        <DeleteButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete({ id: job.id, type: job.type, name: job.dataset_name || "Cleaning Record" });
                          }}
                          title="Delete cleaning record"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            };
          })}
          value={expandedJobId}
          onValueChange={setExpandedJobId}
          classNames={{
            trigger: "p-5"
          }}
        />

        {/* Pagination Controls */}
        {(totalPages > 1 || historyHasMore) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 font-semibold select-none">
            <div>
              Showing {filteredHistory.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length}{historyHasMore ? "+" : ""} records (Page {currentPage} of {totalPages})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1 || historyLoadingMore}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-bold shadow-xs active:scale-95 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                disabled={(currentPage === totalPages && !historyHasMore) || historyLoadingMore}
                onClick={handleNextPage}
                className="px-4 py-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-bold shadow-xs active:scale-95 flex items-center gap-1"
              >
                {historyLoadingMore ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>
                    Next <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    )}

    </div>
  );
}