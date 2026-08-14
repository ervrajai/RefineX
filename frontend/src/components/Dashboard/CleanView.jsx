import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import FileUpload from "./FileUpload";
import RecentDatasetPanel from "../ui/RecentDatasetPanel";
import { BouncyAccordion } from "../ui/BouncyAccordion";
import RefreshButton from "../ui/RefreshButton";
import DatasetTableViewer from "../ui/DatasetTableViewer";
import { AnimatedSelect } from "../ui/AnimatedSelect";
import { AnimatedCheckbox } from "../ui/AnimatedCheckbox";
import MatrixLoader from "../ui/MatrixLoader";
import {
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  BrushCleaning,
  RefreshCw,
  FileDown,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  HelpCircle,
  ArrowUpDown,
  Table,
  FileText,
  BrainCircuit,
  LineChart,
  RotateCcw,
  History,
  Type,
  Copy,
  Hash,
  Layers,
  Calendar,
  Filter,
  ShieldCheck,
  X
} from "lucide-react";


export default function CleanView({
  datasetId,
  setDatasetId,
  metadata,
  setMetadata,
  report,
  setReport,
  preview,
  setPreview,
  beforeReport,
  setBeforeReport,
  afterReport,
  setAfterReport,
  cleanLogs,
  setCleanLogs,
  setActiveTab,
  isGuest = false,
  historyList = [],
  onRefreshHistory
}) {

  // Loading and alerts
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Clean history states
  const [cleanHistoryList, setCleanHistoryList] = useState([]);
  const [loadingCleanHistory, setLoadingCleanHistory] = useState(false);

  // Disable scroll on main container and reset to top when cleaning blur overlay is active
  useEffect(() => {
    const scrollContainer = document.getElementById("main-scroll-container");
    if (scrollContainer) {
      if (processing) {
        scrollContainer.scrollTop = 0;
        scrollContainer.style.overflow = "hidden";
      } else {
        scrollContainer.style.overflow = "auto";
      }
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.style.overflow = "auto";
      }
    };
  }, [processing]);

  useEffect(() => {
    if (!datasetId && historyList) {
      const seen = new Set();
      const userDatasets = (historyList || [])
        .filter((job) => job.dataset_id || job.id)
        .filter((job) => {
          const id = job.dataset_id || job.id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      setCleanHistoryList(userDatasets);
    }
  }, [datasetId, historyList]);

  const [loadingHistoryId, setLoadingHistoryId] = useState(null);

  const handleUseFromHistory = async (job) => {
    const targetDatasetId = job.dataset_id || job.id;
    if (!targetDatasetId) return;

    setLoadingHistoryId(targetDatasetId);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const previewRes = await api.get(`cleaning/${targetDatasetId}/preview/?offset=0&limit=100`);
      const previewData = previewRes.data;

      let analyzeData = {};
      try {
        const analyzeRes = await api.get(`cleaning/${targetDatasetId}/analyze/`);
        analyzeData = analyzeRes.data || {};
      } catch (e) {
        console.warn("Analysis fetch error:", e);
      }
      
      setDatasetId(targetDatasetId);
      setMetadata(analyzeData.metadata || previewData.metadata || null);
      setPreview(previewData);
      
      const rep = analyzeData.report || job.after_stats || job.before_stats || previewData.report || null;
      setReport(rep);
      setBeforeReport(job.before_stats || analyzeData.before_stats || rep);
      setAfterReport(job.after_stats || analyzeData.after_stats || rep);
      setCleanLogs(job.logs || analyzeData.logs || []);

      setSuccessMsg(`Loaded uploaded dataset "${job.dataset_name || job.name || previewData.metadata?.name}"!`);
    } catch (err) {
      setErrorMsg("Failed to load historical dataset details. The file might have been deleted.");
    } finally {
      setLoadingHistoryId(null);
    }
  };

  // Auto-fetch profile report if datasetId is loaded without a report
  useEffect(() => {
    if (datasetId && !report) {
      const fetchAnalysisReport = async () => {
        try {
          const res = await api.get(`cleaning/${datasetId}/analyze/`);
          const data = res.data;
          if (data) {
            if (data.metadata) setMetadata(data.metadata);
            const rep = data.report || data.after_stats || data.before_stats;
            if (rep) {
              setReport(rep);
              setBeforeReport(prev => prev || rep);
              setAfterReport(prev => prev || rep);
            }
          }
        } catch (err) {
          console.warn("Auto-fetching dataset analysis report failed:", err);
        }
      };
      fetchAnalysisReport();
    }
  }, [datasetId, report]);

  // Table pagination, search, sort
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Report Section active tab
  const [activeReportTab, setActiveReportTab] = useState("profile");

  // Multi-select for manual types & unwanted columns
  const [selectedUnwanted, setSelectedUnwanted] = useState([]);
  const [manualTypes, setManualTypes] = useState({});

  // Download dropdown toggle state
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef(null);

  // Accordion active item (only one open at a time)
  const [activeAccordion, setActiveAccordion] = useState("colNames");

  // 18 Cleaning configurations state
  const [config, setConfig] = useState({
    standardize_column_names: false,
    standardize_trim: true,
    standardize_replace_spaces: true,
    standardize_lowercase: true,
    standardize_remove_special: true,
    standardize_replace_multiple_underscores: true,
    standardize_remove_outer_underscores: true,
    
    handle_missing_values: false,
    missing_strategy: "nothing",
    missing_custom_value: "",
    
    remove_duplicate_rows: false,
    remove_duplicate_columns: false,
    
    clean_numeric_values: false,
    
    text_cleaning: false,
    text_trim: true,
    text_remove_multiple_spaces: false,
    text_remove_html: false,
    text_remove_emoji: false,
    text_remove_tabs_newlines: false,
    text_case_mode: "none",
    
    blank_value_detection: true,
    
    data_type_conversion: false,
    type_conversion_mode: "auto",
    
    outlier_strategy: "ignore",
    outlier_method: "iqr",
    
    date_formatting: false,
    date_format: "YYYY-MM-DD",
    
    decimal_formatting: false,
    decimal_format: "none",
    
    remove_constant_columns: false,
    
    remove_high_missing_columns: false,
    missing_threshold: 90,
    
    remove_low_variance_columns: false,
    
    remove_invalid_values: false,
    
    remove_unwanted_columns: false,
    
    reset_index: false,
    encoding: "UTF-8"
  });

  // Handle click outside download dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear messages automatically
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const [loadingMore, setLoadingMore] = useState(false);

  const toggleAccordion = (key) => {
    setActiveAccordion(prev => (prev === key ? null : key));
  };

  const loadMoreRows = async () => {
    if (loadingMore || !datasetId || !preview || !metadata) return;
    if (preview.rows.length >= metadata.rows) return;
    
    setLoadingMore(true);
    try {
      const offset = preview.rows.length;
      const res = await api.get(`cleaning/${datasetId}/preview/?offset=${offset}&limit=100`);
      setPreview(prev => ({
        ...prev,
        rows: [...prev.rows, ...res.data.rows]
      }));
    } catch (err) {
      console.error("Failed to load more rows:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTableScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 45) {
      loadMoreRows();
    }
  };

  const fileInputRef = useRef(null);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const abortControllerRef = useRef(null);

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setUploadProgress(0);
    setLoadedBytes(0);
    setUploadSpeed(0);
  };

  // Upload handler
  const uploadFile = async (file) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg("File size exceeds maximum limit of 100MB.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setUploading(true);
    setUploadProgress(0);
    setLoadedBytes(0);
    setTotalBytes(file?.size || 0);
    setUploadSpeed(0);
    setErrorMsg("");
    setSuccessMsg("");
    
    const formData = new FormData();
    formData.append("file", file);
    const startTime = Date.now();

    try {
      const res = await api.post("cleaning/upload/", formData, {
        signal: controller.signal,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          setLoadedBytes(loaded);
          if (total) {
            setTotalBytes(total);
            const percent = Math.round((loaded * 100) / total);
            setUploadProgress(percent);
          } else {
            setUploadProgress(50);
          }
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 0) {
            setUploadSpeed(Math.round(loaded / elapsed));
          }
        }
      });
      setUploadProgress(100);
      const data = res.data;
      setDatasetId(data.dataset_id);
      setMetadata(data.metadata);
      setReport(data.report);
      setPreview(data.preview);
      setBeforeReport(data.report);
      setAfterReport(null);
      setCleanLogs([]);
      setSelectedUnwanted([]);
      setManualTypes({});
      
      const mapping = {};
      data.report.data_types.forEach(item => {
        mapping[item.column] = "string";
      });
      setManualTypes(mapping);

      setSuccessMsg("File uploaded and profiled successfully!");
      if (onRefreshHistory) onRefreshHistory();
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED" || (err.message && err.message.includes("canceled"))) {
        setErrorMsg("Upload canceled.");
      } else {
        const apiError = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || (typeof err.response?.data === "string" ? err.response.data : null) || err.message;
        setErrorMsg(apiError || "Failed to upload and parse dataset. Check delimiter, rows format, or file corruption.");
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const requestCancelCleaning = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancelCleaning = () => {
    setShowCancelConfirm(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setProcessing(false);
    setErrorMsg("Cleaning process canceled. No changes were made or saved.");
  };

  const continueCleaning = () => {
    setShowCancelConfirm(false);
  };

  // Clean handler
  const handleClean = async () => {
    if (!datasetId) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");

    const cleanConfig = {
      ...config,
      unwanted_columns: selectedUnwanted,
      type_conversion_columns: manualTypes
    };

    try {
      const res = await api.post(`cleaning/${datasetId}/clean/`, { config: cleanConfig }, { signal: controller.signal });
      const data = res.data;
      
      setMetadata(data.metadata);
      setBeforeReport(data.before_report);
      setAfterReport(data.after_report);
      setReport(data.after_report);
      setPreview(data.preview);
      setCleanLogs(data.logs);
      setSelectedUnwanted([]);
      
      setActiveReportTab("compare");
      setSuccessMsg("Dataset cleaned successfully!");
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED" || (err.message && err.message.includes("canceled"))) {
        setErrorMsg("Cleaning operation canceled.");
      } else {
        setErrorMsg(err.response?.data?.error || "Cleaning operation failed.");
      }
    } finally {
      setProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // Smart Decide (RefineX Decide)
  const handleDecide = async () => {
    if (!datasetId) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.post(`cleaning/${datasetId}/decide/`, {}, { signal: controller.signal });
      const data = res.data;
      
      setMetadata(data.metadata);
      setBeforeReport(data.before_report);
      setAfterReport(data.after_report);
      setReport(data.after_report);
      setPreview(data.preview);
      setCleanLogs(data.logs);
      
      setConfig(prev => ({
        ...prev,
        standardize_column_names: true,
        remove_duplicate_rows: true,
        remove_duplicate_columns: true,
        clean_numeric_values: true,
        text_cleaning: true,
        blank_value_detection: true,
        data_type_conversion: true,
        type_conversion_mode: "auto",
        remove_constant_columns: true,
        remove_high_missing_columns: true,
        remove_low_variance_columns: true,
        remove_invalid_values: true,
        reset_index: true
      }));

      setSelectedUnwanted([]);
      setActiveReportTab("compare");
      setSuccessMsg("✨ RefineX Decide auto-cleaning complete!");
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED" || (err.message && err.message.includes("canceled"))) {
        setErrorMsg("RefineX Decide operation canceled.");
      } else {
        setErrorMsg(err.response?.data?.error || "RefineX Decide operation failed.");
      }
    } finally {
      setProcessing(false);
      abortControllerRef.current = null;
    }
  };

  // Reset handler
  const handleReset = async () => {
    if (!datasetId) return;
    setProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.post(`cleaning/${datasetId}/reset/`, {});
      const data = res.data;
      
      setMetadata(data.metadata);
      setReport(data.report);
      setPreview(data.preview);
      setBeforeReport(data.report);
      setAfterReport(null);
      setCleanLogs([]);
      setSelectedUnwanted([]);
      
      setConfig(prev => ({
        ...prev,
        standardize_column_names: false,
        handle_missing_values: false,
        remove_duplicate_rows: false,
        remove_duplicate_columns: false,
        clean_numeric_values: false,
        text_cleaning: false,
        blank_value_detection: true,
        data_type_conversion: false,
        type_conversion_mode: "auto",
        outlier_strategy: "ignore",
        date_formatting: false,
        decimal_formatting: false,
        remove_constant_columns: false,
        remove_high_missing_columns: false,
        remove_low_variance_columns: false,
        remove_invalid_values: false,
        remove_unwanted_columns: false,
        reset_index: false
      }));

      setActiveReportTab("profile");
      setSuccessMsg("Dataset reset to original state.");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Reset failed.");
    } finally {
      setProcessing(false);
    }
  };

  // Download handler (direct background download without page redirect)
  const handleDownload = async (type) => {
    if (!datasetId) return;
    try {
      const res = await api.get(`cleaning/${datasetId}/download/?type=${type}`, {
        responseType: "blob",
      });
      const ext = type === "excel" ? "xlsx" : type === "report" ? "pdf" : type === "log" ? "txt" : "csv";
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `cleaned_dataset_${datasetId}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setErrorMsg("Failed to download file. Please try again.");
    }
  };

  // Sorting columns in preview table
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter columns & rows
  const getProcessedRows = () => {
    if (!preview || !preview.rows) return [];
    let items = [...preview.rows];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(row => {
        return Object.values(row).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(query)
        );
      });
    }

    if (sortConfig.key) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
        
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
        if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return items;
  };

  const processedRows = getProcessedRows();
  const totalPages = Math.ceil(processedRows.length / rowsPerPage);
  const paginatedRows = processedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUnwantedToggle = (col) => {
    setSelectedUnwanted(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleManualTypeChange = (col, type) => {
    setManualTypes(prev => ({ ...prev, [col]: type }));
  };

  // Clears the sidebar configuration checkboxes ONLY
  const handleConfigReset = () => {
    setConfig({
      standardize_column_names: false, standardize_trim: true, standardize_replace_spaces: true, standardize_lowercase: true, standardize_remove_special: true, standardize_replace_multiple_underscores: true, standardize_remove_outer_underscores: true,
      handle_missing_values: false, missing_strategy: "nothing", missing_custom_value: "",
      remove_duplicate_rows: false, remove_duplicate_columns: false,
      clean_numeric_values: false,
      text_cleaning: false, text_trim: true, text_remove_multiple_spaces: false, text_remove_html: false, text_remove_emoji: false, text_remove_tabs_newlines: false, text_case_mode: "none",
      blank_value_detection: true,
      data_type_conversion: false, type_conversion_mode: "auto",
      outlier_strategy: "ignore", outlier_method: "iqr",
      date_formatting: false, date_format: "YYYY-MM-DD",
      decimal_formatting: false, decimal_format: "none",
      remove_constant_columns: false, remove_high_missing_columns: false, missing_threshold: 90,
      remove_low_variance_columns: false, remove_invalid_values: false, remove_unwanted_columns: false,
      reset_index: false, encoding: "UTF-8"
    });
    setSuccessMsg("Sidebar configuration cleared.");
  };

  // Cleaning Configuration Accordion Items Definition
  const cleaningAccordionItems = [
    {
      id: "colNames",
      icon: <Type className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Column Names</span>,
      description: (
        <div className="space-y-3 text-xs select-none">
          <AnimatedCheckbox
            checked={config.standardize_column_names}
            onChange={(e) => setConfig({ ...config, standardize_column_names: e.target.checked })}
            label="Standardize Column Names"
            className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
          />
          
          {config.standardize_column_names && (
            <div className="pl-3.5 space-y-2.5 text-slate-600 dark:text-zinc-400 font-medium text-xs">
              <AnimatedCheckbox
                checked={config.standardize_trim}
                onChange={(e) => setConfig({ ...config, standardize_trim: e.target.checked })}
                label="Trim leading/trailing spaces"
                className="font-medium text-slate-700 dark:text-zinc-300 text-xs"
              />
              <AnimatedCheckbox
                checked={config.standardize_replace_spaces}
                onChange={(e) => setConfig({ ...config, standardize_replace_spaces: e.target.checked })}
                label={'Replace spaces with "_"'}
                className="font-medium text-slate-700 dark:text-zinc-300 text-xs"
              />
              <AnimatedCheckbox
                checked={config.standardize_lowercase}
                onChange={(e) => setConfig({ ...config, standardize_lowercase: e.target.checked })}
                label="Convert to lowercase"
                className="font-medium text-slate-700 dark:text-zinc-300 text-xs"
              />
              <AnimatedCheckbox
                checked={config.standardize_remove_special}
                onChange={(e) => setConfig({ ...config, standardize_remove_special: e.target.checked })}
                label="Remove special characters"
                className="font-medium text-slate-700 dark:text-zinc-300 text-xs"
              />
              <AnimatedCheckbox
                checked={config.standardize_replace_multiple_underscores}
                onChange={(e) => setConfig({ ...config, standardize_replace_multiple_underscores: e.target.checked })}
                label="Replace multiple underscores"
                className="font-medium text-slate-700 dark:text-zinc-300 text-xs"
              />
              <AnimatedCheckbox
                checked={config.standardize_remove_outer_underscores}
                onChange={(e) => setConfig({ ...config, standardize_remove_outer_underscores: e.target.checked })}
                label="Remove leading/trailing '_'"
                className="font-medium text-slate-700 dark:text-zinc-300 text-xs"
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: "missing",
      icon: <HelpCircle className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Missing Values</span>,
      description: (
        <div className="space-y-3 text-xs">
          <AnimatedCheckbox
            checked={config.handle_missing_values}
            onChange={(e) => setConfig({ ...config, handle_missing_values: e.target.checked })}
            label="Handle Missing Values"
            className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
          />

          {config.handle_missing_values && (
            <div className="pl-3.5 space-y-2.5 text-xs text-slate-700 dark:text-zinc-300">
              <label className="block font-semibold text-slate-800 dark:text-zinc-200 text-xs">Imputation Strategy</label>
              <AnimatedSelect
                value={config.missing_strategy}
                onChange={(val) => setConfig({ ...config, missing_strategy: val })}
                options={[
                  { value: "nothing", label: "Do Nothing" },
                  { value: "remove_rows", label: "Remove Rows" },
                  { value: "remove_cols", label: "Remove Columns" },
                  { value: "fill_mean", label: "Fill Mean (Numeric)" },
                  { value: "fill_median", label: "Fill Median (Numeric)" },
                  { value: "fill_mode", label: "Fill Mode" },
                  { value: "ffill", label: "Forward Fill" },
                  { value: "bfill", label: "Backward Fill" },
                  { value: "interpolate", label: "Interpolation (Numeric)" },
                  { value: "custom_value", label: "Custom Value" },
                ]}
                className="w-full"
              />

              {config.missing_strategy === "custom_value" && (
                <input
                  type="text"
                  placeholder="Type custom value..."
                  value={config.missing_custom_value}
                  onChange={(e) => setConfig({ ...config, missing_custom_value: e.target.value })}
                  className="w-full px-2.5 py-1.5 mt-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-medium text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-400 text-slate-900 dark:text-white transition"
                />
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: "duplicates",
      icon: <Copy className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Duplicates</span>,
      description: (
        <div className="space-y-3 text-xs text-slate-800 dark:text-zinc-200">
          <AnimatedCheckbox
            checked={config.remove_duplicate_rows}
            onChange={(e) => setConfig({ ...config, remove_duplicate_rows: e.target.checked })}
            label="Remove Duplicate Rows"
            className="font-bold text-xs sm:text-[13px]"
          />
          <AnimatedCheckbox
            checked={config.remove_duplicate_columns}
            onChange={(e) => setConfig({ ...config, remove_duplicate_columns: e.target.checked })}
            label="Remove Duplicate Columns"
            className="font-bold text-xs sm:text-[13px]"
          />
        </div>
      )
    },
    {
      id: "numeric",
      icon: <Hash className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Numeric Cleaning</span>,
      description: (
        <div className="space-y-2.5 text-xs">
          <AnimatedCheckbox
            checked={config.clean_numeric_values}
            onChange={(e) => setConfig({ ...config, clean_numeric_values: e.target.checked })}
            label="Clean Numeric Columns"
            className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
          />
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-normal pl-1 pt-0.5">
            Auto-extract numerical values. Cleans currency symbols ($, ₹, €, £, ¥), codes (rs, Rs., USD, INR, EUR, etc.), percentages (%), spaces, and comma separators.
          </p>
        </div>
      )
    },
    {
      id: "text",
      icon: <FileText className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Text & Blank Cleaning</span>,
      description: (
        <div className="space-y-3 text-xs">
          <AnimatedCheckbox
            checked={config.text_cleaning}
            onChange={(e) => setConfig({ ...config, text_cleaning: e.target.checked })}
            label="Enable Text Cleaning"
            className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
          />

          {config.text_cleaning && (
            <div className="pl-3.5 space-y-2.5 text-xs text-slate-700 dark:text-zinc-300">
              <AnimatedCheckbox
                checked={config.text_trim}
                onChange={(e) => setConfig({ ...config, text_trim: e.target.checked })}
                label="Trim leading/trailing spaces"
                className="font-medium text-xs text-slate-700 dark:text-zinc-300"
              />
              <AnimatedCheckbox
                checked={config.text_remove_multiple_spaces}
                onChange={(e) => setConfig({ ...config, text_remove_multiple_spaces: e.target.checked })}
                label="Remove multiple spaces"
                className="font-medium text-xs text-slate-700 dark:text-zinc-300"
              />
              <AnimatedCheckbox
                checked={config.text_remove_html}
                onChange={(e) => setConfig({ ...config, text_remove_html: e.target.checked })}
                label="Remove HTML tags"
                className="font-medium text-xs text-slate-700 dark:text-zinc-300"
              />
              <AnimatedCheckbox
                checked={config.text_remove_emoji}
                onChange={(e) => setConfig({ ...config, text_remove_emoji: e.target.checked })}
                label="Remove emojis & non-ASCII"
                className="font-medium text-xs text-slate-700 dark:text-zinc-300"
              />
              <AnimatedCheckbox
                checked={config.text_remove_tabs_newlines}
                onChange={(e) => setConfig({ ...config, text_remove_tabs_newlines: e.target.checked })}
                label="Remove tabs & newlines"
                className="font-medium text-xs text-slate-700 dark:text-zinc-300"
              />

              <div className="space-y-1 mt-1.5">
                <label className="block font-semibold text-xs text-slate-800 dark:text-zinc-200 mb-1">Case Convert Mode</label>
                <AnimatedSelect
                  value={config.text_case_mode}
                  onChange={(val) => setConfig({ ...config, text_case_mode: val })}
                  options={[
                    { value: "none", label: "No case change" },
                    { value: "upper", label: "UPPERCASE" },
                    { value: "lower", label: "lowercase" },
                    { value: "title", label: "Title Case" },
                    { value: "sentence", label: "Sentence case" },
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80">
            <AnimatedCheckbox
              checked={config.blank_value_detection}
              onChange={(e) => setConfig({ ...config, blank_value_detection: e.target.checked })}
              label="Blank Value Detection"
              className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
            />
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-normal pl-1 mt-1">
              Treat cell strings like "NA", "N/A", "NULL", "null", "--", "-", "Unknown", "None", spaces as Missing (NaN).
            </p>
          </div>
        </div>
      )
    },
    {
      id: "types",
      icon: <Layers className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Columns & Type Casting</span>,
      description: (
        <div className="space-y-3 text-xs">
          <div>
            <span className="font-semibold text-xs text-slate-800 dark:text-zinc-200 block mb-1.5">Remove Columns</span>
            <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 space-y-1.5 bg-slate-50/50 dark:bg-zinc-900/50">
              {preview?.columns?.map(col => (
                <label key={col} className="flex items-center gap-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={selectedUnwanted.includes(col)}
                    onChange={() => handleUnwantedToggle(col)}
                    className="rounded text-xs cursor-pointer accent-purple-600"
                  />
                  {col}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80">
            <AnimatedCheckbox
              checked={config.data_type_conversion}
              onChange={(e) => setConfig({ ...config, data_type_conversion: e.target.checked })}
              label="Convert Data Types"
              className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
            />
            
            {config.data_type_conversion && (
              <div className="pl-3.5 mt-2.5 space-y-2.5">
                <label className="block font-semibold text-xs text-slate-800 dark:text-zinc-200">Conversion Mode</label>
                <AnimatedSelect
                  value={config.type_conversion_mode}
                  onChange={(val) => setConfig({ ...config, type_conversion_mode: val })}
                  options={[
                    { value: "auto", label: "Auto-Detect types" },
                    { value: "manual", label: "Manual casting" },
                  ]}
                  className="w-full"
                />

                {config.type_conversion_mode === "manual" && (
                  <div className="space-y-2 max-h-36 overflow-y-auto border p-2 rounded-lg bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    {preview?.columns?.map((col) => (
                      <div key={col} className="flex items-center justify-between gap-1.5">
                        <span className="font-medium text-xs text-slate-600 dark:text-zinc-400 truncate max-w-[100px]">{col}</span>
                        <AnimatedSelect
                          value={manualTypes[col] || "string"}
                          onChange={(val) => handleManualTypeChange(col, val)}
                          options={[
                            { value: "string", label: "String" },
                            { value: "integer", label: "Integer" },
                            { value: "float", label: "Float" },
                            { value: "datetime", label: "Datetime" },
                            { value: "boolean", label: "Boolean" },
                            { value: "category", label: "Category" },
                          ]}
                          className="w-28"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: "outliers",
      icon: <AlertTriangle className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Outlier Handling</span>,
      description: (
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-800 dark:text-zinc-200 text-xs">Handling Strategy</label>
            <AnimatedSelect
              value={config.outlier_strategy}
              onChange={(val) => setConfig({ ...config, outlier_strategy: val })}
              options={[
                { value: "ignore", label: "Ignore / Do nothing" },
                { value: "remove", label: "Remove Outlier Rows" },
                { value: "cap", label: "Cap Outliers (Boundaries)" },
                { value: "replace_mean", label: "Replace with Mean" },
                { value: "replace_median", label: "Replace with Median" },
              ]}
              className="w-full"
            />
          </div>

          {config.outlier_strategy !== "ignore" && (
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-zinc-200 text-xs">Assessment Method</label>
              <AnimatedSelect
                value={config.outlier_method}
                onChange={(val) => setConfig({ ...config, outlier_method: val })}
                options={[
                  { value: "iqr", label: "IQR (1.5 IQR range)" },
                  { value: "z_score", label: "Z-Score (3.0 StdDev)" },
                ]}
                className="w-full"
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: "dateDecimal",
      icon: <Calendar className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Dates & Decimals</span>,
      description: (
        <div className="space-y-3 text-xs">
          <div>
            <AnimatedCheckbox
              checked={config.date_formatting}
              onChange={(e) => setConfig({ ...config, date_formatting: e.target.checked })}
              label="Format Dates"
              className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
            />
            {config.date_formatting && (
              <AnimatedSelect
                value={config.date_format}
                onChange={(val) => setConfig({ ...config, date_format: val })}
                options={[
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                ]}
                className="w-full mt-2"
              />
            )}
          </div>

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80">
            <AnimatedCheckbox
              checked={config.decimal_formatting}
              onChange={(e) => setConfig({ ...config, decimal_formatting: e.target.checked })}
              label="Decimal Rounding"
              className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
            />
            {config.decimal_formatting && (
              <AnimatedSelect
                value={config.decimal_format}
                onChange={(val) => setConfig({ ...config, decimal_format: val })}
                options={[
                  { value: "none", label: "No Rounding" },
                  { value: "2", label: "2 Decimal Places" },
                  { value: "3", label: "3 Decimal Places" },
                  { value: "4", label: "4 Decimal Places" },
                ]}
                className="w-full mt-2"
              />
            )}
          </div>
        </div>
      )
    },
    {
      id: "variance",
      icon: <Filter className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Columns Filter</span>,
      description: (
        <div className="space-y-3 text-xs text-slate-800 dark:text-zinc-200">
          <AnimatedCheckbox
            checked={config.remove_constant_columns}
            onChange={(e) => setConfig({ ...config, remove_constant_columns: e.target.checked })}
            label="Remove Constant Columns"
            className="font-bold text-xs sm:text-[13px]"
          />

          <AnimatedCheckbox
            checked={config.remove_low_variance_columns}
            onChange={(e) => setConfig({ ...config, remove_low_variance_columns: e.target.checked })}
            label="Remove Low Variance Columns"
            className="font-bold text-xs sm:text-[13px]"
          />

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80">
            <AnimatedCheckbox
              checked={config.remove_high_missing_columns}
              onChange={(e) => setConfig({ ...config, remove_high_missing_columns: e.target.checked })}
              label="Remove High-Null Columns"
              className="font-bold text-xs sm:text-[13px]"
            />
            {config.remove_high_missing_columns && (
              <div className="pl-3.5 space-y-2 mt-2">
                <div className="flex justify-between font-semibold text-xs text-slate-600 dark:text-zinc-400">
                  <span>Threshold</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{config.missing_threshold}% Nulls</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  step="5"
                  value={config.missing_threshold}
                  onChange={(e) => setConfig({ ...config, missing_threshold: Number(e.target.value) })}
                  className="w-full h-2 rounded-lg bg-slate-200 dark:bg-zinc-800 appearance-none cursor-pointer accent-purple-600 dark:accent-purple-400"
                />
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: "invalid",
      icon: <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-zinc-400 shrink-0" />,
      title: <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-zinc-100">Validations & Encoding</span>,
      description: (
        <div className="space-y-3 text-xs">
          <div>
            <AnimatedCheckbox
              checked={config.remove_invalid_values}
              onChange={(e) => setConfig({ ...config, remove_invalid_values: e.target.checked })}
              label="Remove Invalid Values"
              className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
            />
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-normal pl-1 mt-1">
              Clean values like negative Age/Salary, malformed Email addresses, invalid phone formatting, or impossible dates.
            </p>
          </div>

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80">
            <AnimatedCheckbox
              checked={config.reset_index}
              onChange={(e) => setConfig({ ...config, reset_index: e.target.checked })}
              label="Reset Row Index (0 to N)"
              className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-[13px]"
            />
          </div>

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400">
            <label className="block font-semibold text-xs text-slate-800 dark:text-zinc-200 mb-1">Import File Encoding</label>
            <AnimatedSelect
              value={config.encoding}
              onChange={(val) => setConfig({ ...config, encoding: val })}
              options={[
                { value: "UTF-8", label: "Auto-Detect / UTF-8" },
                { value: "ASCII", label: "ASCII" },
                { value: "Latin-1", label: "Latin-1 (ISO-8859-1)" },
                { value: "UTF-16", label: "UTF-16" },
              ]}
              className="w-full"
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`space-y-6 text-slate-800 dark:text-zinc-100 pb-10 animate-fade-in font-sans relative ${!datasetId ? "max-w-7xl mx-auto" : "max-w-full"}`}>
      
      {/* DATA CLEANING LOADING OVERLAY */}
      {processing && (
        <div className="absolute -top-16 -left-6 -right-6 -bottom-10 z-50 bg-slate-900/40 dark:bg-black/75 backdrop-blur-md p-4 sm:p-6 text-center animate-fade-in select-none">
          <div className="sticky top-1/2 -translate-y-1/2 mx-auto flex flex-col items-center p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-[#1a1a1e]/90 border border-slate-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl max-w-xs sm:max-w-sm w-full space-y-5 animate-scale-in">
            {/* Custom Matrix Loader */}
            <MatrixLoader className="scale-110 sm:scale-125" />

            {/* Title & Details */}
            <div className="flex flex-col items-center gap-1 w-full">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Please Wait, Cleaning Dataset...
              </h3>
              <p className="text-[11px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 capitalize truncate max-w-full">
                Processing data transformations
              </p>
            </div>

            {/* Custom Theme Rounded Progress Bar Container */}
            <div className="w-full space-y-1.5">
              <div className="relative w-full h-8 rounded-full bg-slate-900 border-2 border-slate-900 dark:bg-black dark:border-white overflow-hidden shadow-inner flex items-center justify-center">
                <div
                  className="absolute left-0 top-0 h-full bg-slate-100 dark:bg-white transition-all duration-300 ease-out"
                  style={{ width: "100%" }}
                />
                <span className="relative z-10 text-xs font-black tracking-wider text-slate-900 dark:text-black whitespace-nowrap pointer-events-none">
                  Processing...
                </span>
              </div>
            </div>

            {/* Cancel Button / Confirmation UI */}
            {!showCancelConfirm ? (
              <button
                type="button"
                onClick={requestCancelCleaning}
                className="mt-1 w-full sm:w-auto px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel Cleaning
              </button>
            ) : (
              <div className="mt-1 flex flex-col items-center gap-2 w-full animate-fade-in">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Cancel cleaning process?
                </span>
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={confirmCancelCleaning}
                    className="flex-1 py-2 px-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    type="button"
                    onClick={continueCleaning}
                    className="flex-1 py-2 px-3 rounded-full bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-xs shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    No, Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Toast Alerts */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 shadow-2xl backdrop-blur-md animate-fade-in max-w-md">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="flex-1 font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-rose-600 dark:text-rose-450 shadow-2xl backdrop-blur-md animate-fade-in max-w-md">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="flex-1 font-medium">{errorMsg}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0 py-1 mb-6">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Data Cleaning
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-zinc-400 mt-0.5">
            Detect and resolve duplicates, missing cells, constant variables, and formatting conflicts
          </p>
        </div>
        
        {datasetId && (
          <div className="flex flex-col items-start sm:items-end gap-2.5">
            {/* ROW 1: Inline Pill Buttons (Switch Dataset | Reset Dataset | Download) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 1. SWITCH DATASET */}
              <RefreshButton
                label="Switch Dataset"
                title="Switch to another dataset"
                onClick={() => {
                  setDatasetId(null); setMetadata(null); setReport(null); setPreview(null);
                  setBeforeReport(null); setAfterReport(null); setCleanLogs([]); setSelectedUnwanted([]);
                }}
              />

              {/* 2. RESET DATASET */}
              <button 
                type="button"
                onClick={handleReset}
                disabled={processing}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2 h-9 text-xs font-bold rounded-full bg-transparent text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500 dark:hover:border-rose-400 focus:text-rose-500 focus:border-rose-500 transition-all duration-300 ease-in-out cursor-pointer text-center shadow-xs whitespace-nowrap select-none active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-300" />
                <span>Reset Dataset</span>
              </button>

              {/* 3. DOWNLOAD */}
              <div className="relative" ref={downloadRef}>
                <button 
                  type="button"
                  onClick={() => setDownloadOpen(!downloadOpen)}
                  className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 h-9 text-xs font-bold rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-white cursor-pointer transition-all duration-200 shadow-xs active:scale-95 select-none"
                >
                  <Download className="w-3.5 h-3.5 text-white dark:text-slate-900" />
                  <span>Download</span>
                  <ChevronDown className={`w-3 h-3 text-white dark:text-slate-900 transition-transform duration-200 ${downloadOpen ? "rotate-180" : ""}`} />
                </button>
                {downloadOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl w-44 overflow-hidden py-1">
                    <button onClick={() => { handleDownload("csv"); setDownloadOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">Clean CSV</button>
                    <button onClick={() => { handleDownload("excel"); setDownloadOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">Clean Excel</button>
                    <button onClick={() => { handleDownload("report"); setDownloadOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">PDF Audit Report</button>
                    <button onClick={() => { handleDownload("log"); setDownloadOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">Cleaning Log</button>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: Empty space or action indicator */}
          </div>
        )}
      </div>

        {/* DATASET METADATA TILES (In Air Layout) */}
        {datasetId && metadata && (
          <div className="space-y-3.5 mb-6">
            {/* Active CSV Title Bar (In Air) */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 text-purple-600 dark:text-purple-400 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/20">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight">
                {metadata.name}
              </h2>
            </div>

            {/* Rectangular Data Tiles Grid (In Air - matches Data Visualization Studio) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                  Type
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block">
                  {metadata.file_type ? metadata.file_type.toUpperCase() : "N/A"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                  Total Rows
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block">
                  {(metadata.rows ?? 0).toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                  Total Columns
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block">
                  {(metadata.columns ?? 0).toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                  File Size
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block">
                  {metadata.file_size ? formatSize(metadata.file_size) : "N/A"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                  Encoding
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block uppercase">
                  {metadata.encoding ? metadata.encoding.toUpperCase() : "UTF-8"}
                </span>
              </div>
            </div>
          </div>
        )}

      {/* NO DATASET / UPLOADER STATE */}
      {!datasetId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 70% Left: Upload Dropzone */}
          <div className="lg:col-span-8 w-full">
            <FileUpload
              onFileUpload={uploadFile}
              uploading={uploading}
              progress={uploadProgress}
              loadedBytes={loadedBytes}
              totalBytes={totalBytes}
              uploadSpeed={uploadSpeed}
              errorMsg={errorMsg}
              successMsg={successMsg}
              acceptedFormats={[".csv", ".xlsx", ".xls"]}
              maxSizeMB={100}
              onCancel={cancelUpload}
              onReset={() => {
                setDatasetId(null);
                setMetadata(null);
                setReport(null);
                setPreview(null);
                setErrorMsg("");
                setSuccessMsg("");
              }}
            />
          </div>

          {/* 30% Right: History Card Panel */}
          {!isGuest && cleanHistoryList.length > 0 && (
            <div className="lg:col-span-4 w-full">
              <RecentDatasetPanel
                items={cleanHistoryList}
                onSelect={(item) => handleUseFromHistory(item)}
                onViewAll={() => setActiveTab("history")}
                onRefresh={onRefreshHistory}
                loadingId={loadingHistoryId}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* WORKSPACE LAYOUT (25% Left Sidebar / 75% Right Content Area) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT SIDEBAR (Cleaning Configuration Options) */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4 z-10 max-h-[calc(100vh-60px)] overflow-y-auto pr-0.5">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-md">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-3 pb-3 border-b border-slate-150 dark:border-zinc-800 mb-3.5">
                  <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Cleaning Configuration</span>
                </h2>

                <BouncyAccordion
                  items={cleaningAccordionItems}
                  value={activeAccordion}
                  onValueChange={(val) => setActiveAccordion(val)}
                  collapsible={true}
                  classNames={{
                    trigger: "py-3 px-3.5 min-h-[46px]",
                    description: "p-3.5 sm:p-4"
                  }}
                />

                {/* Sidebar bottom action buttons */}
                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-3">
                  
                  {/* 1. CLEAN (Standard Action) */}
                  <button
                    onClick={handleClean}
                    disabled={processing}
                    className="group w-full px-4 py-3 text-sm font-bold rounded-xl bg-[#393e7f] dark:bg-[#a855f7] text-white dark:text-zinc-950 outline-2 outline-offset-[-2px] outline-[#393e7f] dark:outline-[#a855f7] border-none cursor-pointer transition-all duration-300 shadow-sm flex items-center justify-center gap-2 hover:bg-transparent dark:hover:bg-transparent hover:text-[#393e7f] dark:hover:text-[#c084fc] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {processing ? (
                      <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
                    ) : (
                      <BrushCleaning className="w-4 h-4 transition-colors duration-300 stroke-[2.5]" />
                    )}
                    <span>Clean Features</span>
                  </button>

                  {/* 2. DECIDE (Auto Action) */}
                  <button
                    onClick={handleDecide}
                    disabled={processing}
                    className="group w-full px-4 py-3 text-sm font-bold rounded-xl bg-indigo-600 dark:bg-indigo-400 text-white dark:text-zinc-950 outline-2 outline-offset-[-2px] outline-indigo-600 dark:outline-indigo-400 border-none cursor-pointer transition-all duration-300 shadow-sm flex items-center justify-center gap-2 hover:bg-transparent dark:hover:bg-transparent hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Sparkles className="w-4 h-4 transition-colors duration-300 stroke-[2.5]" /> 
                    <span>Auto-Decide</span>
                  </button>

                  {/* 3. SIDEBAR RESET (Clears Checkboxes Only) */}
                  <button
                    onClick={handleConfigReset}
                    disabled={processing}
                    className="group w-full px-4 py-3 text-sm font-bold rounded-xl bg-rose-600 dark:bg-rose-400 text-white dark:text-zinc-950 outline-2 outline-offset-[-2px] outline-rose-600 dark:outline-rose-400 border-none cursor-pointer transition-all duration-300 shadow-sm flex items-center justify-center gap-2 hover:bg-transparent dark:hover:bg-transparent hover:text-rose-600 dark:hover:text-rose-300 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <RefreshCw className="w-4 h-4 transition-colors duration-300 stroke-[2.5]" /> 
                    <span>Clear Sidebar Options</span>
                  </button>

                </div>

              </div>

              {/* MOVED FOOTER: Next Steps directly under the config sidebar (hidden on guest/landing page) */}
              {!isGuest && (
                <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#212121]/50 shadow-sm flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest text-center">
                    Next Steps in Data Workflow
                  </span>
                  <div className="flex flex-col gap-2 w-full">
                    <button 
                      type="button"
                      onClick={() => setActiveTab("visualization")} 
                      className="w-full px-4 py-2.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex justify-center items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                    >
                      <LineChart className="w-4 h-4" /> Visualize Dataset
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveTab("model-training")} 
                      className="w-full px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-white flex justify-center items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                    >
                      <BrainCircuit className="w-4 h-4" /> Train ML Model
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT CONTAINER (Dataset Table Viewer & Tabbed Reports) */}
            <div className="lg:col-span-8 space-y-6 min-w-0">
              
              {/* DATASET TABLE VIEWER COMPONENT */}
              <DatasetTableViewer
                preview={preview}
                metadata={metadata}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                handleTableScroll={handleTableScroll}
                handleSort={handleSort}
                paginatedRows={paginatedRows}
                processedRows={processedRows}
                totalPages={totalPages}
              />

            {/* TABBED REPORTS PANEL */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm overflow-hidden">
              <div className="flex flex-wrap border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 px-3 pt-2 gap-2">
                <button
                  onClick={() => setActiveReportTab("profile")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors duration-150 cursor-pointer ${
                    activeReportTab === "profile" 
                      ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-extrabold" 
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  Dataset Profile Report
                </button>
                <button
                  onClick={() => setActiveReportTab("missing")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors duration-150 cursor-pointer ${
                    activeReportTab === "missing" 
                      ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-extrabold" 
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  Missing Value Report
                </button>
                <button
                  onClick={() => setActiveReportTab("duplicates")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors duration-150 cursor-pointer ${
                    activeReportTab === "duplicates" 
                      ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-extrabold" 
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  Duplicate & Type Report
                </button>
                <button
                  onClick={() => setActiveReportTab("outliers")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors duration-150 cursor-pointer ${
                    activeReportTab === "outliers" 
                      ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-extrabold" 
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  Outlier Report
                </button>
                <button
                  onClick={() => setActiveReportTab("compare")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors duration-150 cursor-pointer ${
                    activeReportTab === "compare" 
                      ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-extrabold" 
                      : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  Before & After Comparison
                </button>
                {cleanLogs.length > 0 && (
                  <button
                    onClick={() => setActiveReportTab("logs")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors duration-150 cursor-pointer ${
                      activeReportTab === "logs" 
                        ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400 font-extrabold" 
                        : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    Cleaning Log
                  </button>
                )}
              </div>

              <div className="p-6">
              {/* PROFILE REPORT */}
              {activeReportTab === "profile" && report && (
                  <div className="space-y-8 animate-fade-in">
                    
                    {/* Top Topline Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                      
                      {/* Quality Score Card - Clean Depth */}
                      <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 dark:text-zinc-400 mb-4">Data Quality Score</span>
                        {(() => {
                          const qualityScore = typeof report?.quality_score === "number" && !isNaN(report.quality_score) ? report.quality_score : 100;
                          const dashArray = 2 * Math.PI * 48;
                          const dashOffset = dashArray * (1 - qualityScore / 100);
                          return (
                            <div className="relative w-32 h-32 flex items-center justify-center">
                              <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-sm">
                                <circle cx="64" cy="64" r="48" strokeWidth="6" stroke="currentColor" fill="transparent" className="text-slate-200 dark:text-white/5" />
                                <circle cx="64" cy="64" r="48" strokeWidth="6.5" stroke="#9333ea" fill="transparent" strokeDasharray={dashArray} strokeDashoffset={dashOffset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                              </svg>
                              <div className="text-center flex flex-col items-center">
                                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{qualityScore}</span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">/ 100</span>
                              </div>
                            </div>
                          );
                        })()}
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-md mt-4 uppercase tracking-wider shadow-sm ${
                          (report?.quality_score ?? 100) >= 90 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30" :
                          (report?.quality_score ?? 100) >= 70 ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30" :
                          "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                        }`}>
                          {(report?.quality_score ?? 100) >= 90 ? "Premium" : (report?.quality_score ?? 100) >= 70 ? "Good" : "Needs Cleaning"}
                        </span>
                      </div>

                      {/* Mini Stats Grid - Clean Depth */}
                      <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: "Total Cells", val: (report.rows * report.columns).toLocaleString(), highlight: false },
                          { label: "Missing Cells", val: report.missing_summary?.total_missing?.toLocaleString(), highlight: true, color: "text-amber-500" },
                          { label: "Duplicate Rows", val: report.duplicate_summary?.duplicate_rows_count, highlight: true, color: "text-rose-500" },
                          { label: "Constant Columns", val: report.constant_columns?.length, highlight: false },
                          { label: "Low Variance Cols", val: report.low_variance_columns?.length, highlight: false },
                          { label: "Outliers Count", val: report.outlier_report?.reduce((acc, curr) => acc + curr.outlier_count, 0), highlight: true, color: "text-rose-500" }
                        ].map((stat, i) => (
                          <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm flex flex-col justify-center">
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{stat.label}</span>
                            <span className={`text-lg font-black ${stat.highlight && stat.val > 0 ? stat.color : "text-slate-900 dark:text-white"}`}>
                              {stat.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Numeric Statistics Table */}
                    {report.numeric_statistics && report.numeric_statistics.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <Info className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Numeric Statistics
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-100 dark:bg-zinc-900 font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">Column</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">Mean</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">Median</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">Mode</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">Min</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">Max</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">Std Dev</th>
                                <th className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">IQR</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-[#212121]">
                              {report.numeric_statistics.map((stat) => (
                                <tr key={stat.column} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-zinc-200">{stat.column}</td>
                                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 font-medium">{stat.mean?.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 font-medium">{stat.median?.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 font-medium">{stat.mode !== null ? stat.mode : "N/A"}</td>
                                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 font-medium">{stat.min}</td>
                                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 font-medium">{stat.max}</td>
                                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 font-medium">{stat.std?.toFixed(2)}</td>
                                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 font-medium">{stat.iqr?.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Correlation Matrix */}
                    {report.correlation_matrix && Object.keys(report.correlation_matrix).length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Correlation Matrix
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                          <table className="w-full text-center text-xs whitespace-nowrap">
                            <thead className="bg-slate-100 dark:bg-zinc-900 font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="px-4 py-3 text-left border-b border-slate-200 dark:border-zinc-800">Variable</th>
                                {Object.keys(report.correlation_matrix).map((k) => (
                                  <th key={k} className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-[#212121]">
                              {Object.entries(report.correlation_matrix).map(([rowKey, colValues]) => (
                                <tr key={rowKey}>
                                  <td className="px-4 py-3 font-bold text-left text-slate-800 dark:text-zinc-200 border-r border-slate-100 dark:border-zinc-800">{rowKey}</td>
                                  {Object.entries(colValues).map(([colKey, val]) => {
                                    const num = Number(val);
                                    let bg = "bg-transparent";
                                    let text = "text-slate-600 dark:text-zinc-400 font-medium";
                                    if (num > 0.7 && rowKey !== colKey) { bg = "bg-emerald-100 dark:bg-emerald-500/20"; text = "text-emerald-700 dark:text-emerald-400 font-bold"; }
                                    else if (num < -0.7) { bg = "bg-rose-100 dark:bg-rose-500/20"; text = "text-rose-700 dark:text-rose-400 font-bold"; }
                                    
                                    return (
                                      <td key={colKey} className={`px-4 py-3 ${bg} ${text} transition-colors`}>
                                        {num.toFixed(3)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* MISSING VALUE REPORT */}
              {activeReportTab === "missing" && report && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Missing Values Summary</h3>
                    <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-zinc-900 font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Column Name</th>
                            <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Missing Count</th>
                            <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Missing Percentage</th>
                            <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800 w-1/3">Proportion Bar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-[#212121]">
                          {report.missing_summary?.columns?.map((m) => (
                            <tr key={m.column} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3 font-bold text-slate-800 dark:text-zinc-200">{m.column}</td>
                              <td className="px-5 py-3 text-slate-600 dark:text-zinc-400 font-medium">{m.missing_count}</td>
                              <td className="px-5 py-3 text-slate-600 dark:text-zinc-400 font-medium">{m.missing_percent.toFixed(2)}%</td>
                              <td className="px-5 py-3">
                                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden shadow-inner">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${m.missing_percent > 50 ? "bg-rose-500" : m.missing_percent > 15 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${m.missing_percent}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* DUPLICATES REPORT */}
              {activeReportTab === "duplicates" && report && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm flex items-center justify-between">
                        <div>
                          <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider">Duplicate Rows</h4>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{report.duplicate_summary?.duplicate_rows_count}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500">({report.duplicate_summary?.duplicate_rows_percentage.toFixed(2)}%)</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center">
                          <Copy className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm flex items-center justify-between">
                        <div>
                          <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 tracking-wider">Duplicate Columns</h4>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{report.duplicate_summary?.duplicate_columns_count}</span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500">columns</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
                          <Copy className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Data Type Conversions</h3>
                      <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-100 dark:bg-zinc-900 font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Column</th>
                              <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Current Type</th>
                              <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Suggested Type</th>
                              <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-[#212121]">
                            {report.data_types?.map((item) => (
                              <tr key={item.column} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-5 py-3 font-bold text-slate-800 dark:text-zinc-200">{item.column}</td>
                                <td className="px-5 py-3 text-slate-500 dark:text-zinc-500 font-medium">{item.current_type}</td>
                                <td className="px-5 py-3 font-bold text-purple-600 dark:text-purple-400">{item.suggested_type}</td>
                                <td className="px-5 py-3">
                                  {item.conversion_needed ? (
                                    <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-extrabold text-[9px] uppercase tracking-wider">Conversion Needed</span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-zinc-400 font-extrabold text-[9px] uppercase tracking-wider">Up to date</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              {/* OUTLIER REPORT */}
              {activeReportTab === "outliers" && report && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Outlier Occurrences</h3>
                    <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-zinc-900 font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Column Name</th>
                            <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Outlier Count</th>
                            <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Method Used</th>
                            <th className="px-5 py-3 border-b border-slate-200 dark:border-zinc-800">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-[#212121]">
                          {report.outlier_report?.map((out) => (
                            <tr key={out.column} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3 font-bold text-slate-800 dark:text-zinc-200">{out.column}</td>
                              <td className={`px-5 py-3 font-bold ${out.outlier_count > 0 ? "text-rose-500" : "text-slate-500 dark:text-zinc-500"}`}>{out.outlier_count}</td>
                              <td className="px-5 py-3 text-slate-500 dark:text-zinc-500 font-medium">{out.method_used}</td>
                              <td className="px-5 py-3">
                                {out.outlier_count > 0 ? (
                                  <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 font-extrabold text-[9px] uppercase tracking-wider">Has Outliers</span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider">Clean</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* BEFORE AFTER COMPARISON */}
              {activeReportTab === "compare" && (
                  <div className="space-y-6 animate-fade-in">
                    {afterReport ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block mb-2">Quality Score</span>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-slate-400 dark:text-zinc-600 line-through font-bold text-sm">{beforeReport.quality_score}</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{afterReport.quality_score}</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-2 block uppercase tracking-wider">
                            ↑ +{afterReport.quality_score - beforeReport.quality_score} points
                          </span>
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block mb-2">Row Count</span>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-slate-400 dark:text-zinc-600 line-through font-bold text-sm">{beforeReport.rows}</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{afterReport.rows}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-extrabold mt-2 block uppercase tracking-wider">
                            {beforeReport.rows - afterReport.rows} rows removed
                          </span>
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block mb-2">Columns Count</span>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-slate-400 dark:text-zinc-600 line-through font-bold text-sm">{beforeReport.columns}</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{afterReport.columns}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-extrabold mt-2 block uppercase tracking-wider">
                            {beforeReport.columns - afterReport.columns} cols removed
                          </span>
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block mb-2">Missing Cells</span>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-slate-400 dark:text-zinc-600 line-through font-bold text-sm">{beforeReport.missing_summary?.total_missing}</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{afterReport.missing_summary?.total_missing}</span>
                          </div>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold mt-2 block uppercase tracking-wider">
                            ↓ {beforeReport.missing_summary?.total_missing - afterReport.missing_summary?.total_missing} nulls fixed
                          </span>
                        </div>

                      </div>
                    ) : (
                      <div className="p-10 text-center border-2 rounded-2xl border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-white/[0.02]">
                        <Info className="w-8 h-8 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">No active comparison</h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-2 leading-relaxed">
                          Configure cleaning parameters in the sidebar and trigger a clean operation to view before & after reports.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* CLEANING LOGS - Terminal Style */}
              {activeReportTab === "logs" && cleanLogs.length > 0 && (
                  <div className="space-y-3 animate-fade-in h-full">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Pipeline Execution Logs
                    </h3>
                    
                    {/* TERMINAL UI */}
                    <div className="rounded-xl bg-[#0d1117] border border-slate-800 overflow-hidden shadow-inner flex flex-col">
                      <div className="bg-[#161b22] border-b border-slate-800 px-4 py-2 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="ml-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest">stdout / pipeline_log.sh</span>
                      </div>
                      
                      <div className="p-5 font-mono text-[11px] sm:text-xs text-slate-300 space-y-2 max-h-80 overflow-y-auto">
                        {cleanLogs.map((log, idx) => {
                          const isSuccess = log.toLowerCase().includes("success") || log.toLowerCase().includes("completed") || log.toLowerCase().includes("done");
                          const isRemoved = log.toLowerCase().includes("removed") || log.toLowerCase().includes("dropped");
                          
                          return (
                            <div key={idx} className="flex items-start gap-3 leading-relaxed hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
                              <span className="text-purple-400 font-bold shrink-0 mt-0.5">➜</span>
                              <span className={`break-all ${isSuccess ? "text-emerald-400 font-semibold" : isRemoved ? "text-amber-400 font-semibold" : "text-slate-300"}`}>
                                {log}
                              </span>
                            </div>
                          )
                        })}
                        <div className="flex items-center gap-3 pt-2 opacity-50">
                          <span className="text-emerald-500 font-bold shrink-0">➜</span>
                          <span className="animate-pulse block w-2 h-4 bg-slate-400"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
      </div>
      </div>
    )}

  </div>
);
}
