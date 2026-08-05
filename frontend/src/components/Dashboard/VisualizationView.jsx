import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../services/api";
import FileUpload from "./FileUpload";
import GraphCanvas from "./GraphCanvas";
import { AnimatedSelect } from "../ui/AnimatedSelect";
import visualizationImg from "../../assets/icons/Visualization.png";
import RecentDatasetPanel from "../ui/RecentDatasetPanel";
import RefreshButton from "../ui/RefreshButton";
import {
  Sparkles,
  LineChart,
  BarChart2,
  BarChart3,
  PieChart,
  Activity,
  Sliders,
  Maximize2,
  Download,
  Copy,
  Trash2,
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
  Check,
  Code,
  Upload,
  FolderOpen,
  SlidersHorizontal,
  Layers,
  Palette as PaletteIcon,
  X,
  History,
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
  background_color: "#ffffff",
  text_color: "#1e293b",
  font_family: "sans-serif",

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
  camera_z: 1.25,
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
  setRestoredGraph,
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

  // FileUpload States
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const abortControllerRef = useRef(null);

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

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
      const uploadRes = await api.post("cleaning/upload/", formData, {
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
      const dsId = uploadRes.data.dataset_id;
      const previewRes = await api.get(`cleaning/${dsId}/preview/?offset=0&limit=100`);
      const analyzeRes = await api.get(`visualization/analyze/${dsId}/`);
      setDatasetId(dsId);
      setMetadata(previewRes.data.metadata);
      setPreview(previewRes.data);
      setReport(analyzeRes.data);
      setSuccessMsg("File uploaded successfully!");
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED" || (err.message && err.message.includes("canceled"))) {
        setErrorMsg("Upload canceled.");
      } else {
        setErrorMsg(err.response?.data?.error || "Failed to upload dataset for visualization.");
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSelectHistoryDataset = async (ds) => {
    setLoadingDatasetId(ds.id);
    setProfileLoading(true);
    try {
      const previewRes = await api.get(
        `cleaning/${ds.id}/preview/?offset=0&limit=100`,
      );
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

  // UI states
  const [activeSubTab, setActiveSubTab] = useState("data"); // data, properties, customization
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [canvasZoom, setCanvasZoom] = useState(1.0);
  const [canvasFullscreen, setCanvasFullscreen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const exportDropdownRef = useRef(null);

  // Saved Graphs & History Gallery states
  const [savedGraphs, setSavedGraphs] = useState([]);
  const [loadingSavedGraphs, setLoadingSavedGraphs] = useState(false);
  const [graphToDelete, setGraphToDelete] = useState(null);
  const [deletingGraph, setDeletingGraph] = useState(false);

  const formatDate = (isoStr) => {
    if (!isoStr) return "Just now";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  useEffect(() => {
    fetchSavedGraphs();
  }, []);

  const fetchSavedGraphs = async () => {
    setLoadingSavedGraphs(true);
    try {
      const res = await api.get("visualization/history/");
      let list = [];
      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data && Array.isArray(res.data.results)) {
        list = res.data.results;
      }
      setSavedGraphs(list);
    } catch (err) {
      console.error("Failed to load saved graphs:", err);
      setSavedGraphs([]);
    } finally {
      setLoadingSavedGraphs(false);
    }
  };

  const handleToggleFavorite = async (graph) => {
    try {
      const res = await api.patch(`visualization/history/${graph.id}/`, {
        is_favorite: !graph.is_favorite
      });
      setSavedGraphs(prev => prev.map(g => g.id === graph.id ? { ...g, is_favorite: res.data.is_favorite } : g));
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleDeleteSavedGraph = async () => {
    if (!graphToDelete) return;
    setDeletingGraph(true);
    try {
      await api.delete(`visualization/history/${graphToDelete.id}/`);
      setSavedGraphs(prev => prev.filter(g => g.id !== graphToDelete.id));
      setGraphToDelete(null);
    } catch (err) {
      console.error("Failed to delete saved graph:", err);
    } finally {
      setDeletingGraph(false);
    }
  };

  const handleLoadSavedGraphIntoStudio = async (graph) => {
    if (graph.config) {
      setConfig({
        ...initialConfig,
        ...graph.config,
      });
    }
    const dsId = graph.dataset || graph.dataset_id;
    if (dsId) {
      setLoadingDatasetId(dsId);
      try {
        const previewRes = await api.get(`cleaning/${dsId}/preview/?offset=0&limit=100`);
        const previewData = previewRes.data;
        const analyzeRes = await api.get(`visualization/analyze/${dsId}/`);
        setDatasetId(dsId);
        setMetadata(previewData.metadata);
        setPreview(previewData);
        setProfile(analyzeRes.data);
        setReport(analyzeRes.data);
      } catch (err) {
        console.error("Failed to load dataset details for saved graph:", err);
      } finally {
        setLoadingDatasetId(null);
      }
    }
    setSuccessMsg(`Loaded "${graph.name}" into Visualization Studio!`);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target)
      ) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const getFilteredXColumns = () => {
    if (!profile) return [];
    const numCols = profile.numeric_columns || [];
    const catCols = profile.categorical_columns || [];
    const dateCols = profile.date_columns || [];

    const type = config.graph_type;

    if (
      [
        "Scatter Plot",
        "Bubble Chart",
        "3D Scatter Plot",
        "Histogram",
        "Box Plot",
      ].includes(type)
    ) {
      return numCols;
    }
    if (type === "Pie Chart") {
      return [...catCols, ...numCols];
    }
    if (type === "Bar Chart") {
      return [...catCols, ...dateCols, ...numCols];
    }
    if (type === "Line Chart") {
      return [...dateCols, ...numCols, ...catCols];
    }
    return [...catCols, ...numCols, ...dateCols];
  };

  const getFilteredYColumns = () => {
    if (!profile) return [];
    const numCols = profile.numeric_columns || [];
    const catCols = profile.categorical_columns || [];

    const type = config.graph_type;
    if (
      [
        "Bar Chart",
        "Line Chart",
        "Scatter Plot",
        "Pie Chart",
        "Bubble Chart",
        "3D Scatter Plot",
        "Box Plot",
      ].includes(type)
    ) {
      return numCols;
    }
    return [...numCols, ...catCols];
  };

  const handleColumnSelection = (axis, columnName) => {
    updateConfig({ ...config, [axis]: columnName });
  };

  const getSuggestedGraph = () => {
    if (!profile || !config.x_column) return null;
    const xCol = config.x_column;
    const yCol = config.y_column;

    const isXNum = profile.numeric_columns?.includes(xCol);
    const isXCat = profile.categorical_columns?.includes(xCol);
    const isXDate = profile.date_columns?.includes(xCol);

    const isYNum = yCol ? profile.numeric_columns?.includes(yCol) : false;
    const isYCat = yCol ? profile.categorical_columns?.includes(yCol) : false;

    if (yCol) {
      if (isXDate && isYNum) return { library: "plotly", type: "Line Chart" };
      if (isXCat && isYNum) return { library: "plotly", type: "Bar Chart" };
      if (isXNum && isYNum) return { library: "plotly", type: "Scatter Plot" };
      if (isXCat && isYCat)
        return { library: "network", type: "Network Graph" };
    } else {
      if (isXNum) return { library: "plotly", type: "Histogram" };
      if (isXCat) return { library: "plotly", type: "Pie Chart" };
    }
    return null;
  };

  const escapeHtml = (text) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const highlightPythonCode = (codeText) => {
    if (!codeText) return "";

    const lines = codeText.split("\n");
    const keywords = new Set([
      "import",
      "as",
      "from",
      "def",
      "return",
      "if",
      "else",
      "elif",
      "in",
      "for",
      "while",
      "and",
      "or",
      "not",
      "True",
      "False",
      "None",
    ]);
    const builtins = new Set([
      "print",
      "len",
      "range",
      "str",
      "int",
      "float",
      "dict",
      "list",
      "set",
      "read_csv",
      "read_excel",
      "groupby",
      "update_layout",
      "plot",
      "show",
      "bar",
      "barh",
      "scatter",
      "hist",
      "pie",
      "heatmap",
      "lineplot",
      "boxplot",
      "corr",
      "subplots",
      "update_xaxes",
      "update_yaxes",
      "add_annotation",
    ]);

    const highlightedLines = lines.map((line) => {
      let mainPart = line;
      let commentPart = "";
      const hashIdx = line.indexOf("#");
      if (hashIdx !== -1) {
        mainPart = line.substring(0, hashIdx);
        commentPart = line.substring(hashIdx);
      }

      const regex = /('[^']*'|"[^"]*"|[a-zA-Z_]\w*|[^a-zA-Z_'"\s]+|\s+)/g;
      let tokens = mainPart.match(regex) || [];

      const processedTokens = tokens.map((token) => {
        const trimmed = token.trim();
        if (
          (token.startsWith("'") && token.endsWith("'")) ||
          (token.startsWith('"') && token.endsWith('"'))
        ) {
          return `<span class="text-emerald-600 dark:text-emerald-400 font-semibold">${escapeHtml(token)}</span>`;
        }
        if (keywords.has(trimmed)) {
          return `<span class="text-violet-600 dark:text-purple-400 font-bold">${token}</span>`;
        }
        if (builtins.has(trimmed)) {
          return `<span class="text-[#673ab7] dark:text-[#a855f7] font-semibold">${token}</span>`;
        }
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
          return `<span class="text-amber-600 dark:text-amber-400">${token}</span>`;
        }
        return escapeHtml(token);
      });

      let finalLine = processedTokens.join("");
      if (commentPart) {
        finalLine += `<span class="text-slate-400 dark:text-zinc-500 font-normal">${escapeHtml(commentPart)}</span>`;
      }
      return finalLine;
    });

    const html = highlightedLines.join("\n");
    return <code dangerouslySetInnerHTML={{ __html: html }} />;
  };

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
      res.data.forEach((item) => {
        if (item.dataset_id && !seenIds.has(item.dataset_id)) {
          seenIds.add(item.dataset_id);
          uniqueDatasets.push({
            id: item.dataset_id,
            name: item.dataset_name,
            created_at: item.created_at,
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
      // Leave X and Y columns unassigned on load so they default to "-None-"
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
    setUndoStack((prev) => [...prev, config]);
    setRedoStack([]);
    setConfig(newConfig);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, config]);
    setConfig(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, config]);
    setConfig(next);
  };

  const handleReset = () => {
    updateConfig(initialConfig);
  };

  // Trigger chart generation with debouncing
  const triggerGeneration = useCallback(
    (currentConfig) => {
      if (!datasetId) return;

      setGenerating(true);
      setGenError("");
      setGenReason("");
      setGenRec("");

      api
        .post("visualization/generate/", {
          dataset_id: datasetId,
          config: currentConfig,
        })
        .then((res) => {
          if (res.data.success === false) {
            setGenError(res.data.error || "Failed to generate graph.");
            setGenReason(res.data.reason || "Invalid column configurations.");
            setGenRec(res.data.recommended || "");
            setChartHtml("");
            setChartImage("");
          } else {
            setChartHtml(res.data.html || "");
            setChartImage(res.data.image || "");
            setPythonCode(res.data.python_code || "");
            setGenNotes(res.data.notes || []);
            setGenError("");
            setGenReason("");
            setGenRec("");
          }
        })
        .catch((err) => {
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
    },
    [datasetId],
  );

  useEffect(() => {
    if (restoredGraph) {
      if (restoredGraph.config) {
        setConfig({
          ...initialConfig,
          ...restoredGraph.config,
        });
      }
      setRestoredGraph(null);
    }
  }, [restoredGraph, setRestoredGraph]);

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
    let updated = {
      ...initialConfig,
      background_color: config.background_color,
      text_color: config.text_color,
      font_family: config.font_family,
      font_size: config.font_size,
      width: config.width,
      height: config.height,
    };

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
        dataset_name: metadata?.name || "Dataset",
        name: saveName.trim(),
        graph_type: config.graph_type,
        library: config.library,
        config: config,
        preview_data: chartImage,
        python_code: pythonCode,
      });
      setSavedSuccess(true);
      fetchSavedGraphs();
      setTimeout(() => {
        setShowSaveDialog(false);
        setSavedSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to save visualization graph:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    setShowExportDropdown(false);
    try {
      const res = await api.post(
        "visualization/export/",
        {
          dataset_id: datasetId,
          config: config,
          format: format,
        },
        { responseType: "blob" },
      );

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const fileExt =
        format === "csv"
          ? "csv"
          : format === "json"
            ? "json"
            : format === "html"
              ? "html"
              : format;
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
      <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0 py-1 mb-6">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Data Visualization
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-zinc-400 mt-0.5">
              Configure data parameters, aesthetics, and layout controls to export production-ready charts
            </p>
          </div>
        </div>

        {/* 70% / 30% Split Layout */}
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
                setPreview(null);
                setErrorMsg("");
                setSuccessMsg("");
              }}
            />
          </div>

          {/* 30% Right: Recent Datasets Sidebar Card */}
          {datasetsList.length > 0 && (
            <div className="lg:col-span-4 w-full">
              <RecentDatasetPanel
                items={datasetsList}
                onSelect={(ds) => handleSelectHistoryDataset(ds)}
                onViewAll={() => setActiveTab("history")}
                loadingId={loadingDatasetId}
              />
            </div>
          )}
        </div>

        {/* Saved Graphs Gallery Card (When no dataset loaded - Outside View) */}
        {savedGraphs.length > 0 && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <LineChart className="w-5 h-5 text-violet-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Saved Graphs Gallery</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {savedGraphs.length} {savedGraphs.length === 1 ? "Graph" : "Graphs"} Saved
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {savedGraphs.map((graph) => (
                <div 
                  key={graph.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-violet-500/40 transition duration-200 flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    {graph.preview_data && (
                      <div className="w-full h-32 bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-200 dark:border-zinc-700">
                        <img src={graph.preview_data} alt={graph.name} className="max-h-full max-w-full object-contain rounded" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                          {graph.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Dataset: {graph.dataset_name || "Dataset"} • {formatDate(graph.created_at)}
                        </span>
                      </div>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      {graph.graph_type} ({graph.library})
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800">
                    <button
                      onClick={() => handleLoadSavedGraphIntoStudio(graph)}
                      disabled={loadingDatasetId === (graph.dataset || graph.dataset_id)}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {loadingDatasetId === (graph.dataset || graph.dataset_id) ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading...
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Load in Studio
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setGraphToDelete(graph)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete Saved Graph"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal (Outside View) */}
        {graphToDelete && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#212121] border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col gap-5">
              <div className="flex items-center gap-3 text-rose-500">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Saved Graph?</h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{graphToDelete.name}</strong>? <strong className="text-rose-500 font-bold">This action cannot be restored.</strong>
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  disabled={deletingGraph}
                  onClick={() => setGraphToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  disabled={deletingGraph}
                  onClick={handleDeleteSavedGraph}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {deletingGraph ? (
                    <span className="animate-pulse">Deleting Graph...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Graph
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-zinc-100 font-sans pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0 py-1 mb-6">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Data Visualization
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-zinc-400 mt-0.5">
            Configure data parameters, aesthetics, and layout controls to export production-ready charts
          </p>
        </div>

        <RefreshButton
          label="Switch Dataset"
          title="Switch to another dataset"
          onClick={() => {
            setDatasetId(null);
            setProfile(null);
            setRecommendations([]);
            setChartHtml("");
            setChartImage("");
            setPythonCode("");
          }}
        />
      </div>

      {/* Dataset Profile Auto-Analysis Info Summary */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] shadow-sm">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              Total Rows
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block">
              {profile.total_rows?.toLocaleString()}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] shadow-sm">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              Total Columns
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block">
              {profile.total_columns}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] shadow-sm">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              File Size
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 block">
              {(profile.file_size / 1024).toFixed(1)} KB
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] shadow-sm">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              Numeric Columns
            </span>
            <span className="text-sm font-bold text-[#673ab7] dark:text-[#a855f7] mt-1 block">
              {profile.numeric_columns?.length || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] shadow-sm">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              Categorical Columns
            </span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
              {profile.categorical_columns?.length || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] shadow-sm">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
              Duplicate Rows
            </span>
            <span className="text-sm font-bold text-rose-500 mt-1 block">
              {profile.duplicate_rows || 0}
            </span>
          </div>
        </div>
      )}

      {/* Auto Graph Recommendation Carousel Row */}
      {recommendations.length > 0 && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] shadow-sm">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3.5 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />{" "}
            Recommended Visualizations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div
                key={idx}
                onClick={() => handleApplyRecommendation(rec)}
                className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] hover:border-black dark:hover:border-white transition-all duration-300 ease-out cursor-pointer select-none active:scale-[0.98] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                      {rec.graph_type}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {Math.round(rec.confidence_score * 100)}% Match
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 mt-2.5 leading-relaxed">
                    {rec.reason}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5">
                    <strong className="text-slate-600 dark:text-zinc-300">
                      Use case:
                    </strong>{" "}
                    {rec.business_use_case}
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-2.5 mt-3">
                  <span className="text-[10px] font-medium text-slate-400">
                    Level: {rec.difficulty_level}
                  </span>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    Apply Plot <Plus className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Studio layout: properties (left) + canvas (middle) + options (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Data mappings, specific chart settings, and color customizations */}
        <div className="lg:col-span-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] shadow-sm flex flex-col gap-4 max-w-full overflow-hidden lg:sticky lg:top-4 z-10 max-h-[calc(100vh-60px)] overflow-y-auto">
          <div className="space-y-4">
            {/* Side sub tab header (iOS Segmented Pill Switch) */}
            <div className="grid grid-cols-3 p-1 rounded-full bg-[#e3e3e8] dark:bg-[#1c1c1e] border border-slate-200/60 dark:border-zinc-800/80 shadow-inner text-center text-xs font-semibold">
              <button
                onClick={() => setActiveSubTab("data")}
                className={`py-1.5 px-2 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSubTab === "data"
                    ? "bg-white dark:bg-[#3a3a3c] text-[#1c1c1e] dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-zinc-700/60"
                    : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white"
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${activeSubTab === "data" ? "text-purple-600 dark:text-purple-400" : ""}`} /> Data
              </button>
              <button
                onClick={() => setActiveSubTab("properties")}
                className={`py-1.5 px-2 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSubTab === "properties"
                    ? "bg-white dark:bg-[#3a3a3c] text-[#1c1c1e] dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-zinc-700/60"
                    : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white"
                }`}
              >
                <SlidersHorizontal className={`w-3.5 h-3.5 ${activeSubTab === "properties" ? "text-purple-600 dark:text-purple-400" : ""}`} /> Config
              </button>
              <button
                onClick={() => setActiveSubTab("customization")}
                className={`py-1.5 px-2 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSubTab === "customization"
                    ? "bg-white dark:bg-[#3a3a3c] text-[#1c1c1e] dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-zinc-700/60"
                    : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white"
                }`}
              >
                <PaletteIcon className={`w-3.5 h-3.5 ${activeSubTab === "customization" ? "text-purple-600 dark:text-purple-400" : ""}`} /> Style
              </button>
            </div>

            {/* TAB 1: DATA SETTINGS */}
            {activeSubTab === "data" && profile && (
              <div className="space-y-4 text-xs font-semibold max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {/* Library Selection */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Engine Engine
                  </label>
                  <AnimatedSelect
                    value={config.library}
                    onChange={(val) => {
                      const lib = String(val).toLowerCase();
                      let defGraph = "Bar Chart";
                      if (lib === "plotly") defGraph = "Bar Chart";
                      else if (lib === "seaborn") defGraph = "Heatmap";
                      else if (lib === "matplotlib") defGraph = "Line Chart";
                      else if (lib === "network") defGraph = "Network Graph";

                      updateConfig({
                        ...config,
                        library: lib,
                        graph_type: defGraph,
                        x_column: "",
                        y_column: "",
                        z_column: "",
                        color_column: "",
                        size_column: "",
                        source_column: "",
                        target_column: "",
                      });
                    }}
                    options={[
                      { value: "plotly", label: "Plotly" },
                      { value: "seaborn", label: "Seaborn" },
                      { value: "matplotlib", label: "Matplotlib" },
                      { value: "network", label: "NetworkX" },
                    ]}
                    className="w-full mt-1.5"
                  />
                </div>

                {/* Filtered Graph Selection */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Visualization Type
                  </label>
                  <AnimatedSelect
                    value={config.graph_type}
                    onChange={(val) => {
                      updateConfig({
                        ...config,
                        graph_type: val,
                        x_column: "",
                        y_column: "",
                        z_column: "",
                        color_column: "",
                        size_column: "",
                        source_column: "",
                        target_column: "",
                      });
                    }}
                    options={
                      config.library === "plotly"
                        ? [
                            "Bar Chart",
                            "Line Chart",
                            "Pie Chart",
                            "Scatter Plot",
                            "Histogram",
                            "Bubble Chart",
                            "3D Scatter Plot",
                            "Scatter Matrix",
                          ]
                        : config.library === "seaborn"
                        ? ["Heatmap", "Scatter Plot", "Box Plot"]
                        : config.library === "matplotlib"
                        ? ["Line Chart", "Bar Chart", "Scatter Plot", "Histogram", "Pie Chart"]
                        : config.library === "network"
                        ? ["Network Graph"]
                        : ["Bar Chart"]
                    }
                    className="w-full mt-1.5"
                  />
                </div>

                {/* Mappings */}
                {config.graph_type === "Network Graph" ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Source Node Column
                      </label>
                      <AnimatedSelect
                        value={config.source_column}
                        onChange={(val) => handleColumnSelection("source_column", val)}
                        options={[
                          { value: "", label: "-- None --" },
                          ...[
                            ...profile.categorical_columns,
                            ...profile.numeric_columns,
                            ...profile.text_columns,
                          ].map((c) => ({ value: c, label: c })),
                        ]}
                        className="w-full mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Target Node Column
                      </label>
                      <AnimatedSelect
                        value={config.target_column}
                        onChange={(val) => handleColumnSelection("target_column", val)}
                        options={[
                          { value: "", label: "-- None --" },
                          ...[
                            ...profile.categorical_columns,
                            ...profile.numeric_columns,
                            ...profile.text_columns,
                          ].map((c) => ({ value: c, label: c })),
                        ]}
                        className="w-full mt-1.5"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* X axis */}
                    {config.graph_type !== "Scatter Matrix" && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          {config.graph_type === "Pie Chart"
                            ? "Labels Column"
                            : "X Axis Column"}
                        </label>
                        <AnimatedSelect
                          value={config.x_column}
                          onChange={(val) => handleColumnSelection("x_column", val)}
                          options={[
                            { value: "", label: "-- None --" },
                            ...getFilteredXColumns().map((c) => ({ value: c, label: c })),
                          ]}
                          className="w-full mt-1.5"
                        />
                      </div>
                    )}

                    {/* Y axis */}
                    {[
                      "Bar Chart",
                      "Line Chart",
                      "Scatter Plot",
                      "Pie Chart",
                      "Bubble Chart",
                      "3D Scatter Plot",
                      "Box Plot",
                    ].includes(config.graph_type) && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          {config.graph_type === "Pie Chart"
                            ? "Values Column"
                            : "Y Axis Column"}
                        </label>
                        <AnimatedSelect
                          value={config.y_column}
                          onChange={(val) => handleColumnSelection("y_column", val)}
                          options={[
                            { value: "", label: "-- None --" },
                            ...getFilteredYColumns().map((c) => ({ value: c, label: c })),
                          ]}
                          className="w-full mt-1.5"
                        />
                      </div>
                    )}

                    {/* Z axis (3D Scatter only) */}
                    {config.graph_type === "3D Scatter Plot" && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Z Axis Column
                        </label>
                        <AnimatedSelect
                          value={config.z_column}
                          onChange={(val) => updateConfig({ ...config, z_column: val })}
                          options={[
                            { value: "", label: "-- None --" },
                            ...profile.numeric_columns.map((c) => ({ value: c, label: c })),
                          ]}
                          className="w-full mt-1.5"
                        />
                      </div>
                    )}

                    {/* Bubble size (Bubble only) */}
                    {config.graph_type === "Bubble Chart" && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Bubble Size Column
                        </label>
                        <AnimatedSelect
                          value={config.size_column}
                          onChange={(val) => updateConfig({ ...config, size_column: val })}
                          options={[
                            { value: "", label: "-- None --" },
                            ...profile.numeric_columns.map((c) => ({ value: c, label: c })),
                          ]}
                          className="w-full mt-1.5"
                        />
                      </div>
                    )}

                    {/* Color mapping column */}
                    {[
                      "Bar Chart",
                      "Line Chart",
                      "Scatter Plot",
                      "Bubble Chart",
                      "3D Scatter Plot",
                      "Scatter Matrix",
                    ].includes(config.graph_type) && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Color Group Column
                        </label>
                        <AnimatedSelect
                          value={config.color_column}
                          onChange={(val) => updateConfig({ ...config, color_column: val })}
                          options={[
                            { value: "", label: "-- None --" },
                            ...[
                              ...profile.categorical_columns,
                              ...profile.numeric_columns,
                            ].map((c) => ({ value: c, label: c })),
                          ]}
                          className="w-full mt-1.5"
                        />
                      </div>
                    )}

                    {/* Scatter Matrix dimension selector */}
                    {config.graph_type === "Scatter Matrix" && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Select Dimensions
                        </label>
                        <div className="mt-1.5 max-h-36 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-lg p-2 bg-slate-50 dark:bg-zinc-900 space-y-1.5">
                          {profile.numeric_columns.map((col) => {
                            const dims = config.dimensions || [];
                            const checked = dims.includes(col);
                            return (
                              <label
                                key={col}
                                className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const updatedDims = checked
                                      ? dims.filter((d) => d !== col)
                                      : [...dims, col];
                                    updateConfig({
                                      ...config,
                                      dimensions: updatedDims,
                                    });
                                  }}
                                  className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                                />
                                {col}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* RefineX Recommendation box */}
                {getSuggestedGraph() &&
                  getSuggestedGraph().type !== config.graph_type && (
                    <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 text-xs mt-3 flex flex-col gap-2 font-medium">
                      <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-bold">
                        <Info className="w-3.5 h-3.5" /> Suggestion
                      </div>
                      <p className="text-slate-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                        Based on column selections, consider using a{" "}
                        <strong className="text-[#673ab7] dark:text-[#a855f7]">
                          {getSuggestedGraph().type}
                        </strong>
                        .
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig({
                            ...config,
                            library: getSuggestedGraph().library,
                            graph_type: getSuggestedGraph().type,
                          })
                        }
                        className="px-2.5 py-1.5 bg-[#673ab7] hover:bg-[#522e93] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider self-start cursor-pointer transition shadow-sm"
                      >
                        Apply Suggestion
                      </button>
                    </div>
                  )}
              </div>
            )}

            {/* TAB 2: SPECIFIC PROPERTIES */}
            {activeSubTab === "properties" && (
              <div className="space-y-4 text-xs font-semibold max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {/* 1. Bar Chart Options */}
                {["Bar Chart", "Bar Plot", "barplot"].includes(
                  config.graph_type,
                ) && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Direction
                      </label>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() =>
                            updateConfig({ ...config, orientation: "vertical" })
                          }
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            config.orientation === "vertical"
                              ? "border-[#673ab7] text-[#673ab7] dark:text-[#a855f7] bg-purple-50/50 dark:bg-purple-950/30"
                              : "border-slate-200 dark:border-zinc-800 text-slate-500"
                          }`}
                        >
                          Vertical
                        </button>
                        <button
                          onClick={() =>
                            updateConfig({
                              ...config,
                              orientation: "horizontal",
                            })
                          }
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            config.orientation === "horizontal"
                              ? "border-[#673ab7] text-[#673ab7] dark:text-[#a855f7] bg-purple-50/50 dark:bg-purple-950/30"
                              : "border-slate-200 dark:border-zinc-800 text-slate-500"
                          }`}
                        >
                          Horizontal
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Bar Layout Mode
                      </label>
                      <AnimatedSelect
                        value={config.barmode}
                        onChange={(val) => updateConfig({ ...config, barmode: val })}
                        options={[
                          { value: "group", label: "Side-by-side (Group)" },
                          { value: "stack", label: "Stacked" },
                          { value: "relative", label: "Relative" },
                        ]}
                        className="w-full mt-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Bar Width
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={config.bar_width}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            bar_width: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.bar_width}
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Duplicate Aggregation
                      </label>
                      <AnimatedSelect
                        value={config.aggregation}
                        onChange={(val) => updateConfig({ ...config, aggregation: val })}
                        options={[
                          { value: "sum", label: "Sum values" },
                          { value: "mean", label: "Mean (Average)" },
                          { value: "count", label: "Count Occurrences" },
                        ]}
                        className="w-full mt-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Sorting Order
                      </label>
                      <AnimatedSelect
                        value={config.sorting}
                        onChange={(val) => updateConfig({ ...config, sorting: val })}
                        options={[
                          { value: "none", label: "Default Order" },
                          { value: "ascending", label: "Ascending Values" },
                          { value: "descending", label: "Descending Values" },
                        ]}
                        className="w-full mt-1.5"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Pie Chart Options */}
                {["Pie Chart", "Pie Plot", "pieplot"].includes(
                  config.graph_type,
                ) && (
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <input
                        type="checkbox"
                        checked={config.donut}
                        onChange={(e) =>
                          updateConfig({ ...config, donut: e.target.checked })
                        }
                        className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                      />
                      Donut Hole Layout
                    </label>

                    {config.donut && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Hole Size
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.05"
                          value={config.hole_size}
                          onChange={(e) =>
                            updateConfig({
                              ...config,
                              hole_size: parseFloat(e.target.value),
                            })
                          }
                          className="w-full mt-1.5 accent-[#673ab7]"
                        />
                        <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                          {Math.round(config.hole_size * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Histogram Options */}
                {["Histogram", "dist", "distplot"].includes(
                  config.graph_type,
                ) && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Bins Count
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        step="1"
                        value={config.bins}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            bins: parseInt(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.bins} Bins
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Normalize Type
                      </label>
                      <AnimatedSelect
                        value={config.histnorm}
                        onChange={(val) => updateConfig({ ...config, histnorm: val })}
                        options={[
                          { value: "count", label: "Count Frequency" },
                          { value: "percent", label: "Percentage %" },
                          { value: "probability", label: "Probability [0-1]" },
                          { value: "density", label: "Density" },
                        ]}
                        className="w-full mt-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Bars Orientation
                      </label>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() =>
                            updateConfig({ ...config, orientation: "vertical" })
                          }
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            config.orientation === "vertical"
                              ? "border-[#673ab7] text-[#673ab7] dark:text-[#a855f7] bg-purple-50/50 dark:bg-purple-950/30"
                              : "border-slate-200 dark:border-zinc-800 text-slate-500"
                          }`}
                        >
                          Vertical
                        </button>
                        <button
                          onClick={() =>
                            updateConfig({
                              ...config,
                              orientation: "horizontal",
                            })
                          }
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                            config.orientation === "horizontal"
                              ? "border-[#673ab7] text-[#673ab7] dark:text-[#a855f7] bg-purple-50/50 dark:bg-purple-950/30"
                              : "border-slate-200 dark:border-zinc-800 text-slate-500"
                          }`}
                        >
                          Horizontal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Scatter Plot Options */}
                {["Scatter Plot", "scatterplot", "scatter"].includes(
                  config.graph_type,
                ) && (
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <input
                        type="checkbox"
                        checked={config.trend_line}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            trend_line: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                      />
                      Add OLS Trend Line
                    </label>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Marker Point Size
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        step="5"
                        value={config.marker_size}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            marker_size: parseInt(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.marker_size}px
                      </span>
                    </div>
                  </div>
                )}

                {/* 5. Bubble Chart Options */}
                {config.graph_type === "Bubble Chart" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Max Bubble Size
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        step="5"
                        value={config.max_bubble_size}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            max_bubble_size: parseInt(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.max_bubble_size}px
                      </span>
                    </div>
                  </div>
                )}

                {/* 6. Heatmap Options */}
                {["Heatmap", "correlationchart"].includes(
                  config.graph_type,
                ) && (
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <input
                        type="checkbox"
                        checked={config.annotations}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            annotations: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                      />
                      Show Cell Value Annotations
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <input
                        type="checkbox"
                        checked={config.square_cells}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            square_cells: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                      />
                      Force Square Grid Cells
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <input
                        type="checkbox"
                        checked={config.color_bar}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            color_bar: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                      />
                      Show Sidebar Colorbar
                    </label>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Color Palette / Gradient
                      </label>
                      <AnimatedSelect
                        value={config.color_palette}
                        onChange={(val) => updateConfig({ ...config, color_palette: val })}
                        options={[
                          { value: "viridis", label: "Viridis (Purple-Teal-Yellow)" },
                          { value: "plasma", label: "Plasma (Purple-Red-Yellow)" },
                          { value: "magma", label: "Magma (Dark-Pink-White)" },
                          { value: "cividis", label: "Cividis (Blue-Yellow)" },
                          { value: "coolwarm", label: "Coolwarm (Blue-White-Red)" },
                          { value: "rdbu", label: "RdBu (Red-White-Blue)" },
                          { value: "spectral", label: "Spectral (Rainbow Gradient)" },
                          { value: "inferno", label: "Inferno (Black-Red-Yellow)" },
                          { value: "turbo", label: "Turbo (Vibrant Multi-Color)" },
                          { value: "blues", label: "Blues (Deep Blue Gradient)" },
                          { value: "purples", label: "Purples (Deep Purple Gradient)" },
                        ]}
                        className="w-full mt-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Cell Border Width
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={config.grid_width}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            grid_width: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.grid_width}px
                      </span>
                    </div>
                  </div>
                )}

                {/* 7. Box Plot Options */}
                {["Box Plot", "boxplot", "box"].includes(config.graph_type) && (
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <input
                        type="checkbox"
                        checked={config.show_outliers}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            show_outliers: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                      />
                      Show Outlier Points
                    </label>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Box Capsule Width
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={config.box_width}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            box_width: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.box_width}
                      </span>
                    </div>
                  </div>
                )}

                {/* 8. Network Graph Options */}
                {config.graph_type === "Network Graph" && (
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <input
                        type="checkbox"
                        checked={config.directed}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            directed: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                      />
                      Directed Edges (Arrows)
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <input
                        type="checkbox"
                        checked={config.show_labels}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            show_labels: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                      />
                      Show Node Labels
                    </label>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Layout Topology
                      </label>
                      <AnimatedSelect
                        value={config.layout}
                        onChange={(val) => updateConfig({ ...config, layout: val })}
                        options={[
                          { value: "spring", label: "Spring-Force layout" },
                          { value: "kamada-kawai", label: "Kamada-Kawai layout" },
                          { value: "circular", label: "Circular layout" },
                          { value: "random", label: "Random layout" },
                        ]}
                        className="w-full mt-1.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Node Size
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="2500"
                        step="100"
                        value={config.node_size}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            node_size: parseInt(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.node_size}
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Edge Width
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="8"
                        step="0.5"
                        value={config.edge_width}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            edge_width: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.edge_width}px
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Node Base Color
                      </label>
                      <input
                        type="color"
                        value={config.node_color}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            node_color: e.target.value,
                          })
                        }
                        className="w-full mt-1.5 h-8 border rounded-lg cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* 9. 3D Options */}
                {config.graph_type === "3D Scatter Plot" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Camera X Orbit
                      </label>
                      <input
                        type="range"
                        min="-3.0"
                        max="3.0"
                        step="0.1"
                        value={config.camera_x}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            camera_x: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.camera_x}
                      </span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Camera Y Orbit
                      </label>
                      <input
                        type="range"
                        min="-3.0"
                        max="3.0"
                        step="0.1"
                        value={config.camera_y}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            camera_y: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.camera_y}
                      </span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Camera Z Orbit
                      </label>
                      <input
                        type="range"
                        min="-3.0"
                        max="3.0"
                        step="0.1"
                        value={config.camera_z}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            camera_z: parseFloat(e.target.value),
                          })
                        }
                        className="w-full mt-1.5 accent-[#673ab7]"
                      />
                      <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                        {config.camera_z}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CUSTOMIZATION SETTINGS */}
            {activeSubTab === "customization" && (
              <div className="space-y-4 text-xs font-semibold max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {/* Titles */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Chart Main Title
                  </label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) =>
                      updateConfig({ ...config, title: e.target.value })
                    }
                    placeholder="Enter main title..."
                    className="w-full mt-1.5 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={config.subtitle}
                    onChange={(e) =>
                      updateConfig({ ...config, subtitle: e.target.value })
                    }
                    placeholder="Enter subtitle..."
                    className="w-full mt-1.5 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Footnote Caption
                  </label>
                  <input
                    type="text"
                    value={config.caption}
                    onChange={(e) =>
                      updateConfig({ ...config, caption: e.target.value })
                    }
                    placeholder="Enter caption metadata..."
                    className="w-full mt-1.5 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 focus:outline-none"
                  />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Canvas BG
                    </label>
                    <input
                      type="color"
                      value={config.background_color}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          background_color: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 h-8 border rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={config.text_color}
                      onChange={(e) =>
                        updateConfig({ ...config, text_color: e.target.value })
                      }
                      className="w-full mt-1.5 h-8 border rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                {/* Seaborn Palette */}
                {config.library === "seaborn" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Color Palette
                    </label>
                    <AnimatedSelect
                      value={config.color_palette}
                      onChange={(val) => updateConfig({ ...config, color_palette: val })}
                      options={[
                        { value: "deep", label: "Deep" },
                        { value: "muted", label: "Muted" },
                        { value: "bright", label: "Bright" },
                        { value: "dark", label: "Dark" },
                        { value: "colorblind", label: "Colorblind" },
                        { value: "viridis", label: "Viridis" },
                        { value: "magma", label: "Magma" },
                        { value: "coolwarm", label: "Coolwarm" },
                      ]}
                      className="w-full mt-1.5"
                    />
                  </div>
                )}

                {/* Typography */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Font Family
                  </label>
                  <AnimatedSelect
                    value={config.font_family}
                    onChange={(val) => updateConfig({ ...config, font_family: val })}
                    options={[
                      { value: "sans-serif", label: "Modern Sans-Serif" },
                      { value: "serif", label: "Classic Serif" },
                      { value: "monospace", label: "Developer Monospace" },
                      { value: "Inter", label: "Inter (Premium)" },
                      { value: "Outfit", label: "Outfit (Design)" },
                    ]}
                    className="w-full mt-1.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Font Size
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="24"
                    value={config.font_size}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        font_size: parseInt(e.target.value),
                      })
                    }
                    className="w-full mt-1.5 accent-[#673ab7]"
                  />
                  <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                    {config.font_size}px
                  </span>
                </div>

                {/* Grid & Legend */}
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <input
                      type="checkbox"
                      checked={config.grid}
                      onChange={(e) =>
                        updateConfig({ ...config, grid: e.target.checked })
                      }
                      className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                    />
                    Show Grid
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <input
                      type="checkbox"
                      checked={config.legend}
                      onChange={(e) =>
                        updateConfig({ ...config, legend: e.target.checked })
                      }
                      className="rounded border-slate-300 text-[#673ab7] focus:ring-[#673ab7] cursor-pointer"
                    />
                    Show Legend
                  </label>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Width
                    </label>
                    <input
                      type="number"
                      min="300"
                      max="2000"
                      value={config.width}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          width: parseInt(e.target.value),
                        })
                      }
                      className="w-full mt-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Height
                    </label>
                    <input
                      type="number"
                      min="200"
                      max="1500"
                      value={config.height}
                      onChange={(e) =>
                        updateConfig({
                          ...config,
                          height: parseInt(e.target.value),
                        })
                      }
                      className="w-full mt-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Margins */}
                {config.library === "plotly" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Margins (L / R / T / B)
                    </label>
                    <div className="grid grid-cols-4 gap-1 mt-1.5">
                      <input
                        type="number"
                        value={config.margin_left}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            margin_left: parseInt(e.target.value),
                          })
                        }
                        className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-center focus:outline-none text-xs"
                        title="Left margin"
                      />
                      <input
                        type="number"
                        value={config.margin_right}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            margin_right: parseInt(e.target.value),
                          })
                        }
                        className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-center focus:outline-none text-xs"
                        title="Right margin"
                      />
                      <input
                        type="number"
                        value={config.margin_top}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            margin_top: parseInt(e.target.value),
                          })
                        }
                        className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-center focus:outline-none text-xs"
                        title="Top margin"
                      />
                      <input
                        type="number"
                        value={config.margin_bottom}
                        onChange={(e) =>
                          updateConfig({
                            ...config,
                            margin_bottom: parseInt(e.target.value),
                          })
                        }
                        className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-center focus:outline-none text-xs"
                        title="Bottom margin"
                      />
                    </div>
                  </div>
                )}

                {/* Label Rotation */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Axis Label Rotation
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={config.axis_rotation}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        axis_rotation: parseInt(e.target.value),
                      })
                    }
                    className="w-full mt-1.5 accent-[#673ab7]"
                  />
                  <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                    {config.axis_rotation}°
                  </span>
                </div>

                {/* Opacity */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Drawing Opacity
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={config.opacity}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        opacity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full mt-1.5 accent-[#673ab7]"
                  />
                  <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                    {Math.round(config.opacity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas Area: Toolbar + canvas display + smart notes list */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <div className="bg-white dark:bg-[#212121] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {/* Horizontal Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-900/30">
              {/* Undo / Redo */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 cursor-pointer transition"
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 cursor-pointer transition"
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider border border-slate-200 dark:border-zinc-700 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer transition ml-1"
                >
                  Reset
                </button>
              </div>

              {/* Save & Export & View Code */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCodeDialog(true)}
                  disabled={!pythonCode}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1.5 transition shadow-sm"
                >
                  <Code className="w-3.5 h-3.5" /> View Code
                </button>

                <button
                  onClick={() => {
                    setSaveName(`${config.graph_type} for ${metadata.name}`);
                    setShowSaveDialog(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#673ab7] hover:bg-[#522e93] text-white rounded-lg cursor-pointer flex items-center gap-1.5 transition shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>

                <div className="relative" ref={exportDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    disabled={exportLoading}
                    className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-white cursor-pointer transition-all duration-200 shadow-xs active:scale-95 disabled:opacity-50 select-none"
                  >
                    <Download className="w-3.5 h-3.5 text-white dark:text-slate-900" />
                    <span>{exportLoading ? "Exporting..." : "Export"}</span>
                    <ChevronDown className={`w-3 h-3 text-white dark:text-slate-900 transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showExportDropdown && (
                    <div className="absolute right-0 mt-2 w-38 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 py-1 font-bold text-xs overflow-hidden">
                      <button
                        onClick={() => { handleExport("png"); setShowExportDropdown(false); }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300 transition-colors"
                      >
                        PNG Image
                      </button>
                      <button
                        onClick={() => { handleExport("svg"); setShowExportDropdown(false); }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300 transition-colors"
                      >
                        SVG Vector
                      </button>
                      <button
                        onClick={() => { handleExport("jpeg"); setShowExportDropdown(false); }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300 transition-colors"
                      >
                        JPEG Image
                      </button>
                      <button
                        onClick={() => handleExport("pdf")}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300"
                      >
                        PDF Document
                      </button>
                      <button
                        onClick={() => handleExport("html")}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300"
                      >
                        HTML File
                      </button>
                      <button
                        onClick={() => handleExport("json")}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300"
                      >
                        JSON Config
                      </button>
                      <button
                        onClick={() => handleExport("csv")}
                        className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-zinc-300"
                      >
                        CSV Clean Data
                      </button>
                    </div>
                  )}
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

          {/* Smart Engine Statistics & Insights under the graph */}
          {profile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Smart decisions applied */}
              <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/30 bg-purple-50/40 dark:bg-purple-950/10 text-xs text-purple-900 dark:text-purple-300 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Engine Decisions Applied
                </span>
                {genNotes.length > 0 ? (
                  genNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-1.5 font-medium"
                    >
                      <span className="text-slate-400">•</span>
                      <span>{note}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 font-medium text-xs">
                    No override decisions active. Rendering default canvas
                    layout.
                  </div>
                )}
              </div>

              {/* Stats Panel */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#212121] shadow-sm text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block pb-1 border-b border-slate-100 dark:border-white/10">
                  Dataset Diagnostics
                </span>
                <div className="grid grid-cols-2 gap-4 pt-1 text-slate-600 dark:text-zinc-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Total Cells
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {(
                        profile.total_rows * profile.total_columns
                      )?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Null Ratio
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {profile.total_nulls?.toLocaleString()} (
                      {(
                        (profile.total_nulls /
                          (profile.total_rows * profile.total_columns || 1)) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Chart Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-5 relative transition-all text-left">
            {/* Close Button */}
            {!saveLoading && !savedSuccess && (
              <button
                onClick={() => setShowSaveDialog(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer rounded-xl bg-slate-100 dark:bg-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Header */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {savedSuccess
                  ? "Saved Successfully!"
                  : saveLoading
                  ? "Saving Visualization..."
                  : "Save Visualization"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {savedSuccess
                  ? "Your graph has been archived into your workspace history repository."
                  : saveLoading
                  ? "Please wait while we generate and archive your graph settings."
                  : "Enter a descriptive name to archive this visualization in your history workspace."}
              </p>
            </div>

            {/* Content Body: Animated Checkmark / Spinner vs Form Inputs */}
            {saveLoading || savedSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center gap-4 animate-fade-in">
                {saveLoading ? (
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-zinc-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-purple-600 dark:border-purple-400 border-t-transparent animate-spin" />
                    <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400 animate-pulse" />
                  </div>
                ) : (
                  <div className="relative w-20 h-20 rounded-full bg-purple-500/15 dark:bg-purple-500/25 border-2 border-purple-600 dark:border-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/20 scale-100 transition-all duration-500">
                    <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path
                        d="M20 6L9 17l-5-5"
                        style={{
                          strokeDasharray: 50,
                          strokeDashoffset: 0,
                          animation: "checkDraw 0.6s ease-out forwards",
                        }}
                      />
                    </svg>
                  </div>
                )}

                <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 tracking-wide">
                  {savedSuccess ? "Successfully Saved to History!" : "Archiving Graph Data..."}
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Visualization Name
                  </label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="e.g., Q3 Marketing Revenue vs Expenditure"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#673ab7]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveToHistory}
                    disabled={!saveName.trim()}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-[#673ab7] hover:bg-[#522e93] text-white cursor-pointer shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Chart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* View Python Code Dialog */}
      {showCodeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-[#0d1117] text-slate-800 dark:text-zinc-100 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Generated Python Execution Script
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-zinc-200"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedCode ? "Copied" : "Copy Code"}
                </button>
                <button
                  onClick={() => setShowCodeDialog(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-400 cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/70 p-4 max-h-[400px] overflow-auto scrollbar-thin">
              <pre className="text-xs font-mono select-all leading-relaxed text-slate-800 dark:text-zinc-200 whitespace-pre">
                {highlightPythonCode(pythonCode)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => setShowCodeDialog(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
