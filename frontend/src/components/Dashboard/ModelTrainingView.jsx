import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import FileUpload from "./FileUpload";
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
  Cpu
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
  setActiveTab     // function to toggle active tabs in Dashboard
}) {
  // Dataset states (lifted to parent)
  const [isClean, setIsClean] = useState(true);
  const [warnings, setWarnings] = useState(null);

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
  // Live prediction states
  const [testInputs, setTestInputs] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictErrorMsg, setPredictErrorMsg] = useState("");

  const fileInputRef = useRef(null);

  // Check inferred problem type based on target column
  const getInferredTaskType = () => {
    if (!preview || !preview.rows || !targetColumn) return "unknown";
    const uniqueVals = new Set(preview.rows.map(r => r[targetColumn]).filter(v => v !== null));
    const uniqueCount = uniqueVals.size;
    const firstVal = preview.rows.find(r => r[targetColumn] !== null)?.[targetColumn];
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
      const uniqueCleanJobs = res.data.filter(job => {
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
      const res = await api.get(`cleaning/${job.dataset_id}/preview/?offset=0&limit=100`);
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
        setSelectedFeatures(cols.filter(c => c !== lastCol));
      }

      setSuccessMsg(`Loaded cleaned dataset "${job.dataset_name}" from history!`);
    } catch (err) {
      setErrorMsg("Failed to load historical dataset details. The file might have been deleted.");
    } finally {
      setUploading(false);
    }
  };

  const handleTestPredict = async () => {
    if (!trainingJobDetail) return;
    setPredicting(true);
    setPredictionResult(null);
    setPredictErrorMsg("");
    try {
      const res = await api.post(`model-training/jobs/${trainingJobDetail.id}/predict/`, {
        inputs: testInputs
      });
      setPredictionResult(res.data.prediction);
    } catch (err) {
      setPredictErrorMsg(err.response?.data?.error || "Prediction failed. Check feature formats.");
    } finally {
      setPredicting(false);
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
        setSelectedFeatures(cols.filter(c => c !== lastCol));
      }
    }
  }, [preview, targetColumn]);

  // Pre-select compatible algorithms by default based on inferred task type
  useEffect(() => {
    if (inferredTaskType === "classification") {
      setSelectedAlgorithms(["knn_classifier", "decision_tree_classifier", "random_forest_classifier", "svm_classifier"]);
    } else if (inferredTaskType === "regression") {
      setSelectedAlgorithms(["linear", "multiple_linear", "polynomial_regression"]);
    }
  }, [inferredTaskType]);

  // Polling for training status
  useEffect(() => {
    let interval = null;
    if (activeJobId && training) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`model-training/jobs/${activeJobId}/status/`);
          setJobStatus(res.data);
          if (res.data.status === "completed") {
            setTraining(false);
            setActiveJobId(null);
            setSuccessMsg("Training completed successfully!");
            // Load job details
            const detailRes = await api.get(`model-training/jobs/${activeJobId}/`);
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
        }
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
        setSelectedFeatures(cols.filter(c => c !== lastCol));
      }

      setSuccessMsg("Dataset uploaded and inspected successfully!");
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED" || (err.message && err.message.includes("canceled"))) {
        setErrorMsg("Upload canceled.");
      } else {
        setErrorMsg(err.response?.data?.error || "Upload failed. Verify CSV integrity.");
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
          [],   // logs
          preview
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

    const classificationAlgos = ["knn_classifier", "decision_tree_classifier", "random_forest_classifier", "svm_classifier"];
    const regressionAlgos = ["linear", "multiple_linear", "polynomial_regression"];

    const selected = modelChoice === "all" 
      ? (isClassification ? classificationAlgos : regressionAlgos) 
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
    const classificationAlgos = ["knn_classifier", "decision_tree_classifier", "random_forest_classifier", "svm_classifier"];
    const regressionAlgos = ["linear", "multiple_linear", "polynomial_regression"];

    const selectedModels = modelChoice === "all" 
      ? (isClassification ? classificationAlgos : regressionAlgos) 
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
        cv_folds: parseInt(cvFolds)
      }
    };

    try {
      const res = await api.post(`model-training/${datasetId}/train/`, payload);
      setActiveJobId(res.data.job_id);
      setJobStatus({
        status: "training",
        progress_stage: "loading_dataset",
        progress_percent: 10
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to initiate training session.");
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

  const handleDownload = (jobId, type) => {
    const url = `http://localhost:8000/api/model-training/jobs/${jobId}/download/?type=${type}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-zinc-100 max-w-full pb-10 animate-fade-in font-sans">
      
      {/* Toast Notifications */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-white/90 dark:bg-zinc-900/90 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 shadow-2xl backdrop-blur-md animate-fade-in max-w-md">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="flex-1 font-semibold text-xs tracking-tight">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-white/90 dark:bg-zinc-900/90 px-4 py-3 text-sm text-rose-600 dark:text-rose-400 shadow-2xl backdrop-blur-md animate-fade-in max-w-md">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="flex-1 font-semibold text-xs tracking-tight text-left">{errorMsg}</span>
        </div>
      )}

      {/* TABS HEADER */}
      <div className="p-5 md:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BrainCircuit className="w-5 h-5" />
            </div>
            ML Model Training Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 pl-0.5">
            Build, evaluate, tune, and download scikit-learn preprocessing pipelines and estimators.
          </p>
        </div>
      </div>

      {/* CONSOLE PANEL */}
      <div className="space-y-6">
          
          {/* UPLOADER STATE */}
          {!datasetId ? (
            <div className="space-y-6">
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

              {!uploading && cleanHistoryList.length > 0 && (
                <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-zinc-800/80 pb-3.5">
                    <History className="w-4.5 h-4.5 text-primary" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Or Select From Clean History</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Skip uploading by choosing a dataset you've previously cleaned on RefineX.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {cleanHistoryList.map(job => (
                      <div 
                        key={job.id}
                        onClick={() => handleUseFromHistory(job)}
                        className="p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 hover:border-primary dark:hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-zinc-900/60 cursor-pointer transition duration-150 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-200/60 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition shrink-0">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block truncate">{job.dataset_name}</span>
                            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider mt-0.5">
                              Cleaned: {(() => {
                                const dt = job.created_at || job.cleaned_at || job.updated_at;
                                if (!dt) return "Recently";
                                try {
                                  const d = new Date(dt);
                                  return isNaN(d.getTime()) ? "Recently" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                } catch {
                                  return "Recently";
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CONSOLE LAYOUT */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* CONFIGURATION SIDEBAR (LEFT 25%) */}
              <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm space-y-5">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                  <SlidersHorizontal className="w-4 h-4 text-primary" /> Training Parameters
                </h2>

                {/* Mode Select */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Training Mode</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
                    <button
                      onClick={() => setTrainingMode("decide")}
                      className={`py-1.5 px-2 text-[10px] font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        trainingMode === "decide" ? "bg-white dark:bg-zinc-800 text-primary shadow-xs font-bold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-primary" />
                      Auto-Decide
                    </button>
                    <button
                      onClick={() => setTrainingMode("manual")}
                      className={`py-1.5 px-2 text-[10px] font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        trainingMode === "manual" ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-bold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Settings className="w-3 h-3 text-slate-400" />
                      Manual
                    </button>
                  </div>
                </div>

                {/* Y Column */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Target Variable (Y)</label>
                  <select
                    value={targetColumn}
                    onChange={(e) => {
                      setTargetColumn(e.target.value);
                      if (preview?.columns) {
                        setSelectedFeatures(preview.columns.filter(c => c !== e.target.value));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer font-semibold"
                  >
                    {preview?.columns?.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 text-[10px] text-primary font-semibold capitalize pt-0.5">
                    <Info className="w-3 h-3 shrink-0" />
                    Inferred Type: {inferredTaskType}
                  </div>
                </div>

                {/* X Columns Selection (Only Manual) */}
                {trainingMode === "manual" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Feature Variables (X)</label>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 bg-slate-50/50 dark:bg-zinc-900/50 space-y-1.5">
                      {preview?.columns?.filter(c => c !== targetColumn).map(c => (
                        <label key={c} className="flex items-center gap-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(c)}
                            onChange={() => {
                              setSelectedFeatures(prev => 
                                prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                              );
                            }}
                            className="rounded border-slate-300 dark:border-zinc-700 text-primary focus:ring-primary/20 cursor-pointer w-3.5 h-3.5"
                          />
                          <span className="truncate">{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Algorithms selection (Only Manual) */}
                {trainingMode === "manual" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Model Algorithms</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
                      <button
                        onClick={() => setModelChoice("all")}
                        className={`py-1 text-[10px] font-semibold rounded-lg cursor-pointer text-center transition-all ${
                          modelChoice === "all" ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-bold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        All Compatible
                      </button>
                      <button
                        onClick={() => setModelChoice("selected")}
                        className={`py-1 text-[10px] font-semibold rounded-lg cursor-pointer text-center transition-all ${
                          modelChoice === "selected" ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-bold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Choose Models
                      </button>
                    </div>

                    {modelChoice === "selected" && (
                      <div className="space-y-1.5 border border-slate-200 dark:border-zinc-800 p-2.5 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 max-h-40 overflow-y-auto">
                        {inferredTaskType === "classification" ? (
                          <>
                            {[
                              { id: "knn_classifier", label: "KNN Classifier" },
                              { id: "decision_tree_classifier", label: "Decision Tree Classifier" },
                              { id: "random_forest_classifier", label: "Random Forest Classifier" },
                              { id: "svm_classifier", label: "Support Vector Machine" }
                            ].map(m => (
                              <label key={m.id} className="flex items-center gap-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition">
                                <input
                                  type="checkbox"
                                  checked={selectedAlgorithms.includes(m.id)}
                                  onChange={() => {
                                    setSelectedAlgorithms(prev => 
                                      prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]
                                    );
                                  }}
                                  className="rounded border-slate-300 dark:border-zinc-700 text-primary cursor-pointer w-3.5 h-3.5"
                                />
                                {m.label}
                              </label>
                            ))}
                          </>
                        ) : (
                          <>
                            {[
                              { id: "linear", label: "Linear Regression" },
                              { id: "multiple_linear", label: "Multiple Linear" },
                              { id: "polynomial_regression", label: "Polynomial Regression" }
                            ].map(m => (
                              <label key={m.id} className="flex items-center gap-2 cursor-pointer font-medium text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition">
                                <input
                                  type="checkbox"
                                  checked={selectedAlgorithms.includes(m.id)}
                                  onChange={() => {
                                    setSelectedAlgorithms(prev => 
                                      prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]
                                    );
                                  }}
                                  className="rounded border-slate-300 dark:border-zinc-700 text-primary cursor-pointer w-3.5 h-3.5"
                                />
                                {m.label}
                              </label>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Advanced parameters */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white cursor-pointer py-1"
                  >
                    <span>Advanced Configurations</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`} />
                  </button>
                  {showAdvanced && (
                    <div className="pt-3 space-y-3.5 text-xs animate-fade-in">
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-semibold text-slate-600 dark:text-zinc-400 text-[11px]">
                          <span>Test Split Size</span>
                          <span className="text-primary font-bold">{Math.round(testSize * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.4"
                          step="0.05"
                          value={testSize}
                          onChange={(e) => setTestSize(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Random State Seed</label>
                        <input
                          type="number"
                          value={randomState}
                          onChange={(e) => setRandomState(parseInt(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 rounded-lg font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Cross-Validation Folds</label>
                        <input
                          type="number"
                          min="2"
                          max="10"
                          value={cvFolds}
                          onChange={(e) => setCvFolds(parseInt(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 rounded-lg font-semibold text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={shuffle}
                          onChange={(e) => setShuffle(e.target.checked)}
                          className="rounded border-slate-300 dark:border-zinc-700 text-primary cursor-pointer w-3.5 h-3.5"
                        />
                        Shuffle Dataset
                      </label>
                    </div>
                  )}
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
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-primary hover:bg-primary-dark active:scale-[0.98] rounded-xl transition duration-150 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {training ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                      Start Model Training
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab("visualization");
                    }}
                    className="w-full py-2 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LineChart className="w-3.5 h-3.5" /> Visualize Dataset
                  </button>
                  <button
                    onClick={() => {
                      setDatasetId(null);
                      setMetadata(null);
                      setPreview(null);
                      setTargetColumn("");
                      setSelectedFeatures([]);
                      setTrainingJobDetail(null);
                    }}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-xl text-center cursor-pointer transition"
                  >
                    Clear Dataset
                  </button>
                </div>

              </div>

              {/* MAIN CONTENT AREA (RIGHT 75%) */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* QUALITY INSPECTION NOTIFICATION */}
                {!isClean && warnings && (
                  <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-slate-800 dark:text-zinc-100 space-y-3 animate-fade-in shadow-xs backdrop-blur-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Dataset Quality Warnings Detected</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                      We automatically scanned the uploaded dataset and found schema warnings. Missing values, constant/empty columns, duplicate records, or infinite floats will negatively impact model convergence, scale metrics, or crash the validation splits. 
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                      {warnings.missing_values > 0 && <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">Missing values: {warnings.missing_values} cells</span>}
                      {warnings.duplicate_rows > 0 && <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">Duplicate rows: {warnings.duplicate_rows}</span>}
                      {warnings.duplicate_columns?.length > 0 && <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">Duplicate columns: {warnings.duplicate_columns.length}</span>}
                      {warnings.infinite_values > 0 && <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">Infinite values: {warnings.infinite_values}</span>}
                      {warnings.mixed_data_types?.length > 0 && <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">Mixed types: {warnings.mixed_data_types.length}</span>}
                      {warnings.constant_columns?.length > 0 && <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">Constant cols: {warnings.constant_columns.length}</span>}
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
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">RefineX Training Pipeline Running</h3>
                      </div>
                      <span className="text-sm font-black text-primary">{jobStatus.progress_percent}%</span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden border border-slate-200/50 dark:border-zinc-800">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 ease-out" 
                        style={{ width: `${jobStatus.progress_percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-zinc-400 tracking-wider">
                      <span className="capitalize">Stage: <strong className="text-primary font-bold">{jobStatus.progress_stage.replace('_', ' ')}</strong></span>
                      <span>Est. Remaining: ~{Math.max(5, 30 - Math.round(jobStatus.progress_percent * 0.25))} seconds</span>
                    </div>
                  </div>
                )}

                {/* GRID RESULTS */}
                {trainingJobDetail && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Trained Estimators Leaderboard</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.values(trainingJobDetail.evaluation_metrics).map((model) => {
                        const isBest = model.algorithm === trainingJobDetail.best_model_name;
                        const scoreType = "r2" in model.metrics ? "R²" : "Accuracy";
                        const displayScore = "r2" in model.metrics ? model.metrics.r2 : model.metrics.accuracy;

                        return (
                          <div 
                            key={model.algorithm}
                            onClick={() => loadJobDetail(trainingJobDetail.id).then(() => setSelectedModelForModal(model.algorithm))}
                            className={`p-5 rounded-2xl border bg-white dark:bg-[#212121] shadow-sm hover:shadow-md cursor-pointer transition duration-200 relative group flex flex-col justify-between h-48 ${
                              isBest 
                                ? "border-primary/80 ring-2 ring-primary/20" 
                                : "border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                            }`}
                          >
                            <div>
                              {isBest && (
                                <span className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold tracking-wider flex items-center gap-1">
                                  <Crown className="w-3 h-3" /> Champion
                                </span>
                              )}
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight pr-20 group-hover:text-primary transition duration-150 capitalize">
                                {model.algorithm.replace(/_/g, ' ')}
                              </h3>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider mt-1 block">
                                Task: {trainingJobDetail.evaluation_metrics ? ("r2" in model.metrics ? "Regression" : "Classification") : ""}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-zinc-800/80 pt-3">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">{scoreType} Score</span>
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white">{(displayScore * 100).toFixed(2)}%</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">CV Score</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{(model.metrics.cv_score * 100).toFixed(2)}%</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Train Time</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{model.training_time.toFixed(3)}s</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DATASHEET PREVIEW TAB */}
                {!trainingJobDetail && preview && (
                  <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        Dataset Verification Preview 
                        <span className="font-semibold text-slate-400">({preview.rows.length} rows loaded)</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-100/90 dark:bg-zinc-900/90 font-bold uppercase tracking-wider text-[10px] text-slate-600 dark:text-zinc-400 backdrop-blur-xs">
                          <tr>
                            {preview.columns.map(c => (
                              <th key={c} className="px-3.5 py-2.5 text-left font-bold">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                          {preview.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition">
                              {preview.columns.map(c => (
                                <td key={c} className="px-3.5 py-2 truncate max-w-[150px] font-medium text-slate-700 dark:text-zinc-300 text-[11px]">
                                  {row[c] === null || row[c] === undefined ? <span className="text-rose-500 font-bold text-[10px]">null</span> : String(row[c])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      {/* CENTERED DETAILED EVALUATION MODAL */}
      {isModalOpen && trainingJobDetail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Blurred overlay */}
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-[#212121] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in font-sans">
            
            {/* Header */}
            <div className="p-4 px-6 border-b border-slate-100 dark:border-zinc-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/30">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight capitalize flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" /> Training Details: {trainingJobDetail.dataset_name}
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 block font-semibold uppercase tracking-wider">Trained with {trainingJobDetail.training_mode} mode</span>
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
              {Object.keys(trainingJobDetail.evaluation_metrics).map(algo => {
                const isBest = algo === trainingJobDetail.best_model_name;
                const isActive = algo === selectedModelForModal;
                return (
                  <button
                    key={algo}
                    onClick={() => setSelectedModelForModal(algo)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer shrink-0 capitalize flex items-center gap-1.5 ${
                      isActive 
                        ? "bg-primary text-white shadow-xs" 
                        : "bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 text-slate-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary"
                    }`}
                  >
                    {algo.replace(/_/g, ' ')} {isBest && <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />}
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
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Job Configurations Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs border p-4 rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Target (Y)</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{trainingJobDetail.target_column}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Features Count (X)</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{trainingJobDetail.selected_features.length} variables</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Split Size</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{(trainingJobDetail.hyperparameters.test_size || 0.2) * 100}% test</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">CV Folds</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{trainingJobDetail.hyperparameters.cv_folds || 5} Folds</strong>
                    </div>
                  </div>
                </div>

                {/* Preprocessing Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Automated Preprocessing</h4>
                  <div className="p-3.5 border rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20 text-xs leading-relaxed text-slate-600 dark:text-zinc-300 font-medium space-y-1.5">
                    <div className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500 shrink-0" /> Imputed missing numeric fields using Median Strategy</div>
                    <div className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500 shrink-0" /> Encoded categorical variables using sparse OneHotEncoder</div>
                    {selectedModelForModal === "polynomial_regression" && <div className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500 shrink-0" /> Generated Polynomial Features (degree=2)</div>}
                    {(selectedModelForModal === "knn_classifier" || selectedModelForModal === "svm_classifier") && <div className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500 shrink-0" /> Normalized numerical inputs using StandardScaler</div>}
                    {selectedModelForModal && !["knn_classifier", "svm_classifier", "polynomial_regression"].includes(selectedModelForModal) && <div className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-500 shrink-0" /> Preserved original numeric scales (no scaling needed for trees/linear estimators)</div>}
                  </div>
                </div>

                {/* Live Model Testing Panel */}
                <div className="space-y-3 p-4 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-primary animate-pulse" /> Test Model (Predict Live)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">
                    Provide mock feature values below to test the champion model pipeline on single-row inference.
                  </p>
                  
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {trainingJobDetail.selected_features.map((feature) => (
                      <div key={feature} className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">{feature}</label>
                        <input
                          type="text"
                          placeholder={`Enter value for ${feature}...`}
                          value={testInputs[feature] || ""}
                          onChange={(e) => {
                            setTestInputs(prev => ({
                              ...prev,
                              [feature]: e.target.value
                            }));
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition font-medium"
                        />
                      </div>
                    ))}
                  </div>

                  {predictErrorMsg && (
                    <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{predictErrorMsg}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-zinc-800/80 gap-3">
                    <button
                      onClick={handleTestPredict}
                      disabled={predicting}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {predicting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                      Predict
                    </button>

                    {predictionResult !== null && (
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-500 block">Predicted Value (Y)</span>
                        <span className="px-3 py-1 text-xs font-extrabold rounded-lg bg-primary/10 text-primary border border-primary/20 inline-block mt-0.5">
                          {typeof predictionResult === "number" ? predictionResult.toFixed(4) : String(predictionResult)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Evaluation Metrics Details */}
              <div className="space-y-6">
                
                {selectedModelForModal && trainingJobDetail.evaluation_metrics[selectedModelForModal] && (() => {
                  const modelData = trainingJobDetail.evaluation_metrics[selectedModelForModal];
                  const m = modelData.metrics;
                  const isClassification = "accuracy" in m;

                  return (
                    <div className="space-y-6">
                      
                      {/* Metric Card Listings */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Evaluation Metrics</h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {isClassification ? (
                            <>
                              <div className="p-3.5 border rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Accuracy</span>
                                <strong className="text-sm font-black text-emerald-500">{(m.accuracy * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Weighted F1-Score</span>
                                <strong className="text-sm font-extrabold text-slate-900 dark:text-white">{(m.f1_score * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Precision</span>
                                <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">{(m.precision * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Recall</span>
                                <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">{(m.recall * 100).toFixed(2)}%</strong>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-3.5 border rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">R² Score</span>
                                <strong className="text-sm font-black text-emerald-500">{(m.r2 * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Adjusted R²</span>
                                <strong className="text-sm font-extrabold text-slate-900 dark:text-white">{(m.adjusted_r2 * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">RMSE</span>
                                <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">{m.rmse.toFixed(4)}</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/20">
                                <span className="text-slate-400 dark:text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">MAE</span>
                                <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">{m.mae.toFixed(4)}</strong>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Confusion Matrix (Classification) */}
                      {isClassification && m.confusion_matrix && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Confusion Matrix</h4>
                          <div className="border border-slate-200/70 dark:border-zinc-800 rounded-xl overflow-hidden p-4 bg-slate-50/40 dark:bg-zinc-900/20">
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
                                })
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
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Actual vs Predicted (First 5 Rows)</h4>
                          <div className="border border-slate-200/70 dark:border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full text-center text-xs">
                              <thead className="bg-slate-100/70 dark:bg-zinc-900/80 font-bold uppercase tracking-wider text-[10px] text-slate-600 dark:text-zinc-400">
                                <tr>
                                  <th className="px-3 py-2">Row</th>
                                  <th className="px-3 py-2">Actual</th>
                                  <th className="px-3 py-2">Predicted</th>
                                  <th className="px-3 py-2">Residual Error</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                {trainingJobDetail.predictions.actual?.slice(0, 5).map((act, idx) => {
                                  const pred = trainingJobDetail.predictions.predicted[idx];
                                  const res = act - pred;
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/30">
                                      <td className="px-3 py-2 font-bold text-slate-400 dark:text-zinc-500 text-[11px]">#{idx}</td>
                                      <td className="px-3 py-2 font-medium text-slate-700 dark:text-zinc-200">{act.toFixed(3)}</td>
                                      <td className="px-3 py-2 font-bold text-primary">{pred.toFixed(3)}</td>
                                      <td className={`px-3 py-2 font-bold ${res < 0 ? "text-rose-500" : "text-emerald-500"}`}>{res.toFixed(3)}</td>
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

            {/* Footer actions */}
            <div className="p-4 px-6 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap gap-2 justify-between items-center bg-slate-50/50 dark:bg-zinc-900/30">
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(trainingJobDetail.id, "model")}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary-dark text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" /> Download Joblib
                </button>
                <button
                  onClick={() => handleDownload(trainingJobDetail.id, "predictions")}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Predictions CSV
                </button>
                <button
                  onClick={() => handleDownload(trainingJobDetail.id, "report")}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" /> PDF Summary
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Populate configuration parameters in parent states
                    setTargetColumn(trainingJobDetail.target_column);
                    setSelectedFeatures(trainingJobDetail.selected_features);
                    setTrainingMode(trainingJobDetail.training_mode);
                    setTestSize(trainingJobDetail.hyperparameters.test_size || 0.2);
                    setRandomState(trainingJobDetail.hyperparameters.random_state || 42);
                    setShuffle(trainingJobDetail.hyperparameters.shuffle ?? true);
                    setCvFolds(trainingJobDetail.hyperparameters.cv_folds || 5);
                    setIsModalOpen(false);
                    setSuccessMsg("Restored configuration parameters. Ready to retrain.");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retrain Setup
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    if (setActiveTab) setActiveTab("visualization");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <LineChart className="w-3.5 h-3.5" /> Visualize Dataset
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}