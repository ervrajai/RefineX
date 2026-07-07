import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import {
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  Settings,
  HelpCircle,
  ArrowUpDown,
  LayoutGrid,
  FileText
} from "lucide-react";

export default function CleanView() {
  // File state
  const [datasetId, setDatasetId] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [report, setReport] = useState(null);
  const [preview, setPreview] = useState(null);
  const [beforeReport, setBeforeReport] = useState(null);
  const [afterReport, setAfterReport] = useState(null);
  const [cleanLogs, setCleanLogs] = useState([]);
  
  // Loading states
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  // 18 Cleaning configurations state
  const [config, setConfig] = useState({
    // 1 Column Name Cleaning
    standardize_column_names: false,
    standardize_trim: true,
    standardize_replace_spaces: true,
    standardize_lowercase: true,
    standardize_remove_special: true,
    standardize_replace_multiple_underscores: true,
    standardize_remove_outer_underscores: true,
    
    // 2 Missing Values
    handle_missing_values: false,
    missing_strategy: "nothing",
    missing_custom_value: "",
    
    // 3 Duplicate Rows
    remove_duplicate_rows: false,
    
    // 4 Duplicate Columns
    remove_duplicate_columns: false,
    
    // 5 Numeric Cleaning
    clean_numeric_values: false,
    
    // 6 Text Cleaning
    text_cleaning: false,
    text_trim: true,
    text_remove_multiple_spaces: false,
    text_remove_html: false,
    text_remove_emoji: false,
    text_remove_tabs_newlines: false,
    text_case_mode: "none",
    
    // 7 Blank Value Detection
    blank_value_detection: true,
    
    // 8 Data Type Conversion
    data_type_conversion: false,
    type_conversion_mode: "auto",
    
    // 9 Outlier Handling
    outlier_strategy: "ignore",
    outlier_method: "iqr",
    
    // 10 Date Formatting
    date_formatting: false,
    date_format: "YYYY-MM-DD",
    
    // 11 Decimal Formatting
    decimal_formatting: false,
    decimal_format: "none",
    
    // 12 Remove Constant Columns
    remove_constant_columns: false,
    
    // 13 Remove High Missing Columns
    remove_high_missing_columns: false,
    missing_threshold: 90,
    
    // 14 Remove Low Variance Columns
    remove_low_variance_columns: false,
    
    // 15 Invalid Values
    remove_invalid_values: false,
    
    // 16 Remove Unwanted Columns
    remove_unwanted_columns: false,
    
    // 17 Reset Index
    reset_index: false,
    
    // 18 Encoding
    encoding: "UTF-8"
  });

  // Collapsible sidebar sections
  const [expandedCards, setExpandedCards] = useState({
    colNames: true,
    missing: false,
    duplicates: false,
    numeric: false,
    text: false,
    types: false,
    outliers: false,
    dateDecimal: false,
    variance: false,
    invalid: false
  });

  const fileInputRef = useRef(null);

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

  const toggleCard = (key) => {
    setExpandedCards(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  // Upload handler
  const uploadFile = async (file) => {
    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("cleaning/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
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
      
      // Auto-populate manual conversion mapping based on profile
      const mapping = {};
      data.report.data_types.forEach(item => {
        mapping[item.column] = "string";
      });
      setManualTypes(mapping);

      setSuccessMsg("✓ File uploaded and profiled successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to upload and parse dataset. Check file size/corruption.");
    } finally {
      setUploading(false);
    }
  };

  // Analyze handler
  const handleAnalyze = async () => {
    if (!datasetId) return;
    setProcessing(true);
    setErrorMsg("");
    
    try {
      const res = await api.get(`cleaning/${datasetId}/analyze/`);
      setReport(res.data.report);
      setPreview(res.data.preview);
      if (!afterReport) {
        setBeforeReport(res.data.report);
      } else {
        setAfterReport(res.data.report);
      }
      setSuccessMsg("✓ Dataset analyzed successfully.");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Analysis failed.");
    } finally {
      setProcessing(false);
    }
  };

  // Clean handler
  const handleClean = async () => {
    if (!datasetId) return;
    setProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Package config
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
      setReport(data.after_report); // Update report to cleaned stats
      setPreview(data.preview);
      setCleanLogs(data.logs);
      
      // Update list of unwanted columns selection since they're gone now
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
      
      // Sync UI toggles with automated decisions
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
      
      // Reset configs
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
    // Fetch with credentials/cookie or simply navigate/window open
    // Since this is a file download API, standard browser navigation triggers file download.
    // If sessions/auth is cookie-based, this works perfectly out-of-the-box.
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

    // Apply simple Search Query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(row => {
        return Object.values(row).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(query)
        );
      });
    }

    // Apply Sorting
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

  return (
    <div className="space-y-6 text-slate-800 dark:text-zinc-100 max-w-full pb-10 animate-fade-in font-sans">
      
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
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Dataset Cleaning Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Analyze, clean, and standardize datasets. Maximize data quality score instantly.
          </p>
          
          {metadata && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">
              <span className="flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> {metadata.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] uppercase font-bold text-primary">{metadata.file_type}</span>
              <span>• Rows: <strong className="text-black dark:text-white">{metadata.rows}</strong></span>
              <span>• Columns: <strong className="text-black dark:text-white">{metadata.columns}</strong></span>
              <span>• Size: <strong className="text-black dark:text-white">{formatSize(metadata.file_size)}</strong></span>
              <span>• Encoding: <strong className="text-black dark:text-white">{metadata.encoding}</strong></span>
            </div>
          )}
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {datasetId && (
            <>
              <button
                onClick={handleAnalyze}
                disabled={processing}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition duration-150 disabled:opacity-50"
                title="Profile current dataset"
              >
                Analyze Dataset
              </button>

              <button
                onClick={handleClean}
                disabled={processing}
                className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition duration-150 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                title="Execute manual config"
              >
                {processing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Clean Dataset
              </button>

              <button
                onClick={handleDecide}
                disabled={processing}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl transition duration-150 shadow-md disabled:opacity-50 flex items-center gap-1.5"
                title="Run RefineX automated heuristic cleaning pipeline"
              >
                ✨ RefineX Decide
              </button>

              <div className="relative group">
                <button className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition duration-150 flex items-center gap-1">
                  <FileDown className="w-3.5 h-3.5" /> Download
                </button>
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl shadow-xl w-40 overflow-hidden py-1">
                  <button onClick={() => handleDownload("csv")} className="w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-850">Clean CSV</button>
                  <button onClick={() => handleDownload("excel")} className="w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-850">Clean Excel</button>
                  <button onClick={() => handleDownload("report")} className="w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-850">Cleaning Report</button>
                  <button onClick={() => handleDownload("log")} className="w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-850">Cleaning Log</button>
                </div>
              </div>

              <button
                onClick={handleReset}
                disabled={processing}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-rose-500/20 text-rose-600 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 transition duration-150 disabled:opacity-50"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* NO DATASET / UPLOADER STATE */}
      {!datasetId ? (
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`p-10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center transition duration-300 min-h-[400px] bg-white dark:bg-[#121212]/30 ${
            uploading ? "border-primary bg-primary/5" : "border-slate-350 dark:border-zinc-800 hover:border-primary dark:hover:border-zinc-700"
          }`}
        >
          <div className="p-4 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 mb-4 animate-pulse">
            <UploadCloud className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-base font-bold text-black dark:text-white">
            {uploading ? "Uploading and profiling dataset..." : "Drag & Drop dataset file"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-2 leading-relaxed">
            Support CSV or Excel (.xlsx, .xls) files. Files up to 100,000+ rows are profiled using optimized Pandas logic.
          </p>
          
          {!uploading && (
            <button
              onClick={() => fileInputRef.current.click()}
              className="mt-5 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-full transition duration-150 shadow-md active:scale-95 cursor-pointer"
            >
              Browse Files
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, .xlsx, .xls"
            className="hidden"
          />
        </div>
      ) : (
        /* WORKSPACE LAYOUT: 75% Left, 25% Right Sidebar */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* LEFT 75% CONTAINER */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* DATASET VIEWER */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm overflow-hidden flex flex-col">
              
              {/* Viewer Controls */}
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-950/20">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary"><LayoutGrid className="w-4 h-4" /></span>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Interactive Preview <span className="font-semibold text-slate-400 dark:text-zinc-500">(Displaying first 100 rows)</span></span>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search preview rows..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:border-primary transition duration-150"
                    />
                  </div>
                  
                  {/* Rows per page */}
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value={10}>10 rows</option>
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                  </select>
                </div>
              </div>

              {/* Table rendering */}
              <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                <table className="w-full text-[11px] border-collapse relative">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-bold uppercase tracking-wider z-20 shadow-sm">
                    <tr>
                      {preview?.columns?.map((col) => (
                        <th 
                          key={col}
                          onClick={() => handleSort(col)}
                          className="px-4 py-3 text-left font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 select-none whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5">
                            {col}
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {paginatedRows.length > 0 ? (
                      paginatedRows.map((row, idx) => (
                        <tr 
                          key={idx} 
                          className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors duration-150 odd:bg-transparent even:bg-slate-50/30 dark:even:bg-zinc-900/10"
                        >
                          {preview?.columns?.map((col) => (
                            <td key={col} className="px-4 py-2.5 truncate max-w-[200px] font-medium text-slate-650 dark:text-zinc-300">
                              {row[col] === null || row[col] === undefined ? (
                                <span className="text-rose-500/80 italic font-semibold">null</span>
                              ) : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={preview?.columns?.length || 1} className="text-center py-10 text-slate-400 dark:text-zinc-500 font-semibold">
                          No matching records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="p-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4 text-xs font-semibold bg-slate-50/30 dark:bg-zinc-950/10">
                <span className="text-slate-500 dark:text-zinc-400">
                  Showing {Math.min(processedRows.length, (currentPage - 1) * rowsPerPage + 1)} - {Math.min(processedRows.length, currentPage * rowsPerPage)} of {processedRows.length} preview rows
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Jump Page */}
                  <span className="mx-1">
                    Page <input 
                      type="number" 
                      min={1} 
                      max={totalPages || 1} 
                      value={currentPage}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                        setCurrentPage(val);
                      }}
                      className="w-10 text-center py-1 border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 focus:outline-none"
                    /> of {totalPages || 1}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* TABBED REPORTS AND ANALYTICS PANEL */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm overflow-hidden">
              
              {/* Tab selector */}
              <div className="flex flex-wrap border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 px-2 pt-2">
                <button
                  onClick={() => setActiveReportTab("profile")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 ${
                    activeReportTab === "profile" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Dataset Profile Report
                </button>
                <button
                  onClick={() => setActiveReportTab("missing")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 ${
                    activeReportTab === "missing" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Missing Value Report
                </button>
                <button
                  onClick={() => setActiveReportTab("duplicates")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 ${
                    activeReportTab === "duplicates" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Duplicate & Type Report
                </button>
                <button
                  onClick={() => setActiveReportTab("outliers")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 ${
                    activeReportTab === "outliers" 
                      ? "border-primary text-primary" 
                      : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Outlier Report
                </button>
                <button
                  onClick={() => setActiveReportTab("compare")}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 ${
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
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 transition duration-200 ${
                      activeReportTab === "logs" 
                        ? "border-primary text-primary" 
                        : "border-transparent text-slate-550 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    Cleaning Log
                  </button>
                )}
              </div>

              {/* Tab contents */}
              <div className="p-6">
                
                {/* 1. DATASET PROFILE */}
                {activeReportTab === "profile" && report && (
                  <div className="space-y-6">
                    {/* Quality Score & Stats Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      
                      {/* Quality Score circular indicator */}
                      <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3">Data Quality Score</span>
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg className="absolute w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r="48" strokeWidth="6" stroke="var(--border)" fill="transparent" className="text-slate-100 dark:text-zinc-800" />
                            <circle cx="56" cy="56" r="48" strokeWidth="6.5" stroke="#673ab7" fill="transparent" strokeDasharray={2 * Math.PI * 48} strokeDashoffset={2 * Math.PI * 48 * (1 - report.quality_score / 100)} className="transition-all duration-1000 ease-out" />
                          </svg>
                          <div className="text-center">
                            <span className="text-2xl font-black text-black dark:text-white">{report.quality_score}</span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block">/ 100</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-3 uppercase tracking-wide ${
                          report.quality_score >= 90 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" :
                          report.quality_score >= 70 ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" :
                          "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                        }`}>
                          {report.quality_score >= 90 ? "Premium" : report.quality_score >= 70 ? "Good" : "Needs Cleaning"}
                        </span>
                      </div>

                      {/* Stat Metrics Grid */}
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
                          <span className="text-sm font-black text-slate-700 dark:text-zinc-300">
                            {report.outlier_report?.reduce((acc, curr) => acc + curr.outlier_count, 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Numeric Statistics Table */}
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
                                  <td className="px-3.5 py-2.5 font-bold text-slate-700 dark:text-zinc-300">{stat.column}</td>
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

                    {/* Correlation Matrix Heatmap */}
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
                                    else if (num < -0.7) { bg = "bg-rose-500/20"; text = "text-rose-600 dark:text-rose-450 font-bold"; }
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

                {/* 2. MISSING VALUES REPORT */}
                {activeReportTab === "missing" && report && (
                  <div className="space-y-4">
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

                {/* 3. DUPLICATE & TYPE REPORT */}
                {activeReportTab === "duplicates" && report && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Row Duplicates card */}
                      <div className="p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-950/10">
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duplicate Rows</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-xl font-black text-black dark:text-white">{report.duplicate_summary?.duplicate_rows_count}</span>
                          <span className="text-xs text-slate-500 dark:text-zinc-500">rows ({report.duplicate_summary?.duplicate_rows_percentage.toFixed(2)}%)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-2">
                          Rows with identical values across all columns. Highly redundant and should be removed.
                        </p>
                      </div>

                      {/* Col Duplicates card */}
                      <div className="p-4 rounded-xl border border-slate-150 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-950/10">
                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duplicate Columns</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-xl font-black text-black dark:text-white">{report.duplicate_summary?.duplicate_columns_count}</span>
                          <span className="text-xs text-slate-500 dark:text-zinc-500">columns</span>
                        </div>
                        {report.duplicate_summary?.duplicate_columns_names?.length > 0 && (
                          <div className="mt-2 text-[10px] text-slate-500">
                            Duplicate names: <strong className="text-primary">{report.duplicate_summary.duplicate_columns_names.join(", ")}</strong>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-2">
                          Columns carrying identical data to another column.
                        </p>
                      </div>
                    </div>

                    {/* Data Types conversions */}
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

                {/* 4. OUTLIER REPORT */}
                {activeReportTab === "outliers" && report && (
                  <div className="space-y-4">
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
                                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-bold text-[9px] uppercase tracking-wide">Has Outliers</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wide">Clean</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {(!report.outlier_report || report.outlier_report.length === 0) && (
                            <tr>
                              <td colSpan={4} className="text-center py-6 text-slate-450 dark:text-zinc-550">
                                No numeric columns detected for outlier assessment.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. BEFORE & AFTER COMPARISON */}
                {activeReportTab === "compare" && (
                  <div className="space-y-6">
                    {afterReport ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* Quality comparison */}
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

                        {/* Rows comparison */}
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-950/20">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Row Count</span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-slate-500 line-through font-bold text-xs">{beforeReport.rows}</span>
                            <span className="text-lg font-black text-black dark:text-white">{afterReport.rows}</span>
                          </div>
                          <span className="text-[9.5px] text-slate-450 dark:text-zinc-500 font-semibold mt-1 block">
                            {beforeReport.rows - afterReport.rows} rows removed
                          </span>
                        </div>

                        {/* Cols comparison */}
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-zinc-950/20">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Columns Count</span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-slate-500 line-through font-bold text-xs">{beforeReport.columns}</span>
                            <span className="text-lg font-black text-black dark:text-white">{afterReport.columns}</span>
                          </div>
                          <span className="text-[9.5px] text-slate-450 dark:text-zinc-500 font-semibold mt-1 block">
                            {beforeReport.columns - afterReport.columns} columns removed
                          </span>
                        </div>

                        {/* Missing values comparison */}
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
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-xs mx-auto mt-1">
                          Configure cleaning parameters in the right sidebar and trigger a clean operation to view before & after reports.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. CLEANING LOGS */}
                {activeReportTab === "logs" && cleanLogs.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-4.5 h-4.5 text-primary" /> Active Job Pipeline Execution Logs</h3>
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-900/10 font-mono text-[10px] text-slate-700 dark:text-zinc-350 space-y-1.5 max-h-60 overflow-y-auto">
                      {cleanLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 shrink-0">✓</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* RIGHT 25% STICKY SIDEBAR */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-4 z-10 max-h-[calc(100vh-60px)] overflow-y-auto pr-1">
            
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
              <h2 className="text-xs font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3">
                <Settings className="w-4 h-4 text-primary" /> Cleaning Configuration
              </h2>

              <div className="space-y-3">
                
                {/* 1. COLUMN NAMES */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("colNames")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>1. Column Names</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.colNames ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.colNames && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 text-[10px]">
                      <label className="flex items-start gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-zinc-200">
                        <input
                          type="checkbox"
                          checked={config.standardize_column_names}
                          onChange={(e) => setConfig({ ...config, standardize_column_names: e.target.checked })}
                          className="mt-0.5 rounded border-slate-350 bg-transparent text-primary focus:ring-primary/20"
                        />
                        Standardize Column Names
                      </label>
                      
                      {config.standardize_column_names && (
                        <div className="pl-4 space-y-2 text-slate-500 dark:text-zinc-400 font-semibold">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.standardize_trim} onChange={(e) => setConfig({ ...config, standardize_trim: e.target.checked })} className="rounded" />
                            Trim leading/trailing spaces
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.standardize_replace_spaces} onChange={(e) => setConfig({ ...config, standardize_replace_spaces: e.target.checked })} className="rounded" />
                            Replace spaces with "_"
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.standardize_lowercase} onChange={(e) => setConfig({ ...config, standardize_lowercase: e.target.checked })} className="rounded" />
                            Convert to lowercase
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.standardize_remove_special} onChange={(e) => setConfig({ ...config, standardize_remove_special: e.target.checked })} className="rounded" />
                            Remove special characters
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.standardize_replace_multiple_underscores} onChange={(e) => setConfig({ ...config, standardize_replace_multiple_underscores: e.target.checked })} className="rounded" />
                            Replace multiple underscores
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.standardize_remove_outer_underscores} onChange={(e) => setConfig({ ...config, standardize_remove_outer_underscores: e.target.checked })} className="rounded" />
                            Remove leading/trailing '_'
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. MISSING VALUES */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("missing")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>2. Missing Values</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.missing ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.missing && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 text-[10px]">
                      <label className="flex items-start gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-zinc-200">
                        <input
                          type="checkbox"
                          checked={config.handle_missing_values}
                          onChange={(e) => setConfig({ ...config, handle_missing_values: e.target.checked })}
                          className="mt-0.5 rounded border-slate-350 bg-transparent text-primary focus:ring-primary/20"
                        />
                        Handle Missing Values
                      </label>

                      {config.handle_missing_values && (
                        <div className="pl-4 space-y-2 text-slate-550">
                          <label className="block font-bold">Imputation Strategy</label>
                          <select
                            value={config.missing_strategy}
                            onChange={(e) => setConfig({ ...config, missing_strategy: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold focus:outline-none"
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
                              className="w-full px-2 py-1 mt-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold focus:outline-none"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3 & 4. DUPLICATES */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("duplicates")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>3 & 4. Duplicates</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.duplicates ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.duplicates && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 text-[10px] text-slate-700 dark:text-zinc-200">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={config.remove_duplicate_rows}
                          onChange={(e) => setConfig({ ...config, remove_duplicate_rows: e.target.checked })}
                          className="rounded"
                        />
                        Remove Duplicate Rows
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={config.remove_duplicate_columns}
                          onChange={(e) => setConfig({ ...config, remove_duplicate_columns: e.target.checked })}
                          className="rounded"
                        />
                        Remove Duplicate Columns
                      </label>
                    </div>
                  )}
                </div>

                {/* 5. NUMERIC CLEANING */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("numeric")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>5. Numeric Cleaning</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.numeric ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.numeric && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 text-[10px]">
                      <label className="flex items-start gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-zinc-200">
                        <input
                          type="checkbox"
                          checked={config.clean_numeric_values}
                          onChange={(e) => setConfig({ ...config, clean_numeric_values: e.target.checked })}
                          className="mt-0.5 rounded border-slate-350 bg-transparent text-primary focus:ring-primary/20"
                        />
                        Clean Numeric Columns
                      </label>
                      <p className="text-[9px] text-slate-450 leading-relaxed font-semibold pl-6">
                        Auto-extract numerical numbers. Cleans currency symbols (₹, $, €, £), percentages (%), spaces, and commas separator (e.g. ₹12,50,000 → 1250000).
                      </p>
                    </div>
                  )}
                </div>

                {/* 6 & 7. TEXT CLEANING */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("text")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>6 & 7. Text & Blank Cleaning</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.text ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.text && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 text-[10px]">
                      <label className="flex items-start gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-zinc-200">
                        <input
                          type="checkbox"
                          checked={config.text_cleaning}
                          onChange={(e) => setConfig({ ...config, text_cleaning: e.target.checked })}
                          className="mt-0.5 rounded border-slate-350 bg-transparent text-primary focus:ring-primary/20"
                        />
                        Enable Text Cleaning
                      </label>

                      {config.text_cleaning && (
                        <div className="pl-4 space-y-2 text-slate-500 dark:text-zinc-400 font-semibold">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.text_trim} onChange={(e) => setConfig({ ...config, text_trim: e.target.checked })} className="rounded" />
                            Trim leading/trailing spaces
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.text_remove_multiple_spaces} onChange={(e) => setConfig({ ...config, text_remove_multiple_spaces: e.target.checked })} className="rounded" />
                            Remove multiple spaces
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.text_remove_html} onChange={(e) => setConfig({ ...config, text_remove_html: e.target.checked })} className="rounded" />
                            Remove HTML tags
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.text_remove_emoji} onChange={(e) => setConfig({ ...config, text_remove_emoji: e.target.checked })} className="rounded" />
                            Remove emojis & non-ASCII
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.text_remove_tabs_newlines} onChange={(e) => setConfig({ ...config, text_remove_tabs_newlines: e.target.checked })} className="rounded" />
                            Remove tabs & newlines
                          </label>

                          <div className="space-y-1 mt-1">
                            <label className="block font-bold">Case Convert Mode</label>
                            <select
                              value={config.text_case_mode}
                              onChange={(e) => setConfig({ ...config, text_case_mode: e.target.value })}
                              className="w-full px-1.5 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded focus:outline-none"
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

                      <div className="pt-1.5 border-t border-slate-100 dark:border-zinc-800/80">
                        <label className="flex items-start gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={config.blank_value_detection}
                            onChange={(e) => setConfig({ ...config, blank_value_detection: e.target.checked })}
                            className="mt-0.5 rounded border-slate-350 bg-transparent text-primary focus:ring-primary/20"
                          />
                          Blank Value Detection
                        </label>
                        <p className="text-[8.5px] text-slate-450 leading-relaxed font-semibold pl-6 mt-0.5">
                          Treat cell strings like "NA", "N/A", "NULL", "null", "--", "-", "Unknown", "None", spaces as Missing (NaN).
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 8 & 16. DATA TYPE CONVERSION & UNWANTED */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("types")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>8 & 16. Columns & Type Convert</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.types ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.types && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 text-[10px]">
                      
                      {/* Unwanted Columns */}
                      <div>
                        <span className="font-bold text-slate-700 dark:text-zinc-200 block mb-1">16. Remove Columns</span>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 dark:border-zinc-800 rounded p-1.5 space-y-1">
                          {preview?.columns?.map(col => (
                            <label key={col} className="flex items-center gap-1.5 cursor-pointer font-semibold">
                              <input
                                type="checkbox"
                                checked={selectedUnwanted.includes(col)}
                                onChange={() => handleUnwantedToggle(col)}
                                className="rounded text-[8px]"
                              />
                              {col}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Conversions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                        <label className="flex items-start gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={config.data_type_conversion}
                            onChange={(e) => setConfig({ ...config, data_type_conversion: e.target.checked })}
                            className="mt-0.5 rounded border-slate-350 bg-transparent text-primary focus:ring-primary/20"
                          />
                          Convert Data Types
                        </label>
                        
                        {config.data_type_conversion && (
                          <div className="pl-4 mt-2 space-y-2">
                            <label className="block font-bold">Conversion Mode</label>
                            <select
                              value={config.type_conversion_mode}
                              onChange={(e) => setConfig({ ...config, type_conversion_mode: e.target.value })}
                              className="w-full px-1.5 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold focus:outline-none"
                            >
                              <option value="auto">Auto-Detect types</option>
                              <option value="manual">Manual casting</option>
                            </select>

                            {config.type_conversion_mode === "manual" && (
                              <div className="space-y-1.5 max-h-32 overflow-y-auto border p-1 rounded">
                                {preview?.columns?.map((col) => (
                                  <div key={col} className="flex items-center justify-between gap-1">
                                    <span className="font-semibold text-slate-500 truncate max-w-[80px]">{col}</span>
                                    <select
                                      value={manualTypes[col] || "string"}
                                      onChange={(e) => handleManualTypeChange(col, e.target.value)}
                                      className="px-1 border rounded bg-transparent font-medium"
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
                  )}
                </div>

                {/* 9. OUTLIERS */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("outliers")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>9. Outlier Handling</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.outliers ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.outliers && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-[10px] text-slate-550">
                      <div>
                        <label className="block font-bold mb-1">Handling Strategy</label>
                        <select
                          value={config.outlier_strategy}
                          onChange={(e) => setConfig({ ...config, outlier_strategy: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold focus:outline-none"
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
                          <label className="block font-bold mb-1">Assessment Method</label>
                          <select
                            value={config.outlier_method}
                            onChange={(e) => setConfig({ ...config, outlier_method: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold focus:outline-none"
                          >
                            <option value="iqr">IQR (1.5 IQR range)</option>
                            <option value="z_score">Z-Score (3.0 StdDev)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 10 & 11. DATE & DECIMAL FORMATTING */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("dateDecimal")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>10 & 11. Dates & Decimals</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.dateDecimal ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.dateDecimal && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-3.5 text-[10px]">
                      
                      {/* Date */}
                      <div>
                        <label className="flex items-start gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-zinc-200 mb-1.5">
                          <input
                            type="checkbox"
                            checked={config.date_formatting}
                            onChange={(e) => setConfig({ ...config, date_formatting: e.target.checked })}
                            className="rounded"
                          />
                          Format Dates
                        </label>
                        {config.date_formatting && (
                          <select
                            value={config.date_format}
                            onChange={(e) => setConfig({ ...config, date_format: e.target.value })}
                            className="w-full px-1.5 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold focus:outline-none"
                          >
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          </select>
                        )}
                      </div>

                      {/* Decimals */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800/80">
                        <label className="flex items-start gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-zinc-200 mb-1.5">
                          <input
                            type="checkbox"
                            checked={config.decimal_formatting}
                            onChange={(e) => setConfig({ ...config, decimal_formatting: e.target.checked })}
                            className="rounded"
                          />
                          Decimal Rounding
                        </label>
                        {config.decimal_formatting && (
                          <select
                            value={config.decimal_format}
                            onChange={(e) => setConfig({ ...config, decimal_format: e.target.value })}
                            className="w-full px-1.5 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold focus:outline-none"
                          >
                            <option value="none">No Rounding</option>
                            <option value="2">2 Decimal Places</option>
                            <option value="3">3 Decimal Places</option>
                            <option value="4">4 Decimal Places</option>
                          </select>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* 12, 13 & 14. COLUMNS REDUCTION (CONSTANT, LOW VARIANCE, HIGH MISSING) */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("variance")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>12-14. Columns Filter (Variance)</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.variance ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.variance && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-2.5 text-[10px] text-slate-700 dark:text-zinc-200">
                      
                      {/* Constant */}
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={config.remove_constant_columns}
                          onChange={(e) => setConfig({ ...config, remove_constant_columns: e.target.checked })}
                          className="rounded"
                        />
                        Remove Constant Columns
                      </label>

                      {/* Low Variance */}
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={config.remove_low_variance_columns}
                          onChange={(e) => setConfig({ ...config, remove_low_variance_columns: e.target.checked })}
                          className="rounded"
                        />
                        Remove Low Variance Columns
                      </label>

                      {/* High Missing slider */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-zinc-800/80">
                        <label className="flex items-start gap-2 cursor-pointer font-bold mb-1.5">
                          <input
                            type="checkbox"
                            checked={config.remove_high_missing_columns}
                            onChange={(e) => setConfig({ ...config, remove_high_missing_columns: e.target.checked })}
                            className="rounded"
                          />
                          Remove High-Null Columns
                        </label>
                        {config.remove_high_missing_columns && (
                          <div className="pl-4 space-y-1">
                            <div className="flex justify-between font-bold text-[9px] text-slate-500">
                              <span>Threshold</span>
                              <span>{config.missing_threshold}% Nulls</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="95"
                              step="5"
                              value={config.missing_threshold}
                              onChange={(e) => setConfig({ ...config, missing_threshold: Number(e.target.value) })}
                              className="w-full accent-primary h-1 rounded"
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* 15, 17 & 18. INVALID VALUES, INDEX & ENCODING */}
                <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleCard("invalid")}
                    className="w-full flex items-center justify-between p-3 text-left text-[11px] font-bold bg-slate-50/30 dark:bg-zinc-950/10 hover:bg-slate-50 dark:hover:bg-zinc-850"
                  >
                    <span>15, 17-18. Validations & Encoding</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-200 ${expandedCards.invalid ? "rotate-90" : ""}`} />
                  </button>
                  {expandedCards.invalid && (
                    <div className="p-3 border-t border-slate-100 dark:border-zinc-800 space-y-3.5 text-[10px]">
                      
                      {/* Invalid */}
                      <div>
                        <label className="flex items-start gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={config.remove_invalid_values}
                            onChange={(e) => setConfig({ ...config, remove_invalid_values: e.target.checked })}
                            className="rounded"
                          />
                          Remove Invalid Values
                        </label>
                        <p className="text-[8.5px] text-slate-450 leading-relaxed font-semibold pl-6 mt-0.5">
                          Clean values like negative Age/Salary, malformed Email addresses, invalid phone formatting, or impossible dates.
                        </p>
                      </div>

                      {/* Reset index */}
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={config.reset_index}
                            onChange={(e) => setConfig({ ...config, reset_index: e.target.checked })}
                            className="rounded"
                          />
                          Reset Row Index (0 to N)
                        </label>
                      </div>

                      {/* File Encoding */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 text-slate-550">
                        <label className="block font-bold mb-1">18. Import File Encoding</label>
                        <select
                          value={config.encoding}
                          onChange={(e) => setConfig({ ...config, encoding: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold focus:outline-none"
                        >
                          <option value="UTF-8">Auto-Detect / UTF-8</option>
                          <option value="ASCII">ASCII</option>
                          <option value="Latin-1">Latin-1 (ISO-8859-1)</option>
                          <option value="UTF-16">UTF-16</option>
                        </select>
                      </div>

                    </div>
                  )}
                </div>

              </div>

              {/* Sidebar bottom action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={handleAnalyze}
                  disabled={processing}
                  className="px-2 py-2 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition duration-150 disabled:opacity-50 text-center"
                >
                  Analyze
                </button>
                <button
                  onClick={handleClean}
                  disabled={processing}
                  className="px-2 py-2 text-[10px] font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition duration-150 shadow disabled:opacity-50 text-center"
                >
                  Clean
                </button>
                <button
                  onClick={handleDecide}
                  disabled={processing}
                  className="col-span-2 px-3 py-2 text-[10px] font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg transition duration-150 shadow disabled:opacity-50 text-center flex items-center justify-center gap-1"
                >
                  ✨ RefineX Decide
                </button>
                <button
                  onClick={handleReset}
                  disabled={processing}
                  className="col-span-2 px-3 py-1.5 text-[9.5px] font-bold text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-lg transition duration-150 disabled:opacity-50 text-center"
                >
                  Reset Configuration
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
