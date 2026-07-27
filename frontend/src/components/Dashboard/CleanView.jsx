import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import FileUpload from "./FileUpload";
import RecentDatasetPanel from "../ui/RecentDatasetPanel";
import { BouncyAccordion } from "../ui/BouncyAccordion";
import RefreshButton from "../ui/RefreshButton";
import DatasetTableViewer from "../ui/DatasetTableViewer";
import { AnimatedCheckbox } from "../ui/AnimatedCheckbox";
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
  ShieldCheck
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
  isGuest = false
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

  useEffect(() => {
    if (!datasetId) {
      fetchCleanHistory();
    }
  }, [datasetId]);

  const fetchCleanHistory = async () => {
    setLoadingCleanHistory(true);
    try {
      const res = await api.get("history/");
      const seen = new Set();
      const cleaningJobs = res.data.filter(job => job.type === "cleaning" && job.dataset_id).filter(job => {
        if (seen.has(job.dataset_id)) return false;
        seen.add(job.dataset_id);
        return true;
      });
      setCleanHistoryList(cleaningJobs);
    } catch (err) {
      console.error("Failed to load cleaning history:", err);
    } finally {
      setLoadingCleanHistory(false);
    }
  };

  const handleUseFromHistory = async (job) => {
    setProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.get(`cleaning/${job.dataset_id}/preview/?offset=0&limit=100`);
      const data = res.data;
      
      setDatasetId(job.dataset_id);
      setMetadata(data.metadata);
      setPreview(data);
      if (job.before_stats) setBeforeReport(job.before_stats);
      if (job.after_stats) setAfterReport(job.after_stats);
      setReport(data.metadata || job.after_stats);
      if (job.logs) setCleanLogs(job.logs);

      setSuccessMsg(`Loaded cleaned dataset "${job.dataset_name}" from history!`);
    } catch (err) {
      setErrorMsg("Failed to load historical dataset details. The file might have been deleted.");
    } finally {
      setProcessing(false);
    }
  };

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

      setSuccessMsg("✓ File uploaded and profiled successfully!");
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED" || (err.message && err.message.includes("canceled"))) {
        setErrorMsg("Upload canceled.");
      } else {
        setErrorMsg(err.response?.data?.error || "Failed to upload and parse dataset. Check delimiter, rows format, or file corruption.");
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  // Clean handler
  const handleClean = async () => {
    if (!datasetId) return;
    setProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");

    const cleanConfig = {
      ...config,
      unwanted_columns: selectedUnwanted,
      type_conversion_columns: manualTypes
    };

    try {
      const res = await api.post(`cleaning/${datasetId}/clean/`, { config: cleanConfig });
      const data = res.data;
      
      setMetadata(data.metadata);
      setBeforeReport(data.before_report);
      setAfterReport(data.after_report);
      setReport(data.after_report);
      setPreview(data.preview);
      setCleanLogs(data.logs);
      setSelectedUnwanted([]);
      
      setActiveReportTab("compare");
      setSuccessMsg("✓ Dataset cleaned successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Cleaning operation failed.");
    } finally {
      setProcessing(false);
    }
  };

  // Smart Decide (RefineX Decide)
  const handleDecide = async () => {
    if (!datasetId) return;
    setProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.post(`cleaning/${datasetId}/decide/`, {});
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
      setErrorMsg(err.response?.data?.error || "RefineX Decide operation failed.");
    } finally {
      setProcessing(false);
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
      setSuccessMsg("✓ Dataset reset to original state.");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Reset failed.");
    } finally {
      setProcessing(false);
    }
  };

  // Download handler
  const handleDownload = (type) => {
    if (!datasetId) return;
    const url = `http://localhost:8000/api/cleaning/${datasetId}/download/?type=${type}`;
    window.open(url, "_blank");
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
    setSelectedUnwanted([]);
    setManualTypes({});
    setSuccessMsg("Sidebar configuration cleared.");
  };

  // Cleaning Configuration Accordion Items Definition
  const cleaningAccordionItems = [
    {
      id: "colNames",
      icon: <Type className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Column Names</span>,
      description: (
        <div className="space-y-2.5 text-[11px] select-none">
          <AnimatedCheckbox
            checked={config.standardize_column_names}
            onChange={(e) => setConfig({ ...config, standardize_column_names: e.target.checked })}
            label="Standardize Column Names"
            className="font-bold text-slate-800 dark:text-zinc-200"
          />
          
          {config.standardize_column_names && (
            <div className="pl-4 space-y-2 text-slate-600 dark:text-zinc-400 font-semibold text-[10.5px]">
              <AnimatedCheckbox
                checked={config.standardize_trim}
                onChange={(e) => setConfig({ ...config, standardize_trim: e.target.checked })}
                label="Trim leading/trailing spaces"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
              <AnimatedCheckbox
                checked={config.standardize_replace_spaces}
                onChange={(e) => setConfig({ ...config, standardize_replace_spaces: e.target.checked })}
                label={'Replace spaces with "_"'}
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
              <AnimatedCheckbox
                checked={config.standardize_lowercase}
                onChange={(e) => setConfig({ ...config, standardize_lowercase: e.target.checked })}
                label="Convert to lowercase"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
              <AnimatedCheckbox
                checked={config.standardize_remove_special}
                onChange={(e) => setConfig({ ...config, standardize_remove_special: e.target.checked })}
                label="Remove special characters"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
              <AnimatedCheckbox
                checked={config.standardize_replace_multiple_underscores}
                onChange={(e) => setConfig({ ...config, standardize_replace_multiple_underscores: e.target.checked })}
                label="Replace multiple underscores"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
              <AnimatedCheckbox
                checked={config.standardize_remove_outer_underscores}
                onChange={(e) => setConfig({ ...config, standardize_remove_outer_underscores: e.target.checked })}
                label="Remove leading/trailing '_'"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: "missing",
      icon: <HelpCircle className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Missing Values</span>,
      description: (
        <div className="space-y-2.5 text-[11px]">
          <AnimatedCheckbox
            checked={config.handle_missing_values}
            onChange={(e) => setConfig({ ...config, handle_missing_values: e.target.checked })}
            label="Handle Missing Values"
            className="font-bold text-slate-800 dark:text-zinc-200"
          />

          {config.handle_missing_values && (
            <div className="pl-4 space-y-2 text-slate-600 dark:text-zinc-400 font-semibold text-[10.5px]">
              <label className="block font-bold text-slate-800 dark:text-zinc-200">Imputation Strategy</label>
              <select
                value={config.missing_strategy}
                onChange={(e) => setConfig({ ...config, missing_strategy: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-semibold focus:outline-none text-slate-900 dark:text-white"
              >
                <option value="nothing">Do Nothing</option>
                <option value="remove_rows">Remove Rows</option>
                <option value="remove_cols">Remove Columns</option>
                <option value="fill_mean">Fill Mean (Numeric)</option>
                <option value="fill_median">Fill Median (Numeric)</option>
                <option value="fill_mode">Fill Mode</option>
                <option value="ffill">Forward Fill</option>
                <option value="bfill">Backward Fill</option>
                <option value="interpolate">Interpolation (Numeric)</option>
                <option value="custom_value">Custom Value</option>
              </select>

              {config.missing_strategy === "custom_value" && (
                <input
                  type="text"
                  placeholder="Type custom value..."
                  value={config.missing_custom_value}
                  onChange={(e) => setConfig({ ...config, missing_custom_value: e.target.value })}
                  className="w-full px-2 py-1.5 mt-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-semibold focus:outline-none text-slate-900 dark:text-white"
                />
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: "duplicates",
      icon: <Copy className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Duplicates</span>,
      description: (
        <div className="space-y-2.5 text-[11px] text-slate-800 dark:text-zinc-200">
          <AnimatedCheckbox
            checked={config.remove_duplicate_rows}
            onChange={(e) => setConfig({ ...config, remove_duplicate_rows: e.target.checked })}
            label="Remove Duplicate Rows"
            className="font-bold"
          />
          <AnimatedCheckbox
            checked={config.remove_duplicate_columns}
            onChange={(e) => setConfig({ ...config, remove_duplicate_columns: e.target.checked })}
            label="Remove Duplicate Columns"
            className="font-bold"
          />
        </div>
      )
    },
    {
      id: "numeric",
      icon: <Hash className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Numeric Cleaning</span>,
      description: (
        <div className="space-y-2.5 text-[11px]">
          <AnimatedCheckbox
            checked={config.clean_numeric_values}
            onChange={(e) => setConfig({ ...config, clean_numeric_values: e.target.checked })}
            label="Clean Numeric Columns"
            className="font-bold text-slate-800 dark:text-zinc-200"
          />
          <p className="text-[9.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium pl-6">
            Auto-extract numerical numbers. Cleans currency symbols (₹, $, €, £), percentages (%), spaces, and commas separator.
          </p>
        </div>
      )
    },
    {
      id: "text",
      icon: <FileText className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Text & Blank Cleaning</span>,
      description: (
        <div className="space-y-2.5 text-[11px]">
          <AnimatedCheckbox
            checked={config.text_cleaning}
            onChange={(e) => setConfig({ ...config, text_cleaning: e.target.checked })}
            label="Enable Text Cleaning"
            className="font-bold text-slate-800 dark:text-zinc-200"
          />

          {config.text_cleaning && (
            <div className="pl-4 space-y-2 text-slate-600 dark:text-zinc-400 font-semibold text-[10.5px]">
              <AnimatedCheckbox
                checked={config.text_trim}
                onChange={(e) => setConfig({ ...config, text_trim: e.target.checked })}
                label="Trim leading/trailing spaces"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
              <AnimatedCheckbox
                checked={config.text_remove_multiple_spaces}
                onChange={(e) => setConfig({ ...config, text_remove_multiple_spaces: e.target.checked })}
                label="Remove multiple spaces"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
              <AnimatedCheckbox
                checked={config.text_remove_html}
                onChange={(e) => setConfig({ ...config, text_remove_html: e.target.checked })}
                label="Remove HTML tags"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
              <AnimatedCheckbox
                checked={config.text_remove_emoji}
                onChange={(e) => setConfig({ ...config, text_remove_emoji: e.target.checked })}
                label="Remove emojis & non-ASCII"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />
              <AnimatedCheckbox
                checked={config.text_remove_tabs_newlines}
                onChange={(e) => setConfig({ ...config, text_remove_tabs_newlines: e.target.checked })}
                label="Remove tabs & newlines"
                className="font-semibold text-slate-800 dark:text-zinc-200"
              />

              <div className="space-y-1 mt-1">
                <label className="block font-bold text-slate-800 dark:text-zinc-200">Case Convert Mode</label>
                <select
                  value={config.text_case_mode}
                  onChange={(e) => setConfig({ ...config, text_case_mode: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="none">No case change</option>
                  <option value="upper">UPPERCASE</option>
                  <option value="lower">lowercase</option>
                  <option value="title">Title Case</option>
                  <option value="sentence">Sentence case</option>
                </select>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
            <AnimatedCheckbox
              checked={config.blank_value_detection}
              onChange={(e) => setConfig({ ...config, blank_value_detection: e.target.checked })}
              label="Blank Value Detection"
              className="font-bold text-slate-800 dark:text-zinc-200"
            />
            <p className="text-[9px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium pl-6 mt-0.5">
              Treat cell strings like "NA", "N/A", "NULL", "null", "--", "-", "Unknown", "None", spaces as Missing (NaN).
            </p>
          </div>
        </div>
      )
    },
    {
      id: "types",
      icon: <Layers className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Columns & Type Casting</span>,
      description: (
        <div className="space-y-2.5 text-[11px]">
          <div>
            <span className="font-bold text-slate-800 dark:text-zinc-200 block mb-1">Remove Columns</span>
            <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-lg p-2 space-y-1 bg-slate-50/50 dark:bg-zinc-900/50">
              {preview?.columns?.map(col => (
                <label key={col} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={selectedUnwanted.includes(col)}
                    onChange={() => handleUnwantedToggle(col)}
                    className="rounded text-[9px] cursor-pointer"
                  />
                  {col}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
<AnimatedCheckbox
            checked={config.data_type_conversion}
            onChange={(e) => setConfig({ ...config, data_type_conversion: e.target.checked })}
            label="Convert Data Types"
            className="font-bold text-slate-800 dark:text-zinc-200"
          />
            
            {config.data_type_conversion && (
              <div className="pl-4 mt-2 space-y-2">
                <label className="block font-bold text-slate-800 dark:text-zinc-200">Conversion Mode</label>
                <select
                  value={config.type_conversion_mode}
                  onChange={(e) => setConfig({ ...config, type_conversion_mode: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-semibold focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="auto">Auto-Detect types</option>
                  <option value="manual">Manual casting</option>
                </select>

                {config.type_conversion_mode === "manual" && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border p-1.5 rounded-lg bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    {preview?.columns?.map((col) => (
                      <div key={col} className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-600 dark:text-zinc-400 truncate max-w-[80px]">{col}</span>
                        <select
                          value={manualTypes[col] || "string"}
                          onChange={(e) => handleManualTypeChange(col, e.target.value)}
                          className="px-1.5 py-0.5 border rounded bg-transparent font-medium border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 cursor-pointer text-[10px]"
                        >
                          <option value="string">String</option>
                          <option value="integer">Integer</option>
                          <option value="float">Float</option>
                          <option value="datetime">Datetime</option>
                          <option value="boolean">Boolean</option>
                          <option value="category">Category</option>
                        </select>
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
      icon: <AlertTriangle className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Outlier Handling</span>,
      description: (
        <div className="space-y-2.5 text-[11px]">
          <div>
            <label className="block font-bold mb-1 text-slate-800 dark:text-zinc-200">Handling Strategy</label>
            <select
              value={config.outlier_strategy}
              onChange={(e) => setConfig({ ...config, outlier_strategy: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-semibold focus:outline-none text-slate-900 dark:text-white"
            >
              <option value="ignore">Ignore / Do nothing</option>
              <option value="remove">Remove Outlier Rows</option>
              <option value="cap">Cap Outliers (Boundaries)</option>
              <option value="replace_mean">Replace with Mean</option>
              <option value="replace_median">Replace with Median</option>
            </select>
          </div>

          {config.outlier_strategy !== "ignore" && (
            <div>
              <label className="block font-bold mb-1 text-slate-800 dark:text-zinc-200">Assessment Method</label>
              <select
                value={config.outlier_method}
                onChange={(e) => setConfig({ ...config, outlier_method: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-semibold focus:outline-none text-slate-900 dark:text-white"
              >
                <option value="iqr">IQR (1.5 IQR range)</option>
                <option value="z_score">Z-Score (3.0 StdDev)</option>
              </select>
            </div>
          )}
        </div>
      )
    },
    {
      id: "dateDecimal",
      icon: <Calendar className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Dates & Decimals</span>,
      description: (
        <div className="space-y-3 text-[11px]">
          <div>
            <AnimatedCheckbox
              checked={config.date_formatting}
              onChange={(e) => setConfig({ ...config, date_formatting: e.target.checked })}
              label="Format Dates"
              className="font-bold text-slate-800 dark:text-zinc-200"
            />
            {config.date_formatting && (
              <select
                value={config.date_format}
                onChange={(e) => setConfig({ ...config, date_format: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-semibold focus:outline-none text-slate-900 dark:text-white"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
            <AnimatedCheckbox
              checked={config.decimal_formatting}
              onChange={(e) => setConfig({ ...config, decimal_formatting: e.target.checked })}
              label="Decimal Rounding"
              className="font-bold text-slate-800 dark:text-zinc-200"
            />
            {config.decimal_formatting && (
              <select
                value={config.decimal_format}
                onChange={(e) => setConfig({ ...config, decimal_format: e.target.value })}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-semibold focus:outline-none text-slate-900 dark:text-white"
              >
                <option value="none">No Rounding</option>
                <option value="2">2 Decimal Places</option>
                <option value="3">3 Decimal Places</option>
                <option value="4">4 Decimal Places</option>
              </select>
            )}
          </div>
        </div>
      )
    },
    {
      id: "variance",
      icon: <Filter className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Columns Filter</span>,
      description: (
        <div className="space-y-2.5 text-[11px] text-slate-800 dark:text-zinc-200">
          <AnimatedCheckbox
            checked={config.remove_constant_columns}
            onChange={(e) => setConfig({ ...config, remove_constant_columns: e.target.checked })}
            label="Remove Constant Columns"
            className="font-bold"
          />

          <AnimatedCheckbox
            checked={config.remove_low_variance_columns}
            onChange={(e) => setConfig({ ...config, remove_low_variance_columns: e.target.checked })}
            label="Remove Low Variance Columns"
            className="font-bold"
          />

          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
            <AnimatedCheckbox
              checked={config.remove_high_missing_columns}
              onChange={(e) => setConfig({ ...config, remove_high_missing_columns: e.target.checked })}
              label="Remove High-Null Columns"
              className="font-bold"
            />
            {config.remove_high_missing_columns && (
              <div className="pl-4 space-y-1.5">
                <div className="flex justify-between font-bold text-[10px] text-slate-500">
                  <span>Threshold</span>
                  <span className="text-primary font-black">{config.missing_threshold}% Nulls</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  step="5"
                  value={config.missing_threshold}
                  onChange={(e) => setConfig({ ...config, missing_threshold: Number(e.target.value) })}
                  className="w-full h-2 rounded-lg bg-slate-200 dark:bg-zinc-800 appearance-none cursor-pointer accent-primary [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-zinc-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-95"
                />
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: "invalid",
      icon: <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-zinc-400" />,
      title: <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Validations & Encoding</span>,
      description: (
        <div className="space-y-3 text-[11px]">
          <div>
            <AnimatedCheckbox
              checked={config.remove_invalid_values}
              onChange={(e) => setConfig({ ...config, remove_invalid_values: e.target.checked })}
              label="Remove Invalid Values"
              className="font-bold text-slate-800 dark:text-zinc-200"
            />
            <p className="text-[9px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium pl-6 mt-0.5">
              Clean values like negative Age/Salary, malformed Email addresses, invalid phone formatting, or impossible dates.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
            <AnimatedCheckbox
              checked={config.reset_index}
              onChange={(e) => setConfig({ ...config, reset_index: e.target.checked })}
              label="Reset Row Index (0 to N)"
              className="font-bold text-slate-800 dark:text-zinc-200"
            />
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-400">
            <label className="block font-bold text-slate-800 dark:text-zinc-200 mb-1">Import File Encoding</label>
            <select
              value={config.encoding}
              onChange={(e) => setConfig({ ...config, encoding: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg font-semibold focus:outline-none text-slate-900 dark:text-white"
            >
              <option value="UTF-8">Auto-Detect / UTF-8</option>
              <option value="ASCII">ASCII</option>
              <option value="Latin-1">Latin-1 (ISO-8859-1)</option>
              <option value="UTF-16">UTF-16</option>
            </select>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={`space-y-6 text-slate-800 dark:text-zinc-100 pb-10 animate-fade-in font-sans ${!datasetId ? "max-w-7xl mx-auto" : "max-w-full"}`}>
      
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
              acceptedFormats={[".csv", ".xlsx", ".xls", ".json"]}
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
          {!uploading && !isGuest && cleanHistoryList.length > 0 && (
            <div className="lg:col-span-4 w-full">
              <RecentDatasetPanel
                items={cleanHistoryList}
                onSelect={(item) => handleUseFromHistory(item)}
                onViewAll={() => setActiveTab("history")}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* WORKSPACE LAYOUT (25% Left Sidebar / 75% Right Content Area) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT 25% STICKY SIDEBAR (Cleaning Configuration Options) */}
            <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-4 z-10 max-h-[calc(100vh-60px)] overflow-y-auto pr-1">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm">
                <h2 className="text-xs font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-150 dark:border-zinc-850 mb-3">
                  <Settings className="w-4 h-4 text-primary" /> Cleaning Configuration
                </h2>

                <BouncyAccordion
                  items={cleaningAccordionItems}
                  value={activeAccordion}
                  onValueChange={(val) => setActiveAccordion(val)}
                  collapsible={true}
                  classNames={{
                    trigger: "py-2.5 px-3.5 min-h-[44px]",
                    description: "p-3.5"
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

              {/* MOVED FOOTER: Next Steps directly under the config sidebar */}
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
            </div>

            {/* RIGHT 75% CONTAINER (Dataset Table Viewer & Tabbed Reports) */}
            <div className="lg:col-span-9 space-y-6">
              
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

            {/* TABED REPORTS PANEL */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm overflow-hidden">
              <div className="flex flex-wrap border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 px-2 pt-2">
                <button
                  onClick={() => setActiveReportTab("profile")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 cursor-pointer ${
                    activeReportTab === "profile" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Dataset Profile Report
                </button>
                <button
                  onClick={() => setActiveReportTab("missing")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 cursor-pointer ${
                    activeReportTab === "missing" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Missing Value Report
                </button>
                <button
                  onClick={() => setActiveReportTab("duplicates")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 cursor-pointer ${
                    activeReportTab === "duplicates" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Duplicate & Type Report
                </button>
                <button
                  onClick={() => setActiveReportTab("outliers")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 cursor-pointer ${
                    activeReportTab === "outliers" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Outlier Report
                </button>
                <button
                  onClick={() => setActiveReportTab("compare")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 cursor-pointer ${
                    activeReportTab === "compare" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Before & After Comparison
                </button>
                {cleanLogs.length > 0 && (
                  <button
                    onClick={() => setActiveReportTab("logs")}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 cursor-pointer ${
                      activeReportTab === "logs" 
                        ? "border-primary text-primary" 
                        : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Cleaning Log
                  </button>
                )}
              </div>

              <div className="p-6">
                
                {/* PROFILE REPORT */}
                {activeReportTab === "profile" && report && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-900/10">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3">Data Quality Score</span>
                        {(() => {
                          const qualityScore = typeof report?.quality_score === "number" && !isNaN(report.quality_score) ? report.quality_score : 100;
                          const dashArray = 2 * Math.PI * 48;
                          const dashOffset = dashArray * (1 - qualityScore / 100);
                          return (
                            <div className="relative w-28 h-28 flex items-center justify-center">
                              <svg className="absolute w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="48" strokeWidth="6" stroke="var(--border)" fill="transparent" className="text-slate-100 dark:text-zinc-800" />
                                <circle cx="56" cy="56" r="48" strokeWidth="6.5" stroke="#673ab7" fill="transparent" strokeDasharray={dashArray} strokeDashoffset={dashOffset} className="transition-all duration-1000 ease-out" />
                              </svg>
                              <div className="text-center">
                                <span className="text-2xl font-black text-black dark:text-white">{qualityScore}</span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block">/ 100</span>
                              </div>
                            </div>
                          );
                        })()}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-3 uppercase tracking-wide ${
                          (report?.quality_score ?? 100) >= 90 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" :
                          (report?.quality_score ?? 100) >= 70 ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" :
                          "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                        }`}>
                          {(report?.quality_score ?? 100) >= 90 ? "Premium" : (report?.quality_score ?? 100) >= 70 ? "Good" : "Needs Cleaning"}
                        </span>
                      </div>

                      <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Total Cells</span>
                          <span className="text-sm font-black text-black dark:text-white">{(report.rows * report.columns).toLocaleString()}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Missing Cells</span>
                          <span className="text-sm font-black text-slate-700 dark:text-zinc-300">{report.missing_summary?.total_missing?.toLocaleString()}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Duplicate Rows</span>
                          <span className="text-sm font-black text-slate-700 dark:text-zinc-300">{report.duplicate_summary?.duplicate_rows_count}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Constant Columns</span>
                          <span className="text-sm font-black text-slate-700 dark:text-zinc-300">{report.constant_columns?.length}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Low Variance Cols</span>
                          <span className="text-sm font-black text-slate-700 dark:text-zinc-300">{report.low_variance_columns?.length}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Outliers Count</span>
                          <span className="text-sm font-black text-slate-700 dark:text-zinc-300 text-rose-500">
                            {report.outlier_report?.reduce((acc, curr) => acc + curr.outlier_count, 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {report.numeric_statistics && report.numeric_statistics.length > 0 && (
                      <div className="space-y-3 pt-3">
                        <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5"><Info className="w-4 h-4 text-primary" /> Numeric Statistics Report</h3>
                        <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
                          <table className="w-full text-left text-[10px]">
                            <thead className="bg-slate-50 dark:bg-zinc-900 font-bold text-slate-650 dark:text-zinc-400">
                              <tr>
                                <th className="px-3.5 py-2.5">Column</th>
                                <th className="px-3.5 py-2.5">Mean</th>
                                <th className="px-3.5 py-2.5">Median</th>
                                <th className="px-3.5 py-2.5">Mode</th>
                                <th className="px-3.5 py-2.5">Min</th>
                                <th className="px-3.5 py-2.5">Max</th>
                                <th className="px-3.5 py-2.5">Std Dev</th>
                                <th className="px-3.5 py-2.5">IQR</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                              {report.numeric_statistics.map((stat) => (
                                <tr key={stat.column} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                                  <td className="px-3.5 py-2.5 font-bold text-slate-750 dark:text-zinc-300">{stat.column}</td>
                                  <td className="px-3.5 py-2.5 font-semibold">{stat.mean?.toFixed(2)}</td>
                                  <td className="px-3.5 py-2.5 font-semibold">{stat.median?.toFixed(2)}</td>
                                  <td className="px-3.5 py-2.5 font-semibold">{stat.mode !== null ? stat.mode : "N/A"}</td>
                                  <td className="px-3.5 py-2.5 font-semibold">{stat.min}</td>
                                  <td className="px-3.5 py-2.5 font-semibold">{stat.max}</td>
                                  <td className="px-3.5 py-2.5 font-semibold">{stat.std?.toFixed(2)}</td>
                                  <td className="px-3.5 py-2.5 font-semibold">{stat.iqr?.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {report.correlation_matrix && Object.keys(report.correlation_matrix).length > 0 && (
                      <div className="space-y-3 pt-3">
                        <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Correlation Matrix</h3>
                        <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
                          <table className="w-full text-center text-[10px]">
                            <thead className="bg-slate-50 dark:bg-zinc-900 font-bold text-slate-650 dark:text-zinc-400">
                              <tr>
                                <th className="px-3 py-2 text-left">Variable</th>
                                {Object.keys(report.correlation_matrix).map((k) => (
                                  <th key={k} className="px-3 py-2">{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                              {Object.entries(report.correlation_matrix).map(([rowKey, colValues]) => (
                                <tr key={rowKey}>
                                  <td className="px-3 py-2.5 font-bold text-left text-slate-700 dark:text-zinc-300">{rowKey}</td>
                                  {Object.entries(colValues).map(([colKey, val]) => {
                                    const num = Number(val);
                                    let bg = "bg-transparent";
                                    let text = "text-inherit";
                                    if (num > 0.7) { bg = "bg-emerald-500/20"; text = "text-emerald-600 dark:text-emerald-400 font-bold"; }
                                    else if (num < -0.7) { bg = "bg-rose-500/20"; text = "text-rose-600 dark:text-rose-400 font-bold"; }
                                    else if (Math.abs(num) > 0.3) { bg = "bg-indigo-500/10"; }
                                    return (
                                      <td key={colKey} className={`px-3 py-2.5 ${bg} ${text}`}>
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
                    <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Missing Values Summary</h3>
                    <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 dark:bg-zinc-900 font-bold text-slate-650 dark:text-zinc-400">
                          <tr>
                            <th className="px-4 py-3">Column Name</th>
                            <th className="px-4 py-3">Missing Count</th>
                            <th className="px-4 py-3">Missing Percentage</th>
                            <th className="px-4 py-3">Proportion Bar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {report.missing_summary?.columns?.map((m) => (
                            <tr key={m.column} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                              <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-zinc-300">{m.column}</td>
                              <td className="px-4 py-2.5 font-semibold">{m.missing_count}</td>
                              <td className="px-4 py-2.5 font-semibold">{m.missing_percent.toFixed(2)}%</td>
                              <td className="px-4 py-2.5 w-1/3">
                                <div className="w-full h-2 rounded bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                  <div 
                                    className={`h-full rounded ${m.missing_percent > 50 ? "bg-rose-500" : m.missing_percent > 15 ? "bg-amber-500" : "bg-emerald-500"}`}
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
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-950/10">
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duplicate Rows</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-xl font-black text-black dark:text-white">{report.duplicate_summary?.duplicate_rows_count}</span>
                          <span className="text-xs text-slate-550 dark:text-zinc-500">rows ({report.duplicate_summary?.duplicate_rows_percentage.toFixed(2)}%)</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-950/10">
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duplicate Columns</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-xl font-black text-black dark:text-white">{report.duplicate_summary?.duplicate_columns_count}</span>
                          <span className="text-xs text-slate-550 dark:text-zinc-500">columns</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Data Type Conversions</h3>
                      <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 dark:bg-zinc-900 font-bold text-slate-650 dark:text-zinc-400">
                            <tr>
                              <th className="px-4 py-3">Column</th>
                              <th className="px-4 py-3">Current Type</th>
                              <th className="px-4 py-3">Suggested Type</th>
                              <th className="px-4 py-3">Conversion Needed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {report.data_types?.map((item) => (
                              <tr key={item.column} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                                <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-zinc-300">{item.column}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-zinc-500">{item.current_type}</td>
                                <td className="px-4 py-2.5 font-semibold text-primary">{item.suggested_type}</td>
                                <td className="px-4 py-2.5">
                                  {item.conversion_needed ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wide">Suggested</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 dark:bg-zinc-900 dark:text-zinc-500 text-[9px] uppercase">Up to date</span>
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
                    <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Outlier Occurrences</h3>
                    <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 dark:bg-zinc-900 font-bold text-slate-650 dark:text-zinc-400">
                          <tr>
                            <th className="px-4 py-3">Column Name</th>
                            <th className="px-4 py-3">Outlier Count</th>
                            <th className="px-4 py-3">Method Used</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {report.outlier_report?.map((out) => (
                            <tr key={out.column} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                              <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-zinc-300">{out.column}</td>
                              <td className="px-4 py-2.5 font-semibold text-rose-500">{out.outlier_count}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-500">{out.method_used}</td>
                              <td className="px-4 py-2.5">
                                {out.outlier_count > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 font-bold text-[9px] uppercase tracking-wide">Has Outliers</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wide">Clean</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* MISSING VALUE REPORT */}
                {activeReportTab === "missing" && report && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Missing Values Summary</h3>
                    <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 dark:bg-zinc-900 font-bold text-slate-650 dark:text-zinc-400">
                          <tr>
                            <th className="px-4 py-3">Column Name</th>
                            <th className="px-4 py-3">Missing Count</th>
                            <th className="px-4 py-3">Missing Percentage</th>
                            <th className="px-4 py-3">Proportion Bar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {report.missing_summary?.columns?.map((m) => (
                            <tr key={m.column} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                              <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-zinc-300">{m.column}</td>
                              <td className="px-4 py-2.5 font-semibold">{m.missing_count}</td>
                              <td className="px-4 py-2.5 font-semibold">{m.missing_percent.toFixed(2)}%</td>
                              <td className="px-4 py-2.5 w-1/3">
                                <div className="w-full h-2 rounded bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                  <div 
                                    className={`h-full rounded ${m.missing_percent > 50 ? "bg-rose-500" : m.missing_percent > 15 ? "bg-amber-500" : "bg-emerald-500"}`}
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
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-950/10">
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duplicate Rows</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-xl font-black text-black dark:text-white">{report.duplicate_summary?.duplicate_rows_count}</span>
                          <span className="text-xs text-slate-550 dark:text-zinc-500">rows ({report.duplicate_summary?.duplicate_rows_percentage.toFixed(2)}%)</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-950/10">
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duplicate Columns</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-xl font-black text-black dark:text-white">{report.duplicate_summary?.duplicate_columns_count}</span>
                          <span className="text-xs text-slate-550 dark:text-zinc-500">columns</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Data Type Conversions</h3>
                      <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 dark:bg-zinc-900 font-bold text-slate-650 dark:text-zinc-400">
                            <tr>
                              <th className="px-4 py-3">Column</th>
                              <th className="px-4 py-3">Current Type</th>
                              <th className="px-4 py-3">Suggested Type</th>
                              <th className="px-4 py-3">Conversion Needed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                            {report.data_types?.map((item) => (
                              <tr key={item.column} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                                <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-zinc-300">{item.column}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-zinc-500">{item.current_type}</td>
                                <td className="px-4 py-2.5 font-semibold text-primary">{item.suggested_type}</td>
                                <td className="px-4 py-2.5">
                                  {item.conversion_needed ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wide">Suggested</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 dark:bg-zinc-900 dark:text-zinc-500 text-[9px] uppercase">Up to date</span>
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
                    <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Outlier Occurrences</h3>
                    <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 dark:bg-zinc-900 font-bold text-slate-650 dark:text-zinc-400">
                          <tr>
                            <th className="px-4 py-3">Column Name</th>
                            <th className="px-4 py-3">Outlier Count</th>
                            <th className="px-4 py-3">Method Used</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {report.outlier_report?.map((out) => (
                            <tr key={out.column} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                              <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-zinc-300">{out.column}</td>
                              <td className="px-4 py-2.5 font-semibold text-rose-500">{out.outlier_count}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-500">{out.method_used}</td>
                              <td className="px-4 py-2.5">
                                {out.outlier_count > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 font-bold text-[9px] uppercase tracking-wide">Has Outliers</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wide">Clean</span>
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
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-950/20">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Quality Score Change</span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-slate-500 line-through font-bold text-xs">{beforeReport.quality_score}/100</span>
                            <span className="text-lg font-black text-black dark:text-white">{afterReport.quality_score}/100</span>
                          </div>
                          <span className="text-[9.5px] text-emerald-500 font-bold mt-1 block">
                            ↑ Improved by {afterReport.quality_score - beforeReport.quality_score} points
                          </span>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-950/20">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Row Count</span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-slate-500 line-through font-bold text-xs">{beforeReport.rows}</span>
                            <span className="text-lg font-black text-black dark:text-white">{afterReport.rows}</span>
                          </div>
                          <span className="text-[9.5px] text-slate-550 dark:text-zinc-500 font-semibold mt-1 block">
                            {beforeReport.rows - afterReport.rows} rows removed
                          </span>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-950/20">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Columns Count</span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-slate-500 line-through font-bold text-xs">{beforeReport.columns}</span>
                            <span className="text-lg font-black text-black dark:text-white">{afterReport.columns}</span>
                          </div>
                          <span className="text-[9.5px] text-slate-550 dark:text-zinc-500 font-semibold mt-1 block">
                            {beforeReport.columns - afterReport.columns} columns removed
                          </span>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-950/20">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Missing Cells</span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-slate-500 line-through font-bold text-xs">{beforeReport.missing_summary?.total_missing}</span>
                            <span className="text-lg font-black text-black dark:text-white">{afterReport.missing_summary?.total_missing}</span>
                          </div>
                          <span className="text-[9.5px] text-emerald-500 font-semibold mt-1 block">
                            Cleaned {beforeReport.missing_summary?.total_missing - afterReport.missing_summary?.total_missing} null values
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center border rounded-xl border-dashed border-slate-200 dark:border-zinc-800 bg-[#fafafa]/30 dark:bg-zinc-950/5">
                        <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-black dark:text-white">No active comparison</h4>
                        <p className="text-[11px] text-slate-550 dark:text-zinc-400 max-w-xs mx-auto mt-1">
                          Configure cleaning parameters in the sidebar and trigger a clean operation to view before & after reports.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* CLEANING LOGS */}
                {activeReportTab === "logs" && cleanLogs.length > 0 && (
                  <div className="space-y-3 animate-fade-in">
                    <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-4.5 h-4.5 text-primary" /> Active Job Pipeline Execution Logs</h3>
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10 font-mono text-[10px] text-slate-700 dark:text-zinc-350 space-y-1.5 max-h-60 overflow-y-auto">
                      {cleanLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 px-2 py-1 rounded transition-colors duration-150 cursor-default text-slate-700 dark:text-zinc-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                          <span className="font-mono text-sm break-all">{log}</span>
                        </div>
                      ))}
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
