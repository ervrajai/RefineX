import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import FileUpload from "./FileUpload";
import RecentDatasetPanel from "../ui/RecentDatasetPanel";
import RefreshButton from "../ui/RefreshButton";
import DatasetTableViewer from "../ui/DatasetTableViewer";
import { AnimatedSelect } from "../ui/AnimatedSelect";
import { AnimatedCheckbox } from "../ui/AnimatedCheckbox";
import { BouncyAccordion } from "../ui/BouncyAccordion";
import {
  BrainCircuit,
  UploadCloud,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  Sparkles,
  RefreshCw,
  FileDown,
  Info,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Eye,
  Trash2,
  Bookmark,
  Activity,
  History,
  X,
  Sliders,
  ChevronLeft,
  Calendar,
  Layers,
  ArrowLeft,
  LineChart,
  Crown,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Cpu,
  BrushCleaning,
  Download,
  ChevronDown,
} from "lucide-react";

export default function ModelTrainingView({
  datasetId,
  setDatasetId,
  metadata,
  setMetadata,
  preview,
  setPreview,
  trainingMode,
  setTrainingMode,
  targetColumn,
  setTargetColumn,
  selectedFeatures,
  setSelectedFeatures,
  modelChoice,
  setModelChoice,
  selectedAlgorithms,
  setSelectedAlgorithms,
  testSize,
  setTestSize,
  randomState,
  setRandomState,
  shuffle,
  setShuffle,
  cvFolds,
  setCvFolds,
  trainingJobDetail,
  setTrainingJobDetail,
  onLoadWorkspace, // callback to clean tab
  setActiveTab, // function to toggle active tabs in Dashboard
}) {
  // Dataset states (lifted to parent)
  const [isClean, setIsClean] = useState(true);
  const [warnings, setWarnings] = useState(null);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Loading states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [training, setTraining] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Advanced configurations visibility
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Active training results and modals
  const [selectedModelForModal, setSelectedModelForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDownloadDropdownId, setOpenDownloadDropdownId] = useState(null);
  
  // Dedicated Predict Modal State
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);
  const [predictAlgo, setPredictAlgo] = useState("");
  const [predictFormInputs, setPredictFormInputs] = useState({});
  const [predictValidationErrors, setPredictValidationErrors] = useState({});
  const [predictOutputResult, setPredictOutputResult] = useState(null);
  const [predictingState, setPredictingState] = useState(false);

  const handleResetSetup = () => {
    setTrainingMode("decide");
    setTargetColumn("");
    setSelectedFeatures([]);
    setModelChoice("all");
    setSelectedAlgorithms([]);
    setTestSize(0.2);
    setCvFolds(5);
    setTrainingJobDetail(null);
    setSuccessMsg("Configuration parameters reset. Ready for new setup.");
  };

  const handleOpenPredictModal = (algorithm) => {
    setPredictAlgo(algorithm);
    const initialInputs = {};
    if (trainingJobDetail?.selected_features) {
      trainingJobDetail.selected_features.forEach((feat) => {
        initialInputs[feat] = "";
      });
    }
    setPredictFormInputs(initialInputs);
    setPredictValidationErrors({});
    setPredictOutputResult(null);
    setIsPredictModalOpen(true);
  };

  const handlePredictSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (trainingJobDetail?.selected_features) {
      trainingJobDetail.selected_features.forEach((feat) => {
        const val = predictFormInputs[feat];
        if (val === undefined || val === null || String(val).trim() === "") {
          errors[feat] = "This field is required";
        } else if (isNaN(Number(val))) {
          errors[feat] = "Must be a valid number";
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setPredictValidationErrors(errors);
      return;
    }

    setPredictValidationErrors({});
    setPredictingState(true);
    try {
      const formattedData = {};
      Object.keys(predictFormInputs).forEach((k) => {
        formattedData[k] = Number(predictFormInputs[k]);
      });

      const res = await api.post(
        `model-training/jobs/${trainingJobDetail.id}/predict/`,
        {
          data: formattedData,
          model_name: predictAlgo,
        }
      );
      setPredictOutputResult(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to make prediction.");
    } finally {
      setPredictingState(false);
    }
  };

  const fileInputRef = useRef(null);

  const handleTableScroll = () => {};

  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const getProcessedRows = () => {
    if (!preview?.rows) return [];
    let items = [...preview.rows];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter((row) =>
        preview.columns.some((col) =>
          String(row[col] ?? "")
            .toLowerCase()
            .includes(query),
        ),
      );
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
  const totalPages = Math.max(1, Math.ceil(processedRows.length / rowsPerPage));
  const paginatedRows = processedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  // Check inferred problem type based on target column
  const getInferredTaskType = () => {
    if (!preview || !preview.rows || !targetColumn) return "unknown";
    const uniqueVals = new Set(
      preview.rows.map((r) => r[targetColumn]).filter((v) => v !== null),
    );
    const uniqueCount = uniqueVals.size;
    const firstVal = preview.rows.find((r) => r[targetColumn] !== null)?.[
      targetColumn
    ];
    if (typeof firstVal === "boolean") return "classification";
    if (typeof firstVal === "string") return "classification";
    if (uniqueCount <= 10) return "classification";
    return "regression";
  };

  const inferredTaskType = getInferredTaskType();

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
      const uniqueCleanJobs = res.data.filter((job) => {
        if (seen.has(job.dataset_id)) return false;
        seen.add(job.dataset_id);
        return true;
      });
      setCleanHistoryList(uniqueCleanJobs);
    } catch (err) {
      console.error("Failed to load cleaning history:", err);
    } finally {
      setLoadingCleanHistory(false);
    }
  };

  const handleUseFromHistory = async (job) => {
    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.get(
        `cleaning/${job.dataset_id}/preview/?offset=0&limit=100`,
      );
      const data = res.data;

      setDatasetId(job.dataset_id);
      setMetadata(data.metadata);
      setPreview(data);
      setIsClean(true);
      setWarnings(null);

      const cols = data.columns;
      if (cols.length >= 2) {
        const lastCol = cols[cols.length - 1];
        setTargetColumn(lastCol);
        setSelectedFeatures(cols.filter((c) => c !== lastCol));
      }

      setSuccessMsg(
        `Loaded cleaned dataset "${job.dataset_name}" from history!`,
      );
    } catch (err) {
      setErrorMsg(
        "Failed to load historical dataset details. The file might have been deleted.",
      );
    } finally {
      setUploading(false);
    }
  };



  // Automatically clear success messages
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Auto-initialize Y target and X features when dataset preview is loaded
  useEffect(() => {
    if (preview && preview.columns && preview.columns.length >= 2) {
      const cols = preview.columns;
      const lastCol = cols[cols.length - 1];
      if (!targetColumn || !cols.includes(targetColumn)) {
        setTargetColumn(lastCol);
        setSelectedFeatures(cols.filter((c) => c !== lastCol));
      }
    }
  }, [preview, targetColumn]);

  // Pre-select compatible algorithms by default based on inferred task type
  useEffect(() => {
    if (inferredTaskType === "classification") {
      setSelectedAlgorithms([
        "knn_classifier",
        "decision_tree_classifier",
        "random_forest_classifier",
        "svm_classifier",
      ]);
    } else if (inferredTaskType === "regression") {
      setSelectedAlgorithms([
        "linear",
        "multiple_linear",
        "polynomial_regression",
      ]);
    }
  }, [inferredTaskType]);

  // Polling for training status
  useEffect(() => {
    let interval = null;
    if (activeJobId && training) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(
            `model-training/jobs/${activeJobId}/status/`,
          );
          setJobStatus(res.data);
          if (res.data.status === "completed") {
            setTraining(false);
            setActiveJobId(null);
            setSuccessMsg("Training completed successfully!");
            // Load job details
            const detailRes = await api.get(
              `model-training/jobs/${activeJobId}/`,
            );
            setTrainingJobDetail(detailRes.data);
          } else if (res.data.status === "failed") {
            setTraining(false);
            setActiveJobId(null);
            setErrorMsg(`Model training failed: ${res.data.error_message}`);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJobId, training]);

  // Uploader triggers
  const handleDragOver = (e) => e.preventDefault();
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
    setTrainingJobDetail(null);

    const formData = new FormData();
    formData.append("file", file);
    const startTime = Date.now();

    try {
      const res = await api.post("model-training/upload/", formData, {
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
        },
      });
      setUploadProgress(100);
      const data = res.data;
      setDatasetId(data.dataset_id);
      setMetadata(data.metadata);
      setPreview(data.preview);
      setIsClean(data.is_clean);
      setWarnings(data.warnings);

      // Default Y is last column, X is everything else
      const cols = data.preview.columns;
      if (cols.length >= 2) {
        const lastCol = cols[cols.length - 1];
        setTargetColumn(lastCol);
        setSelectedFeatures(cols.filter((c) => c !== lastCol));
      }

      setSuccessMsg("Dataset uploaded and inspected successfully!");
    } catch (err) {
      if (
        err.name === "CanceledError" ||
        err.code === "ERR_CANCELED" ||
        (err.message && err.message.includes("canceled"))
      ) {
        setErrorMsg("Upload canceled.");
      } else {
        setErrorMsg(
          err.response?.data?.error || "Upload failed. Verify CSV integrity.",
        );
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  // Redirect messy dataset to clean workspace
  const handleRedirectToClean = async () => {
    if (!datasetId || !metadata) return;
    try {
      // Fetch stats profile first to build uploader layout in clean console
      const res = await api.get(`cleaning/${datasetId}/analyze/`);
      if (onLoadWorkspace) {
        onLoadWorkspace(
          datasetId,
          metadata,
          res.data.report,
          null, // before report
          [], // logs
          preview,
        );
      }
      if (setActiveTab) {
        setActiveTab("clean");
      }
    } catch (err) {
      setErrorMsg("Failed to transfer dataset to Clean Console.");
    }
  };

  // Validate incompatible selection before training
  const checkCompatibilityIssues = () => {
    if (trainingMode !== "manual" || !targetColumn) return null;
    const isClassification = inferredTaskType === "classification";
    const isRegression = inferredTaskType === "regression";

    const classificationAlgos = [
      "knn_classifier",
      "decision_tree_classifier",
      "random_forest_classifier",
      "svm_classifier",
    ];
    const regressionAlgos = [
      "linear",
      "multiple_linear",
      "polynomial_regression",
    ];

    const selected =
      modelChoice === "all"
        ? isClassification
          ? classificationAlgos
          : regressionAlgos
        : selectedAlgorithms;

    for (let algo of selected) {
      if (isClassification && regressionAlgos.includes(algo)) {
        return `Algorithm '${algo}' cannot predict a classification target. Column '${targetColumn}' contains categorical or low-cardinality classes. Please select a Classification algorithm instead.`;
      }
      if (isRegression && classificationAlgos.includes(algo)) {
        return `Algorithm '${algo}' cannot predict a continuous numeric target. Column '${targetColumn}' contains continuous floating values. Please select a Regression algorithm instead.`;
      }
    }
    return null;
  };

  const compIssues = checkCompatibilityIssues();

  // Initiate Training
  const handleTrain = async () => {
    if (!datasetId) return;
    if (compIssues) {
      setErrorMsg(compIssues);
      return;
    }

    setTraining(true);
    setTrainingJobDetail(null);
    setErrorMsg("");
    setSuccessMsg("");

    const isClassification = inferredTaskType === "classification";
    const classificationAlgos = [
      "knn_classifier",
      "decision_tree_classifier",
      "random_forest_classifier",
      "svm_classifier",
    ];
    const regressionAlgos = [
      "linear",
      "multiple_linear",
      "polynomial_regression",
    ];

    const selectedModels =
      modelChoice === "all"
        ? isClassification
          ? classificationAlgos
          : regressionAlgos
        : selectedAlgorithms;

    const payload = {
      target_column: targetColumn,
      selected_features: selectedFeatures,
      selected_models: selectedModels,
      training_mode: trainingMode,
      hyperparameters: {
        test_size: parseFloat(testSize),
        random_state: parseInt(randomState),
        shuffle: shuffle,
        cv_folds: parseInt(cvFolds),
      },
    };

    try {
      const res = await api.post(`model-training/${datasetId}/train/`, payload);
      setActiveJobId(res.data.job_id);
      setJobStatus({
        status: "training",
        progress_stage: "loading_dataset",
        progress_percent: 10,
      });
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error || "Failed to initiate training session.",
      );
      setTraining(false);
    }
  };

  // Load Job Detail for Modal
  const loadJobDetail = async (jobId) => {
    try {
      const res = await api.get(`model-training/jobs/${jobId}/`);
      setTrainingJobDetail(res.data);
      setSelectedModelForModal(res.data.best_model_name);
      setIsModalOpen(true);
    } catch (err) {
      setErrorMsg("Failed to fetch detailed training log.");
    }
  };

  // Direct background download handler without page redirect
  const handleDownload = async (jobId, type) => {
    if (!jobId) return;
    try {
      const res = await api.get(`model-training/jobs/${jobId}/download/?type=${type}`, {
        responseType: "blob",
      });
      const ext = type === "model" || type === "pkl" ? "pkl" : type === "predictions" ? "csv" : type === "report" ? "pdf" : "zip";
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `model_training_${type}_${jobId}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setErrorMsg("Failed to download file. Please try again.");
    }
  };

  return (
    <div
      className={`space-y-6 text-slate-800 dark:text-zinc-100 pb-10 animate-fade-in font-sans ${!datasetId ? "max-w-7xl mx-auto" : "max-w-full"}`}
    >
      {/* Toast Notifications */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-white/90 dark:bg-zinc-900/90 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 shadow-2xl backdrop-blur-md animate-fade-in max-w-md">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="flex-1 font-semibold text-xs tracking-tight">
            {successMsg}
          </span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-white/90 dark:bg-zinc-900/90 px-4 py-3 text-sm text-rose-600 dark:text-rose-400 shadow-2xl backdrop-blur-md animate-fade-in max-w-md">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="flex-1 font-semibold text-xs tracking-tight text-left">
            {errorMsg}
          </span>
        </div>
      )}

      {/* TABS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0 py-1 mb-6">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Model Training
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 dark:text-zinc-400 mt-0.5">
            Build, evaluate, tune, and download scikit-learn preprocessing
            pipelines and estimators
          </p>
        </div>

        {datasetId && (
          <div className="flex items-center gap-2">
            <RefreshButton
              label="Switch Dataset"
              title="Switch to another dataset"
              onClick={() => {
                setDatasetId(null);
                setMetadata(null);
                setPreview(null);
                setErrorMsg("");
                setSuccessMsg("");
              }}
            />
            <button 
              type="button"
              onClick={handleResetSetup}
              disabled={training}
              className="group inline-flex items-center justify-center gap-2 px-4 py-2 h-9 text-xs font-bold rounded-full bg-transparent text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500 dark:hover:border-rose-400 focus:text-rose-500 focus:border-rose-500 transition-all duration-300 ease-in-out cursor-pointer text-center shadow-xs whitespace-nowrap select-none active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors duration-300" />
              <span>Reset Setup</span>
            </button>
          </div>
        )}
      </div>

      {/* CONSOLE PANEL */}
      <div className="space-y-6">
        {/* UPLOADER STATE */}
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
                  setPreview(null);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
              />
            </div>

            {/* 30% Right: History Card Panel */}
            {!uploading && cleanHistoryList.length > 0 && (
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CONFIGURATION SIDEBAR (LEFT) */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4 z-10 max-h-[calc(100vh-60px)] overflow-y-auto pr-0.5">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm space-y-4">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-3 pb-3 border-b border-slate-150 dark:border-zinc-800 mb-3.5">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Training Parameters</span>
                </h2>

                {/* Mode Select */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Training Mode
                  </label>
                  <div className="grid grid-cols-2 p-1 rounded-full bg-[#e3e3e8] dark:bg-[#1c1c1e] border border-slate-200/60 dark:border-zinc-800/80 shadow-inner">
                    <button
                      onClick={() => setTrainingMode("decide")}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                        trainingMode === "decide"
                          ? "bg-white dark:bg-[#3a3a3c] text-[#1c1c1e] dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-zinc-700/60"
                          : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white"
                      }`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${trainingMode === "decide" ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`} />
                      Auto-Decide
                    </button>
                    <button
                      onClick={() => setTrainingMode("manual")}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                        trainingMode === "manual"
                          ? "bg-white dark:bg-[#3a3a3c] text-[#1c1c1e] dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-zinc-700/60"
                          : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white"
                      }`}
                    >
                      <Settings className={`w-3.5 h-3.5 ${trainingMode === "manual" ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`} />
                      Manual
                    </button>
                  </div>
                </div>

                {/* Y Column */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Target Variable (Y)
                  </label>
                  <AnimatedSelect
                    value={targetColumn}
                    onChange={(val) => {
                      setTargetColumn(val);
                      if (preview?.columns) {
                        setSelectedFeatures(
                          preview.columns.filter((c) => c !== val),
                        );
                      }
                    }}
                    options={(preview?.columns || []).map((c) => ({ value: c, label: c }))}
                    placeholder="Select Target Variable..."
                    className="w-full"
                  />
                  <div className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 font-semibold capitalize pt-0.5">
                    <Info className="w-3 h-3 shrink-0 text-purple-600 dark:text-purple-400" />
                    Inferred Type: {inferredTaskType}
                  </div>
                </div>

                {/* X Columns Selection (Only Manual) */}
                {trainingMode === "manual" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Feature Variables (X)
                    </label>
                    <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 bg-slate-50/50 dark:bg-zinc-900/50 space-y-2">
                      {preview?.columns
                        ?.filter((c) => c !== targetColumn)
                        .map((c) => (
                          <div key={c} className="flex items-center py-0.5">
                            <AnimatedCheckbox
                              checked={selectedFeatures.includes(c)}
                              onChange={(e) => {
                                setSelectedFeatures((prev) =>
                                  prev.includes(c)
                                    ? prev.filter((x) => x !== c)
                                    : [...prev, c],
                                );
                              }}
                              label={c}
                              className="font-semibold text-xs text-slate-700 dark:text-zinc-300"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Algorithms selection (Only Manual) */}
                {trainingMode === "manual" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Model Algorithms
                    </label>
                  <div className="grid grid-cols-2 p-1 rounded-full bg-[#e3e3e8] dark:bg-[#1c1c1e] border border-slate-200/60 dark:border-zinc-800/80 shadow-inner">
                    <button
                      onClick={() => setModelChoice("all")}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer text-center ${
                        modelChoice === "all"
                          ? "bg-white dark:bg-[#3a3a3c] text-[#1c1c1e] dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-zinc-700/60"
                          : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white"
                      }`}
                    >
                      All Compatible
                    </button>
                    <button
                      onClick={() => setModelChoice("selected")}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer text-center ${
                        modelChoice === "selected"
                          ? "bg-white dark:bg-[#3a3a3c] text-[#1c1c1e] dark:text-white shadow-sm font-bold border border-slate-200/60 dark:border-zinc-700/60"
                          : "text-[#8e8e93] dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white"
                      }`}
                    >
                      Choose Models
                    </button>
                  </div>

                    {modelChoice === "selected" && (
                      <div className="space-y-2 border border-slate-200 dark:border-zinc-800 p-2.5 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 max-h-44 overflow-y-auto">
                        {inferredTaskType === "classification" ? (
                          <>
                            {[
                              { id: "knn_classifier", label: "KNN Classifier" },
                              {
                                id: "decision_tree_classifier",
                                label: "Decision Tree Classifier",
                              },
                              {
                                id: "random_forest_classifier",
                                label: "Random Forest Classifier",
                              },
                              {
                                id: "svm_classifier",
                                label: "Support Vector Machine",
                              },
                            ].map((m) => (
                              <div key={m.id} className="flex items-center py-0.5">
                                <AnimatedCheckbox
                                  checked={selectedAlgorithms.includes(m.id)}
                                  onChange={(e) => {
                                    setSelectedAlgorithms((prev) =>
                                      prev.includes(m.id)
                                        ? prev.filter((x) => x !== m.id)
                                        : [...prev, m.id],
                                    );
                                  }}
                                  label={m.label}
                                  className="font-semibold text-xs text-slate-700 dark:text-zinc-300"
                                />
                              </div>
                            ))}
                          </>
                        ) : (
                          <>
                            {[
                              { id: "linear", label: "Linear Regression" },
                              {
                                id: "multiple_linear",
                                label: "Multiple Linear",
                              },
                              {
                                id: "polynomial_regression",
                                label: "Polynomial Regression",
                              },
                            ].map((m) => (
                              <div key={m.id} className="flex items-center py-0.5">
                                <AnimatedCheckbox
                                  checked={selectedAlgorithms.includes(m.id)}
                                  onChange={(e) => {
                                    setSelectedAlgorithms((prev) =>
                                      prev.includes(m.id)
                                        ? prev.filter((x) => x !== m.id)
                                        : [...prev, m.id],
                                    );
                                  }}
                                  label={m.label}
                                  className="font-semibold text-xs text-slate-700 dark:text-zinc-300"
                                />
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Advanced parameters */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <BouncyAccordion
                    items={[
                      {
                        id: "advanced-config",
                        title: (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            Advanced Configurations
                          </span>
                        ),
                        description: (
                          <div className="pt-3 pb-2 space-y-3.5 text-xs animate-fade-in">
                            <div className="space-y-1.5">
                              <div className="flex justify-between font-semibold text-slate-600 dark:text-zinc-400 text-[11px]">
                                <span>Test Split Size</span>
                                <span className="text-purple-600 dark:text-purple-400 font-bold">
                                  {Math.round(testSize * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.1"
                                max="0.4"
                                step="0.05"
                                value={testSize}
                                onChange={(e) =>
                                  setTestSize(parseFloat(e.target.value))
                                }
                                className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-400"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                                Random State Seed
                              </label>
                              <input
                                type="number"
                                value={randomState}
                                onChange={(e) =>
                                  setRandomState(parseInt(e.target.value))
                                }
                                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 rounded-lg font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 dark:focus:border-purple-400"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                                Cross-Validation Folds
                              </label>
                              <input
                                type="number"
                                min="2"
                                max="10"
                                value={cvFolds}
                                onChange={(e) =>
                                  setCvFolds(parseInt(e.target.value))
                                }
                                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 rounded-lg font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 dark:focus:border-purple-400"
                              />
                            </div>

                            <div className="pt-1 pb-1">
                              <AnimatedCheckbox
                                checked={shuffle}
                                onChange={(e) => setShuffle(e.target.checked)}
                                label="Shuffle Dataset"
                                className="font-semibold text-xs text-slate-700 dark:text-zinc-300"
                              />
                            </div>
                          </div>
                        ),
                      },
                    ]}
                    value={showAdvanced ? "advanced-config" : null}
                    onValueChange={(value) =>
                      setShowAdvanced(value === "advanced-config")
                    }
                    collapsible={true}
                    className="space-y-0"
                    classNames={{
                      item: "bg-transparent shadow-none border-none",
                      trigger: "px-0 py-0 hover:bg-transparent",
                      content: "border-t-0 bg-transparent overflow-visible",
                      description: "p-0",
                    }}
                  />
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                  {compIssues ? (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-600 dark:text-rose-400 leading-relaxed">
                      {compIssues}
                    </div>
                  ) : (
                    <button
                      onClick={handleTrain}
                      disabled={training || !targetColumn}
                      className="group w-full px-4 py-3 text-sm font-bold rounded-xl bg-[#393e7f] dark:bg-[#a855f7] text-white dark:text-zinc-950 outline-2 outline-offset-[-2px] outline-[#393e7f] dark:outline-[#a855f7] border-none cursor-pointer transition-all duration-300 shadow-sm flex items-center justify-center gap-2 hover:bg-transparent dark:hover:bg-transparent hover:text-[#393e7f] dark:hover:text-[#c084fc] disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {training ? (
                        <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
                      ) : (
                        <BrainCircuit className="w-4 h-4 transition-colors duration-300 stroke-[2.5]" />
                      )}
                      <span>Start Model Training</span>
                    </button>
                  )}
                </div>
              </div>

              {/* MOVED FOOTER: Next Steps directly under the training sidebar */}
              <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#212121]/50 shadow-sm flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest text-center">
                  Next Steps in Data Workflow
                </span>
                <div className="flex flex-col gap-2 w-full">
                  <button 
                    type="button"
                    onClick={() => {
                      if (setActiveTab) setActiveTab("visualization");
                    }} 
                    className="w-full px-4 py-2.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex justify-center items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <LineChart className="w-4 h-4" /> Visualize Dataset
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (setActiveTab) setActiveTab("clean");
                    }} 
                    className="w-full px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-white flex justify-center items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <BrushCleaning className="w-4 h-4" /> Data Cleaning
                  </button>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT AREA (RIGHT) */}
            <div className="lg:col-span-8 flex flex-col space-y-6 min-w-0">
              {/* QUALITY INSPECTION NOTIFICATION */}
              {!isClean && warnings && (
                <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-slate-800 dark:text-zinc-100 space-y-3 animate-fade-in shadow-xs backdrop-blur-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Dataset Quality Warnings Detected
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                    We automatically scanned the uploaded dataset and found
                    schema warnings. Missing values, constant/empty columns,
                    duplicate records, or infinite floats will negatively impact
                    model convergence, scale metrics, or crash the validation
                    splits.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    {warnings.missing_values > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Missing values: {warnings.missing_values} cells
                      </span>
                    )}
                    {warnings.duplicate_rows > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Duplicate rows: {warnings.duplicate_rows}
                      </span>
                    )}
                    {warnings.duplicate_columns?.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Duplicate columns: {warnings.duplicate_columns.length}
                      </span>
                    )}
                    {warnings.infinite_values > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Infinite values: {warnings.infinite_values}
                      </span>
                    )}
                    {warnings.mixed_data_types?.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Mixed types: {warnings.mixed_data_types.length}
                      </span>
                    )}
                    {warnings.constant_columns?.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Constant cols: {warnings.constant_columns.length}
                      </span>
                    )}
                  </div>
                  <div className="pt-1 flex flex-wrap gap-3">
                    <button
                      onClick={handleRedirectToClean}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition duration-150 flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" /> Clean Dataset First
                    </button>
                    <button
                      onClick={() => setIsClean(true)}
                      className="px-4 py-2 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition"
                    >
                      Force Train Anyway
                    </button>
                  </div>
                </div>
              )}

              {/* RUNNING TRAINING PROGRESS */}
              {training && jobStatus && (
                <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-5 h-5 text-primary animate-pulse" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        RefineX Training Pipeline Running
                      </h3>
                    </div>
                    <span className="text-sm font-black text-primary">
                      {jobStatus.progress_percent}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden border border-slate-200/50 dark:border-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 ease-out"
                      style={{ width: `${jobStatus.progress_percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-zinc-400 tracking-wider">
                    <span className="capitalize">
                      Stage:{" "}
                      <strong className="text-primary font-bold">
                        {jobStatus.progress_stage.replace("_", " ")}
                      </strong>
                    </span>
                    <span>
                      Est. Remaining: ~
                      {Math.max(
                        5,
                        30 - Math.round(jobStatus.progress_percent * 0.25),
                      )}{" "}
                      seconds
                    </span>
                  </div>
                </div>
              )}

              {/* GRID RESULTS */}
              {trainingJobDetail && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Trained Estimators Leaderboard
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {Object.values(trainingJobDetail.evaluation_metrics).map(
                      (model) => {
                        const isBest =
                          model.algorithm === trainingJobDetail.best_model_name;
                        const scoreType =
                          "r2" in model.metrics ? "R²" : "Accuracy";
                        const displayScore =
                          "r2" in model.metrics
                            ? model.metrics.r2
                            : model.metrics.accuracy;

                        return (
                          <div
                            key={model.algorithm}
                            onClick={() =>
                              loadJobDetail(trainingJobDetail.id).then(() =>
                                setSelectedModelForModal(model.algorithm),
                              )
                            }
                            className="p-5 rounded-[17px] cursor-pointer select-none transition-all duration-300 ease-out relative group flex flex-col justify-between min-h-[220px] border border-slate-200 dark:border-zinc-800 hover:border-black dark:hover:border-white bg-white dark:bg-[#212121]"
                          >
                            <div>
                              {isBest && (
                                <span className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-purple-600 dark:bg-purple-500 text-white border border-purple-400/30 text-[10px] font-extrabold tracking-wider flex items-center gap-1 shadow-xs">
                                  <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Champion
                                </span>
                              )}
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight pr-24 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition duration-150 capitalize">
                                {model.algorithm.replace(/_/g, " ")}
                              </h3>
                              <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold tracking-wider mt-1 block">
                                Task:{" "}
                                {trainingJobDetail.evaluation_metrics
                                  ? "r2" in model.metrics
                                    ? "Regression"
                                    : "Classification"
                                  : ""}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 border-t border-slate-200 dark:border-zinc-800/80 pt-3 my-2">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-zinc-400 block">
                                  {scoreType} Score
                                </span>
                                <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                                  {(displayScore * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-zinc-400 block">
                                  CV Score
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {(model.metrics.cv_score * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-zinc-400 block">
                                  Train Time
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {model.training_time.toFixed(3)}s
                                </span>
                              </div>
                            </div>

                              {/* Card Action Buttons (Download Dropdown & Test Model) */}
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/60 justify-between">
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDownloadDropdownId(
                                        openDownloadDropdownId === model.algorithm ? null : model.algorithm,
                                      );
                                    }}
                                    className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 h-9 text-xs font-bold rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-900 dark:border-white cursor-pointer transition-all duration-200 shadow-xs active:scale-95 select-none"
                                  >
                                    <Download className="w-3.5 h-3.5 text-white dark:text-slate-900" />
                                    <span>Download</span>
                                    <ChevronDown
                                      className={`w-3 h-3 text-white dark:text-slate-900 transition-transform duration-200 ${
                                        openDownloadDropdownId === model.algorithm ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>

                                  {openDownloadDropdownId === model.algorithm && (
                                    <div
                                      className="absolute left-0 bottom-11 z-[100] w-48 py-1.5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-xl animate-fade-in flex flex-col text-xs font-semibold overflow-hidden"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownload(trainingJobDetail.id, "model");
                                          setOpenDownloadDropdownId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center gap-2 transition"
                                      >
                                        <FileDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                        <span>Model PKL / Joblib</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownload(trainingJobDetail.id, "predictions");
                                          setOpenDownloadDropdownId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center gap-2 transition"
                                      >
                                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>Predictions CSV</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDownload(trainingJobDetail.id, "report");
                                          setOpenDownloadDropdownId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center gap-2 transition"
                                      >
                                        <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                        <span>PDF Summary</span>
                                      </button>
                                    </div>
                                  )}
                                </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPredictModal(model.algorithm);
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 h-9 text-xs font-bold rounded-full border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 dark:hover:text-white transition-all duration-200 cursor-pointer shadow-xs active:scale-95 select-none"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Test Model</span>
                              </button>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {/* DATASHEET PREVIEW TAB */}
              {!trainingJobDetail && preview && (
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
              )}
            </div>
          </div>
        )}
      </div>

      {/* CENTERED DETAILED EVALUATION MODAL */}
      {isModalOpen && trainingJobDetail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Blurred overlay */}
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-[#212121] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in font-sans">
            {/* Header */}
            <div className="p-4 px-6 border-b border-slate-100 dark:border-zinc-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/30">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight capitalize flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Training Details:{" "}
                  {trainingJobDetail.dataset_name}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 block font-semibold uppercase tracking-wider">
                  Trained with {trainingJobDetail.training_mode} mode
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-navigation for Algorithms */}
            <div className="px-6 py-2.5 bg-slate-100/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800/80 flex gap-2 overflow-x-auto">
              {Object.keys(trainingJobDetail.evaluation_metrics).map((algo) => {
                const isBest = algo === trainingJobDetail.best_model_name;
                const isActive = algo === selectedModelForModal;
                return (
                  <button
                    key={algo}
                    onClick={() => setSelectedModelForModal(algo)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer shrink-0 capitalize flex items-center gap-1.5 ${
                      isActive
                        ? "bg-purple-600 dark:bg-purple-500 text-white shadow-xs"
                        : "bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 text-slate-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400"
                    }`}
                  >
                    {algo.replace(/_/g, " ")}{" "}
                    {isBest && (
                      <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content Body: Split Left & Right */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
              {/* LEFT COLUMN: Metadata, config, params, correlation matrix */}
              <div className="space-y-6">
                {/* Meta details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Job Configurations Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                        Target (Y)
                      </span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {trainingJobDetail.target_column}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                        Features Count (X)
                      </span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {trainingJobDetail.selected_features.length} variables
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                        Split Size
                      </span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {(trainingJobDetail.hyperparameters.test_size || 0.2) *
                          100}
                        % test
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                        CV Folds
                      </span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {trainingJobDetail.hyperparameters.cv_folds || 5} Folds
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Preprocessing Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Automated Preprocessing
                  </h4>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm text-xs leading-relaxed text-slate-600 dark:text-zinc-300 font-medium space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />{" "}
                      Imputed missing numeric fields using Median Strategy
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />{" "}
                      Encoded categorical variables using sparse OneHotEncoder
                    </div>
                    {selectedModelForModal === "polynomial_regression" && (
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />{" "}
                        Generated Polynomial Features (degree=2)
                      </div>
                    )}
                    {(selectedModelForModal === "knn_classifier" ||
                      selectedModelForModal === "svm_classifier") && (
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />{" "}
                        Normalized numerical inputs using StandardScaler
                      </div>
                    )}
                    {selectedModelForModal &&
                      ![
                        "knn_classifier",
                        "svm_classifier",
                        "polynomial_regression",
                      ].includes(selectedModelForModal) && (
                        <div className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />{" "}
                          Preserved original numeric scales (no scaling needed
                          for trees/linear estimators)
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Evaluation Metrics Details */}
              <div className="space-y-6">
                {selectedModelForModal &&
                  trainingJobDetail.evaluation_metrics[selectedModelForModal] &&
                  (() => {
                    const modelData =
                      trainingJobDetail.evaluation_metrics[
                        selectedModelForModal
                      ];
                    const m = modelData.metrics;
                    const isClassification = "accuracy" in m;

                    return (
                      <div className="space-y-6">
                        {/* Metric Card Listings */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Evaluation Metrics
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {isClassification ? (
                              <>
                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                                    Accuracy
                                  </span>
                                  <strong className="text-sm font-black text-emerald-500">
                                    {(m.accuracy * 100).toFixed(2)}%
                                  </strong>
                                </div>
                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                                    Weighted F1-Score
                                  </span>
                                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {(m.f1_score * 100).toFixed(2)}%
                                  </strong>
                                </div>
                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                                    Precision
                                  </span>
                                  <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                                    {(m.precision * 100).toFixed(2)}%
                                  </strong>
                                </div>
                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                                    Recall
                                  </span>
                                  <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                                    {(m.recall * 100).toFixed(2)}%
                                  </strong>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                                    R² Score
                                  </span>
                                  <strong className="text-sm font-black text-emerald-500">
                                    {(m.r2 * 100).toFixed(2)}%
                                  </strong>
                                </div>
                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                                    Adjusted R²
                                  </span>
                                  <strong className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {(m.adjusted_r2 * 100).toFixed(2)}%
                                  </strong>
                                </div>
                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                                    RMSE
                                  </span>
                                  <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                                    {m.rmse.toFixed(4)}
                                  </strong>
                                </div>
                                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                                  <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">
                                    MAE
                                  </span>
                                  <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">
                                    {m.mae.toFixed(4)}
                                  </strong>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Confusion Matrix (Classification) */}
                        {isClassification && m.confusion_matrix && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                              Confusion Matrix
                            </h4>
                            <div className="rounded-xl overflow-hidden p-4 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                              <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                                {m.confusion_matrix.map((row, rIdx) =>
                                  row.map((val, cIdx) => {
                                    const isDiag = rIdx === cIdx;
                                    return (
                                      <div
                                        key={`${rIdx}-${cIdx}`}
                                        className={`p-3 rounded-lg border ${
                                          isDiag
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                            : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                                        }`}
                                      >
                                        {val}
                                      </div>
                                    );
                                  }),
                                )}
                              </div>
                              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-3 px-1">
                                <span>Predicted Classes</span>
                                <span>Target Splits</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actual vs Predicted Summary (Regression) */}
                        {!isClassification && trainingJobDetail.predictions && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                              Actual vs Predicted (First 5 Rows)
                            </h4>
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                              <table className="w-full text-center text-xs">
                                <thead className="bg-slate-100/70 dark:bg-zinc-900/80 font-bold uppercase tracking-wider text-[10px] text-slate-600 dark:text-zinc-400">
                                  <tr>
                                    <th className="px-3 py-2">Row</th>
                                    <th className="px-3 py-2">Actual</th>
                                    <th className="px-3 py-2">Predicted</th>
                                    <th className="px-3 py-2">
                                      Residual Error
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                  {trainingJobDetail.predictions.actual
                                    ?.slice(0, 5)
                                    .map((act, idx) => {
                                      const pred =
                                        trainingJobDetail.predictions.predicted[
                                          idx
                                        ];
                                      const res = act - pred;
                                      return (
                                        <tr
                                          key={idx}
                                          className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/30"
                                        >
                                          <td className="px-3 py-2 font-bold text-slate-400 dark:text-zinc-500 text-[11px]">
                                            #{idx}
                                          </td>
                                          <td className="px-3 py-2 font-medium text-slate-700 dark:text-zinc-200">
                                            {act.toFixed(3)}
                                          </td>
                                          <td className="px-3 py-2 font-bold text-primary">
                                            {pred.toFixed(3)}
                                          </td>
                                          <td
                                            className={`px-3 py-2 font-bold ${res < 0 ? "text-rose-500" : "text-emerald-500"}`}
                                          >
                                            {res.toFixed(3)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TEST MODEL / PREDICT LIVE MODAL */}
      {isPredictModalOpen && trainingJobDetail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setIsPredictModalOpen(false)}
          />

          <div className="relative w-full max-w-xl max-h-[85vh] bg-white dark:bg-[#212121] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in font-sans">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 dark:border-zinc-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/30">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight capitalize">
                    Test Model (Predict Live): {predictAlgo.replace(/_/g, " ")}
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    Target Output: {trainingJobDetail.target_column}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPredictModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body: Inputs inside card with field validation */}
            <form onSubmit={handlePredictSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                  Enter Feature Field Values:
                </span>
                
                {trainingJobDetail.selected_features?.map((feat) => {
                  const hasError = !!predictValidationErrors[feat];
                  return (
                    <div key={feat} className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {feat}
                      </label>
                      <input
                        type="text"
                        value={predictFormInputs[feat] !== undefined ? predictFormInputs[feat] : ""}
                        onChange={(e) => {
                          setPredictFormInputs({
                            ...predictFormInputs,
                            [feat]: e.target.value,
                          });
                          if (predictValidationErrors[feat]) {
                            setPredictValidationErrors({
                              ...predictValidationErrors,
                              [feat]: null,
                            });
                          }
                        }}
                        placeholder={`Enter value for ${feat}...`}
                        className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-zinc-900 text-slate-900 dark:text-white transition focus:outline-none ${
                          hasError
                            ? "border-rose-500 ring-2 ring-rose-500/20"
                            : "border-slate-200 dark:border-zinc-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        }`}
                      />
                      {hasError && (
                        <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> {predictValidationErrors[feat]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Predict Button */}
              <button
                type="submit"
                disabled={predictingState}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600 transition cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {predictingState ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{predictingState ? "Generating Live Prediction..." : "Run Prediction Test"}</span>
              </button>

              {/* Prediction Result Display */}
              {predictOutputResult && (
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                    Prediction Output Result
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Predicted {trainingJobDetail.target_column}:
                    </span>
                    <strong className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                      {typeof predictOutputResult.prediction === "number"
                        ? predictOutputResult.prediction.toFixed(4)
                        : String(predictOutputResult.prediction)}
                    </strong>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
