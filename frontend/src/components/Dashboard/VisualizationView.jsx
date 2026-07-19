import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../services/api";
import GraphCanvas from "./GraphCanvas";
import {
  Sparkles,
  LineChart,
  BarChart2,
  PieChart,
  Activity,
  Sliders,
  Maximize2,
  Download,
  Copy,
  Trash2,
  Heart,
  RefreshCw,
  Undo2,
  Redo2,
  Info,
  Calendar,
  AlertCircle,
  Settings,
  Palette,
  Type,
  Plus,
  Play,
  Save,
  ChevronDown,
  Eye,
  Check
} from "lucide-react";

// Initial Configuration Map
const initialConfig = {
  graph_type: "Bar Chart",
  library: "plotly",
  x_column: "",
  y_column: "",
  z_column: "",
  color_column: "",
  size_column: "",
  source_column: "",
  target_column: "",
  
  // globals
  title: "",
  subtitle: "",
  caption: "",
  font_size: 10,
  width: 800,
  height: 500,
  margin_left: 40,
  margin_right: 40,
  margin_top: 60,
  margin_bottom: 40,
  legend: true,
  grid: true,
  axis_rotation: 0,
  opacity: 1.0,
  dark_mode: false,
  
  // bar
  orientation: "vertical",
  barmode: "group",
  bar_width: 0.8,
  aggregation: "sum",
  sorting: "none",
  
  // pie
  donut: false,
  hole_size: 0.4,
  
  // histogram
  bins: 20,
  histnorm: "count",
  
  // scatter
  trend_line: false,
  marker_size: 20,
  
  // bubble
  max_bubble_size: 30,
  
  // heatmap
  color_palette: "viridis",
  annotations: true,
  grid_width: 0.5,
  square_cells: false,
  color_bar: true,
  
  // box
  box_width: 0.5,
  show_outliers: true,
  
  // network graph
  directed: false,
  node_size: 500,
  edge_width: 1.0,
  node_color: "#3b82f6",
  edge_color: "#94a3b8",
  show_labels: true,
  layout: "spring",
  
  // 3d
  camera_x: 1.25,
  camera_y: 1.25,
  camera_z: 1.25
};

export default function VisualizationView({
  datasetId,
  setDatasetId,
  metadata,
  setMetadata,
  report,
  setReport,
  preview,
  setPreview,
  setBeforeReport,
  setAfterReport,
  setCleanLogs,
  setActiveTab,
  restoredGraph,
  setRestoredGraph
}) {
  // App States
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [datasetsList, setDatasetsList] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genReason, setGenReason] = useState("");
  const [genRec, setGenRec] = useState("");
  const [genNotes, setGenNotes] = useState([]);
  const [loadingDatasetId, setLoadingDatasetId] = useState(null);

  const handleSelectHistoryDataset = async (ds) => {
    setLoadingDatasetId(ds.id);
    setProfileLoading(true);
    try {
      const previewRes = await api.get(`cleaning/${ds.id}/preview/?offset=0&limit=100`);
      const previewData = previewRes.data;
      
      const analyzeRes = await api.get(`visualization/analyze/${ds.id}/`);
      const analysisReport = analyzeRes.data;
      
      setDatasetId(ds.id);
      setMetadata(previewData.metadata);
      setPreview(previewData);
      setReport(analysisReport);
      setBeforeReport(analysisReport);
      setAfterReport(null);
      setCleanLogs([]);
    } catch (err) {
      console.error("Failed to load dataset in-place:", err);
    } finally {
      setProfileLoading(false);
      setLoadingDatasetId(null);
    }
  };
  
  // Active config & undo/redo stacks
  const [config, setConfig] = useState(initialConfig);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  
  // Result States
  const [chartHtml, setChartHtml] = useState("");
  const [chartImage, setChartImage] = useState("");
  const [pythonCode, setPythonCode] = useState("");
  
  // Mode Selector: "simple" (Mode 1) vs "advanced" (Mode 2)
  const [viewMode, setViewMode] = useState("simple");
  
  // UI states
  const [activeSubTab, setActiveSubTab] = useState("layers"); // layers, settings, colors, history_info
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [canvasZoom, setCanvasZoom] = useState(1.0);
  const [canvasFullscreen, setCanvasFullscreen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Debounced generator trigger
  const debounceTimer = useRef(null);

  // Load guest/history datasets list if datasetId is null
  useEffect(() => {
    if (!datasetId) {
      fetchHistoryDatasets();
    } else {
      fetchDatasetAnalysis();
      fetchDatasetRecommendations();
    }
  }, [datasetId]);

  const fetchHistoryDatasets = async () => {
    setLoadingDatasets(true);
    try {
      const res = await api.get("history/");
      // Filter out clean jobs and unique dataset ids
      const uniqueDatasets = [];
      const seenIds = new Set();
      res.data.forEach(item => {
        if (item.dataset_id && !seenIds.has(item.dataset_id)) {
          seenIds.add(item.dataset_id);
          uniqueDatasets.push({
            id: item.dataset_id,
            name: item.dataset_name,
            created_at: item.created_at
          });
        }
      });
      setDatasetsList(uniqueDatasets);
    } catch {
      // Ignore
    } finally {
      setLoadingDatasets(false);
    }
  };

  const fetchDatasetAnalysis = async () => {
    setProfileLoading(true);
    try {
      const res = await api.get(`visualization/analyze/${datasetId}/`);
      setProfile(res.data);
      // Auto-assign default X and Y columns based on available types
      const numCols = res.data.numeric_columns || [];
      const catCols = res.data.categorical_columns || [];
      const dateCols = res.data.date_columns || [];
      
      setConfig(prev => ({
        ...prev,
        x_column: dateCols[0] || catCols[0] || numCols[0] || "",
        y_column: numCols[0] || catCols[0] || ""
      }));
    } catch {
      // Fallback
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchDatasetRecommendations = async () => {
    try {
      const res = await api.get(`visualization/recommend/${datasetId}/`);
      setRecommendations(res.data);
    } catch {
      // Ignore
    }
  };

  // Push new state to undo stack
  const updateConfig = (newConfig) => {
    setUndoStack(prev => [...prev, config]);
    setRedoStack([]);
    setConfig(newConfig);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, config]);
    setConfig(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, config]);
    setConfig(next);
  };

  const handleReset = () => {
    updateConfig(initialConfig);
  };

  // Trigger chart generation with debouncing
  const triggerGeneration = useCallback((currentConfig) => {
    if (!datasetId) return;
    
    setGenerating(true);
    setGenError("");
    setGenReason("");
    setGenRec("");
    
    api.post("visualization/generate/", {
      dataset_id: datasetId,
      config: currentConfig
    })
    .then(res => {
      setChartHtml(res.data.html);
      setChartImage(res.data.image);
      setPythonCode(res.data.python_code);
      setGenNotes(res.data.notes || []);
    })
    .catch(err => {
      const data = err.response?.data || {};
      setGenError(data.error || "Failed to generate graph.");
      setGenReason(data.reason || "Invalid column configurations.");
      setGenRec(data.recommended || "");
      setChartHtml("");
      setChartImage("");
    })
    .finally(() => {
      setGenerating(false);
    });
  }, [datasetId]);

  // Listen to config changes and run generator debounced
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      triggerGeneration(config);
    }, 400); // 400ms debounce
    
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [config, triggerGeneration]);

  const handleApplyRecommendation = (rec) => {
    const cols = rec.recommended_columns || [];
    let updated = { ...config };
    
    // Deduce chart type
    if (rec.graph_type === "Heatmap") {
      updated.graph_type = "Heatmap";
      updated.library = "seaborn";
    } else if (rec.graph_type === "Box Plot") {
      updated.graph_type = "Box Plot";
      updated.library = "seaborn";
      updated.x_column = cols[0] || "";
      updated.y_column = cols[1] || "";
    } else if (rec.graph_type === "Bar Chart") {
      updated.graph_type = "Bar Chart";
      updated.library = "plotly";
      updated.x_column = cols[0] || "";
      updated.y_column = cols[1] || "";
    } else if (rec.graph_type === "Line Chart") {
      updated.graph_type = "Line Chart";
      updated.library = "plotly";
      updated.x_column = cols[0] || "";
      updated.y_column = cols[1] || "";
    } else if (rec.graph_type === "Pie Chart") {
      updated.graph_type = "Pie Chart";
      updated.library = "plotly";
      updated.x_column = cols[0] || "";
      updated.y_column = cols[1] || "";
    } else if (rec.graph_type === "Scatter Plot") {
      updated.graph_type = "Scatter Plot";
      updated.library = "plotly";
      updated.x_column = cols[0] || "";
      updated.y_column = cols[1] || "";
    } else if (rec.graph_type === "Histogram") {
      updated.graph_type = "Histogram";
      updated.library = "plotly";
      updated.x_column = cols[0] || "";
    } else if (rec.graph_type === "Bubble Chart") {
      updated.graph_type = "Bubble Chart";
      updated.library = "plotly";
      updated.x_column = cols[0] || "";
      updated.y_column = cols[1] || "";
      updated.size_column = cols[2] || "";
    } else if (rec.graph_type === "3D Scatter Plot") {
      updated.graph_type = "3D Scatter Plot";
      updated.library = "plotly";
      updated.x_column = cols[0] || "";
      updated.y_column = cols[1] || "";
      updated.z_column = cols[2] || "";
    } else if (rec.graph_type === "Scatter Matrix") {
      updated.graph_type = "Scatter Matrix";
      updated.library = "plotly";
      updated.dimensions = cols;
    }
    
    // Auto title
    updated.title = `${rec.graph_type} for ${metadata.name}`;
    updateConfig(updated);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveToHistory = async () => {
    if (!saveName.trim()) return;
    setSaveLoading(true);
    setSavedSuccess(false);
    try {
      await api.post("visualization/history/", {
        dataset: datasetId,
        dataset_name: metadata.name,
        name: saveName.trim(),
        graph_type: config.graph_type,
        library: config.library,
        config: config,
        preview_data: chartImage,
        python_code: pythonCode
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setShowSaveDialog(false);
        setSavedSuccess(false);
      }, 1500);
    } catch {
      // Error
    } finally {
      setSaveLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    setShowExportDropdown(false);
    try {
      const res = await api.post("visualization/export/", {
        dataset_id: datasetId,
        config: config,
        format: format
      }, { responseType: "blob" });
      
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const fileExt = format === "csv" ? "csv" : format === "json" ? "json" : format === "html" ? "html" : format;
      link.setAttribute("download", `refinex_chart.${fileExt}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // Export failed
    } finally {
      setExportLoading(false);
    }
  };

  // Helper to load dataset workspace
  const handleLoadDataset = async (dsId) => {
    setProfileLoading(true);
    try {
      const res = await api.get(`cleaning/${dsId}/preview/?offset=0&limit=100`);
      const data = res.data;
      // Load parent workspace
      window.location.reload(); // Quick workspace reload mapping or let them restore from History tab
    } catch {
      // Ignore
    } finally {
      setProfileLoading(false);
    }
  };

  // Empty state selector
  if (!datasetId) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-in font-sans pb-10">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-2xl font-bold mb-6">
            📊
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">No Dataset Active</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-md">
            Before generating visualizations, you need to have a dataset loaded in the workspace. Upload one in the Clean tab or select from the execution log.
          </p>
          <button
            onClick={() => setActiveTab("clean")}
            className="mt-6 px-6 py-2.5 text-xs font-bold bg-primary hover:bg-primary-dark text-white rounded-xl cursor-pointer shadow transition"
          >
            Upload Dataset
          </button>
        </div>

        {datasetsList.length > 0 && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
            <h2 className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Load a Cleaned Dataset from History
            </h2>
            <div className="space-y-3">
              {datasetsList.map(ds => (
                <div key={ds.id} className="flex justify-between items-center p-4 border border-slate-100 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{ds.name}</h3>
                    <span className="text-[10px] text-slate-400 block mt-1">Uploaded {new Date(ds.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleSelectHistoryDataset(ds)}
                    disabled={loadingDatasetId !== null}
                    className="px-4 py-2 text-2xs font-bold text-violet-600 border border-violet-500/30 hover:bg-violet-500/10 rounded-lg cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {loadingDatasetId === ds.id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
                      </>
                    ) : (
                      "Visualize"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-zinc-100 animate-fade-in font-sans pb-10 max-w-7xl mx-auto">
      
      {/* Top Banner Dashboard Profile */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-3">
            <LineChart className="w-7 h-7 text-primary" /> RefineX Data Visualization Studio
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
            Configure variables, layers, color styles, and typography in real-time. Code automatically generated below.
          </p>
        </div>
        
        {/* Toggle Mode Mode 1 vs Mode 2 */}
        <div className="flex bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-xl self-start lg:self-center shadow-inner">
          <button
            onClick={() => setViewMode("simple")}
            className={`px-4 py-1.5 text-2xs font-bold rounded-lg cursor-pointer transition ${
              viewMode === "simple"
                ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800"
            }`}
          >
            Simple Mode
          </button>
          <button
            onClick={() => setViewMode("advanced")}
            className={`px-4 py-1.5 text-2xs font-bold rounded-lg cursor-pointer transition ${
              viewMode === "advanced"
                ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800"
            }`}
          >
            Advanced Mode
          </button>
        </div>
      </div>

      {/* Dataset Profile Auto-Analysis Info Summary */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Rows</span>
            <span className="text-sm font-black text-slate-900 dark:text-zinc-100 mt-1">{profile.total_rows?.toLocaleString()}</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Columns</span>
            <span className="text-sm font-black text-slate-900 dark:text-zinc-100 mt-1">{profile.total_columns}</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">File Size</span>
            <span className="text-sm font-black text-slate-900 dark:text-zinc-100 mt-1">{(profile.file_size / 1024).toFixed(1)} KB</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Numeric Columns</span>
            <span className="text-sm font-black text-violet-600 dark:text-violet-400 mt-1">{profile.numeric_columns?.length || 0}</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Categorical Columns</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1">{profile.categorical_columns?.length || 0}</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Duplicate Rows</span>
            <span className="text-sm font-black text-rose-500 mt-1">{profile.duplicate_rows || 0}</span>
          </div>
        </div>
      )}

      {/* Auto Graph Recommendation Carousel Row */}
      {recommendations.length > 0 && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm">
          <h2 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500 animate-bounce" /> Smart Auto-Recommendations for your data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div 
                key={idx} 
                onClick={() => handleApplyRecommendation(rec)}
                className="group p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 hover:border-violet-500/30 cursor-pointer shadow-sm flex flex-col justify-between transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400">
                      {rec.graph_type}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(rec.confidence_score * 100)}% Match
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 mt-2.5 leading-relaxed">
                    {rec.reason}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-550 mt-1">
                    <strong className="text-slate-500 dark:text-zinc-400">Case:</strong> {rec.business_use_case}
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/40 dark:border-zinc-800/40 pt-2.5 mt-3">
                  <span className="text-[9px] font-bold text-slate-400">Difficulty: {rec.difficulty_level}</span>
                  <span className="text-[9px] font-bold text-violet-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Apply Plot <Plus className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Studio layout: properties (left) + canvas (middle) + options (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Sidebar: Variables layer mapping and titles */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm space-y-5">
          {/* Side sub tab header */}
          <div className="flex border-b border-slate-100 dark:border-zinc-800 pb-3 justify-around">
            <button
              onClick={() => setActiveSubTab("layers")}
              className={`pb-1 text-xs font-bold cursor-pointer transition ${
                activeSubTab === "layers" ? "text-primary border-b-2 border-primary" : "text-slate-400"
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setActiveSubTab("settings")}
              className={`pb-1 text-xs font-bold cursor-pointer transition ${
                activeSubTab === "settings" ? "text-primary border-b-2 border-primary" : "text-slate-400"
              }`}
            >
              Globals
            </button>
          </div>

          {activeSubTab === "layers" && profile && (
            <div className="space-y-4">
              
              {/* Graph type selection */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Visualization Type</label>
                <select
                  value={config.graph_type}
                  onChange={(e) => {
                    const type = e.target.value;
                    let lib = config.library;
                    if (viewMode === "simple") {
                      if (type === "Heatmap" || type === "Box Plot") lib = "seaborn";
                      else if (type === "Bar Chart" || type === "Pie Chart" || type === "Line Chart" || type === "Scatter Plot" || type === "Histogram" || type === "Bubble Chart" || type === "3D Scatter Plot" || type === "Scatter Matrix") lib = "plotly";
                    }
                    updateConfig({ ...config, graph_type: type, library: lib });
                  }}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option>Bar Chart</option>
                  <option>Line Chart</option>
                  <option>Pie Chart</option>
                  <option>Scatter Plot</option>
                  <option>Histogram</option>
                  <option>Heatmap</option>
                  <option>Bubble Chart</option>
                  <option>Box Plot</option>
                  <option>3D Scatter Plot</option>
                  <option>Scatter Matrix</option>
                  <option>Network Graph</option>
                </select>
              </div>

              {/* Target Library (Mode 2 only) */}
              {viewMode === "advanced" && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Visualization Library</label>
                  <select
                    value={config.library}
                    onChange={(e) => updateConfig({ ...config, library: e.target.value.toLowerCase() })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="plotly">Plotly</option>
                    <option value="seaborn">Seaborn</option>
                    <option value="matplotlib">Matplotlib</option>
                  </select>
                </div>
              )}

              {/* Column selections (Source & Target if Network Graph, else standard X, Y, Z, color, size) */}
              {config.graph_type === "Network Graph" ? (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Source Node Column</label>
                    <select
                      value={config.source_column}
                      onChange={(e) => updateConfig({ ...config, source_column: e.target.value })}
                      className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">-- None --</option>
                      {[...profile.categorical_columns, ...profile.numeric_columns, ...profile.text_columns].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Node Column</label>
                    <select
                      value={config.target_column}
                      onChange={(e) => updateConfig({ ...config, target_column: e.target.value })}
                      className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">-- None --</option>
                      {[...profile.categorical_columns, ...profile.numeric_columns, ...profile.text_columns].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* X axis */}
                  {config.graph_type !== "Scatter Matrix" && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {config.graph_type === "Pie Chart" ? "Labels Column" : "X Axis Column"}
                      </label>
                      <select
                        value={config.x_column}
                        onChange={(e) => updateConfig({ ...config, x_column: e.target.value })}
                        className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="">-- None --</option>
                        {[...profile.categorical_columns, ...profile.numeric_columns, ...profile.date_columns].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Y axis */}
                  {["Bar Chart", "Line Chart", "Scatter Plot", "Pie Chart", "Bubble Chart", "3D Scatter Plot"].includes(config.graph_type) && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {config.graph_type === "Pie Chart" ? "Values Column" : "Y Axis Column"}
                      </label>
                      <select
                        value={config.y_column}
                        onChange={(e) => updateConfig({ ...config, y_column: e.target.value })}
                        className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="">-- None --</option>
                        {profile.numeric_columns.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {config.graph_type === "Bar Chart" && profile.categorical_columns.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Z axis (3D Scatter only) */}
                  {config.graph_type === "3D Scatter Plot" && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Z Axis Column</label>
                      <select
                        value={config.z_column}
                        onChange={(e) => updateConfig({ ...config, z_column: e.target.value })}
                        className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="">-- None --</option>
                        {profile.numeric_columns.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Bubble size (Bubble only) */}
                  {config.graph_type === "Bubble Chart" && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bubble Size Column</label>
                      <select
                        value={config.size_column}
                        onChange={(e) => updateConfig({ ...config, size_column: e.target.value })}
                        className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="">-- None --</option>
                        {profile.numeric_columns.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Color mapping column */}
                  {["Bar Chart", "Line Chart", "Scatter Plot", "Bubble Chart", "3D Scatter Plot", "Scatter Matrix"].includes(config.graph_type) && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Color Group Column</label>
                      <select
                        value={config.color_column}
                        onChange={(e) => updateConfig({ ...config, color_column: e.target.value })}
                        className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="">-- None --</option>
                        {[...profile.categorical_columns, ...profile.numeric_columns].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Scatter Matrix dimension selector */}
                  {config.graph_type === "Scatter Matrix" && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Dimensions (Multiselect)</label>
                      <div className="mt-1.5 max-h-36 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-xl p-2 bg-slate-50 dark:bg-zinc-900/50 space-y-1.5">
                        {profile.numeric_columns.map(col => {
                          const dims = config.dimensions || [];
                          const checked = dims.includes(col);
                          return (
                            <label key={col} className="flex items-center gap-2 text-2xs font-semibold cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const updatedDims = checked
                                    ? dims.filter(d => d !== col)
                                    : [...dims, col];
                                  updateConfig({ ...config, dimensions: updatedDims });
                                }}
                                className="rounded text-primary border-slate-350"
                              />
                              {col}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Auto aggregations aggregation method */}
                  {["Bar Chart", "Pie Chart"].includes(config.graph_type) && (
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Duplicate Aggregation</label>
                      <select
                        value={config.aggregation}
                        onChange={(e) => updateConfig({ ...config, aggregation: e.target.value })}
                        className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="sum">Sum values</option>
                        <option value="mean">Mean (Average)</option>
                        <option value="count">Count occurrences</option>
                      </select>
                    </div>
                  )}
                </>
              )}

            </div>
          )}

          {activeSubTab === "settings" && (
            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chart Title</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => updateConfig({ ...config, title: e.target.value })}
                  placeholder="Enter chart main title"
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subtitle</label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => updateConfig({ ...config, subtitle: e.target.value })}
                  placeholder="Enter descriptive subtitle"
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Caption / Footer</label>
                <input
                  type="text"
                  value={config.caption}
                  onChange={(e) => updateConfig({ ...config, caption: e.target.value })}
                  placeholder="Source attribution / footnotes"
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Width (px)</label>
                  <input
                    type="number"
                    value={config.width}
                    onChange={(e) => updateConfig({ ...config, width: parseInt(e.target.value) || 800 })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Height (px)</label>
                  <input
                    type="number"
                    value={config.height}
                    onChange={(e) => updateConfig({ ...config, height: parseInt(e.target.value) || 500 })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3">
                <label className="text-2xs font-bold text-slate-600 dark:text-zinc-400">Display Grid Lines</label>
                <input
                  type="checkbox"
                  checked={config.grid}
                  onChange={(e) => updateConfig({ ...config, grid: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-2xs font-bold text-slate-600 dark:text-zinc-400">Show Legend</label>
                <input
                  type="checkbox"
                  checked={config.legend}
                  onChange={(e) => updateConfig({ ...config, legend: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Axis Label Rotation</label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={config.axis_rotation}
                  onChange={(e) => updateConfig({ ...config, axis_rotation: parseInt(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.axis_rotation}°</span>
              </div>
            </div>
          )}

        </div>

        {/* Center Canvas Area: Toolbar + canvas display + smart notes list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Horizontal Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-250/50 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
              
              {/* Undo / Redo */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 cursor-pointer transition"
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 cursor-pointer transition"
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 text-3xs uppercase font-extrabold tracking-wider border border-slate-250 dark:border-zinc-700 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer transition ml-1"
                >
                  Reset
                </button>
              </div>

              {/* Theme Settings & Fullscreen toggles */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-2xs font-bold text-slate-600 dark:text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.dark_mode}
                    onChange={(e) => updateConfig({ ...config, dark_mode: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  Dark Canvas
                </label>

                {/* Save & Export */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSaveName(`${config.graph_type} for ${metadata.name}`);
                      setShowSaveDialog(true);
                    }}
                    className="px-3.5 py-1.5 text-2xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      disabled={exportLoading}
                      className="px-3.5 py-1.5 text-2xs font-bold bg-slate-900 dark:bg-zinc-800 hover:bg-black hover:dark:bg-zinc-750 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Download className="w-3.5 h-3.5" /> {exportLoading ? "Exporting..." : "Export"} <ChevronDown className="w-3 h-3" />
                    </button>
                    {showExportDropdown && (
                      <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-30 py-1.5 animate-fade-in font-bold text-2xs">
                        <button onClick={() => handleExport("png")} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300">PNG Image</button>
                        <button onClick={() => handleExport("svg")} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300">SVG Vector</button>
                        <button onClick={() => handleExport("jpeg")} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300">JPEG Image</button>
                        <button onClick={() => handleExport("pdf")} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300">PDF Document</button>
                        <button onClick={() => handleExport("html")} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300">HTML File</button>
                        <button onClick={() => handleExport("json")} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300">JSON Config</button>
                        <button onClick={() => handleExport("csv")} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300">CSV Clean Data</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Editor Canvas Canvas */}
            <div className="p-5 flex justify-center bg-slate-50/50 dark:bg-zinc-900/10 min-h-[400px]">
              <GraphCanvas
                html={chartHtml}
                image={chartImage}
                loading={generating}
                zoom={canvasZoom}
                setZoom={setCanvasZoom}
                fullscreen={canvasFullscreen}
                setFullscreen={setCanvasFullscreen}
                error={genError}
                reason={genReason}
                recommendation={genRec}
              />
            </div>
            
          </div>

          {/* Smart decisions notifications logs list */}
          {genNotes.length > 0 && (
            <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 dark:bg-blue-950/10 text-xs font-semibold text-blue-600 dark:text-blue-400 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Smart Engine Decisions applied:</span>
              {genNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-slate-400">›</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}

          {/* Copy Code Readonly Block */}
          {pythonCode && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-[#0d1117] dark:bg-[#070708] text-zinc-100 shadow-sm relative group overflow-hidden">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                <span className="text-3xs uppercase font-extrabold tracking-wider text-zinc-550">Copy Reusable Python Code</span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:text-white transition text-3xs font-extrabold tracking-wider flex items-center gap-1.5 cursor-pointer text-zinc-350"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedCode ? "Copied" : "Copy Code"}
                </button>
              </div>
              <pre className="text-2xs font-mono pt-4 overflow-x-auto max-h-56 select-all scrollbar-thin text-zinc-300 leading-normal">
                {pythonCode}
              </pre>
            </div>
          )}

        </div>

        {/* Right Sidebar: Dynamic chart details specific options */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm space-y-5 text-xs font-semibold">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider pb-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-primary" /> {config.graph_type} Properties
          </h3>

          {/* 1. Bar Chart Options */}
          {["Bar Chart", "Bar Plot", "barplot"].includes(config.graph_type) && (
            <div className="space-y-4">
              <div>
                <label className="text-2xs text-slate-500">Direction</label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={() => updateConfig({ ...config, orientation: "vertical" })}
                    className={`flex-1 py-1.5 rounded-lg border text-2xs font-bold cursor-pointer transition ${
                      config.orientation === "vertical" ? "border-primary text-primary bg-primary/5" : "border-slate-250 dark:border-zinc-800 text-slate-500"
                    }`}
                  >
                    Vertical
                  </button>
                  <button
                    onClick={() => updateConfig({ ...config, orientation: "horizontal" })}
                    className={`flex-1 py-1.5 rounded-lg border text-2xs font-bold cursor-pointer transition ${
                      config.orientation === "horizontal" ? "border-primary text-primary bg-primary/5" : "border-slate-250 dark:border-zinc-800 text-slate-500"
                    }`}
                  >
                    Horizontal
                  </button>
                </div>
              </div>

              {config.library === "plotly" && (
                <div>
                  <label className="text-2xs text-slate-500">Bar Mode</label>
                  <select
                    value={config.barmode}
                    onChange={(e) => updateConfig({ ...config, barmode: e.target.value })}
                    className="w-full mt-1.5 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-2xs"
                  >
                    <option value="group">Grouped Bars</option>
                    <option value="stack">Stacked Bars</option>
                    <option value="relative">Relative Mode</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-2xs text-slate-500 font-bold block">Sort Order</label>
                <select
                  value={config.sorting}
                  onChange={(e) => updateConfig({ ...config, sorting: e.target.value })}
                  className="w-full mt-1.5 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-2xs"
                >
                  <option value="none">Default order</option>
                  <option value="ascending">Ascending values</option>
                  <option value="descending">Descending values</option>
                </select>
              </div>

              <div>
                <label className="text-2xs text-slate-500 block">Bar Width / Padding</label>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={config.bar_width}
                  onChange={(e) => updateConfig({ ...config, bar_width: parseFloat(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.bar_width}</span>
              </div>
            </div>
          )}

          {/* 2. Pie Chart Options */}
          {["Pie Chart", "Pie Plot", "pie"].includes(config.graph_type) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-2xs text-slate-500">Donut Cutout (Hole)</label>
                <input
                  type="checkbox"
                  checked={config.donut}
                  onChange={(e) => updateConfig({ ...config, donut: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>

              {config.donut && (
                <div>
                  <label className="text-2xs text-slate-500 block">Hole Size</label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={config.hole_size}
                    onChange={(e) => updateConfig({ ...config, hole_size: parseFloat(e.target.value) })}
                    className="w-full mt-1.5 accent-primary"
                  />
                  <span className="text-[10px] text-slate-400 block text-right mt-1">{config.hole_size * 100}%</span>
                </div>
              )}
            </div>
          )}

          {/* 3. Histogram Options */}
          {["Histogram", "hist", "distributionchart"].includes(config.graph_type) && (
            <div className="space-y-4">
              <div>
                <label className="text-2xs text-slate-500">Density Normalization</label>
                <select
                  value={config.histnorm}
                  onChange={(e) => updateConfig({ ...config, histnorm: e.target.value })}
                  className="w-full mt-1.5 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-2xs"
                >
                  <option value="count">Count Frequency</option>
                  <option value="percent">Percentage %</option>
                  <option value="probability">Probability Score</option>
                  <option value="density">Density Profile</option>
                </select>
              </div>

              <div>
                <label className="text-2xs text-slate-500 block">Bin Counts</label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={config.bins}
                  onChange={(e) => updateConfig({ ...config, bins: parseInt(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.bins} Bins</span>
              </div>
            </div>
          )}

          {/* 4. Scatter Plot Options */}
          {["Scatter Plot", "scatter"].includes(config.graph_type) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-2xs text-slate-500">Display Trendline (OLS)</label>
                <input
                  type="checkbox"
                  checked={config.trend_line}
                  onChange={(e) => updateConfig({ ...config, trend_line: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-2xs text-slate-500 block">Marker Dot Size</label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={config.marker_size}
                  onChange={(e) => updateConfig({ ...config, marker_size: parseInt(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.marker_size}</span>
              </div>
            </div>
          )}

          {/* 5. Bubble Chart Options */}
          {["Bubble Chart", "bubble"].includes(config.graph_type) && (
            <div className="space-y-4">
              <div>
                <label className="text-2xs text-slate-500 block">Maximum Bubble Size</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={config.max_bubble_size}
                  onChange={(e) => updateConfig({ ...config, max_bubble_size: parseInt(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.max_bubble_size}</span>
              </div>
            </div>
          )}

          {/* 6. Heatmap Options */}
          {["Heatmap", "correlationchart"].includes(config.graph_type) && (
            <div className="space-y-4">
              <div>
                <label className="text-2xs text-slate-500">Color Palette</label>
                <select
                  value={config.color_palette}
                  onChange={(e) => updateConfig({ ...config, color_palette: e.target.value })}
                  className="w-full mt-1.5 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-2xs"
                >
                  <option value="viridis">Viridis (Sequential)</option>
                  <option value="coolwarm">Coolwarm (Diverging)</option>
                  <option value="magma">Magma (Sequential)</option>
                  <option value="rocket">Rocket (Sequential)</option>
                  <option value="mako">Mako (Sequential)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-2xs text-slate-500">Draw Value Labels</label>
                <input
                  type="checkbox"
                  checked={config.annotations}
                  onChange={(e) => updateConfig({ ...config, annotations: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-2xs text-slate-500">Force Square Cells</label>
                <input
                  type="checkbox"
                  checked={config.square_cells}
                  onChange={(e) => updateConfig({ ...config, square_cells: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* 7. Box Plot Options */}
          {["Box Plot", "box"].includes(config.graph_type) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-2xs text-slate-500">Show Outliers</label>
                <input
                  type="checkbox"
                  checked={config.show_outliers}
                  onChange={(e) => updateConfig({ ...config, show_outliers: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-2xs text-slate-500 block">Box Width</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={config.box_width}
                  onChange={(e) => updateConfig({ ...config, box_width: parseFloat(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.box_width}</span>
              </div>
            </div>
          )}

          {/* 8. 3D Scatter Plot Options */}
          {["3D Scatter Plot", "3dscatter"].includes(config.graph_type) && (
            <div className="space-y-4">
              <div>
                <label className="text-2xs text-slate-500 block">Perspective Eye X</label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.25"
                  value={config.camera_x}
                  onChange={(e) => updateConfig({ ...config, camera_x: parseFloat(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.camera_x}</span>
              </div>
              <div>
                <label className="text-2xs text-slate-500 block">Perspective Eye Y</label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.25"
                  value={config.camera_y}
                  onChange={(e) => updateConfig({ ...config, camera_y: parseFloat(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.camera_y}</span>
              </div>
            </div>
          )}

          {/* 9. Network Graph Options */}
          {["Network Graph", "relationshipchart"].includes(config.graph_type) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-2xs text-slate-500">Directed arrows</label>
                <input
                  type="checkbox"
                  checked={config.directed}
                  onChange={(e) => updateConfig({ ...config, directed: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-2xs text-slate-500">Layout Algorithm</label>
                <select
                  value={config.layout}
                  onChange={(e) => updateConfig({ ...config, layout: e.target.value })}
                  className="w-full mt-1.5 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-2xs"
                >
                  <option value="spring">Spring forces</option>
                  <option value="circular">Circular loop</option>
                  <option value="random">Random placement</option>
                  <option value="kamada-kawai">Kamada-Kawai</option>
                </select>
              </div>

              <div>
                <label className="text-2xs text-slate-500 block">Node Diameter Size</label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={config.node_size}
                  onChange={(e) => updateConfig({ ...config, node_size: parseInt(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.node_size}</span>
              </div>

              <div>
                <label className="text-2xs text-slate-500 block">Edge Line Thickness</label>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.5"
                  value={config.edge_width}
                  onChange={(e) => updateConfig({ ...config, edge_width: parseFloat(e.target.value) })}
                  className="w-full mt-1.5 accent-primary"
                />
                <span className="text-[10px] text-slate-400 block text-right mt-1">{config.edge_width}</span>
              </div>

              <div>
                <label className="text-2xs text-slate-500">Node Base Color</label>
                <input
                  type="color"
                  value={config.node_color}
                  onChange={(e) => updateConfig({ ...config, node_color: e.target.value })}
                  className="w-full mt-1.5 h-8 border rounded-lg cursor-pointer bg-transparent"
                />
              </div>
            </div>
          )}

          {/* Quick Stats Outliers warnings if any */}
          {profile && (
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4 text-3xs font-extrabold uppercase text-slate-400">
              Smart Engine Statistics
              <div className="mt-2 normal-case font-bold text-slate-500 dark:text-zinc-400 space-y-1">
                <div>Total Cells: {(profile.total_rows * profile.total_columns)?.toLocaleString()}</div>
                <div>Null Cells proportion: {profile.total_nulls?.toLocaleString()} ({((profile.total_nulls / (profile.total_rows * profile.total_columns || 1)) * 100).toFixed(1)}%)</div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Save Chart Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-black dark:text-white">Save Current Visualization</h3>
            <p className="text-2xs text-slate-400 leading-normal">
              Enter a descriptive name to store this visualization in your execution and audit log history.
            </p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="E.g. Monthly Marketing Spending vs conversions"
              className="w-full p-2.5 rounded-xl border border-slate-250 dark:border-zinc-800 text-xs bg-slate-50 dark:bg-zinc-950"
            />
            {savedSuccess && (
              <div className="p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-xs text-emerald-600 font-bold text-center">
                ✓ Visualization saved to history successfully!
              </div>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToHistory}
                disabled={saveLoading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-violet-600 hover:bg-violet-750 text-white cursor-pointer"
              >
                {saveLoading ? "Saving..." : "Save Chart"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
