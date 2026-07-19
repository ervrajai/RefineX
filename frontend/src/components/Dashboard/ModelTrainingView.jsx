import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
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
  LineChart
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

      setSuccessMsg(`✓ Loaded cleaned dataset "${job.dataset_name}" from history!`);
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
            setSuccessMsg("✓ Training completed successfully!");
            // Load job details
            const detailRes = await api.get(`model-training/jobs/${activeJobId}/`);
            setTrainingJobDetail(detailRes.data);
          } else if (res.data.status === "failed") {
            setTraining(false);
            setActiveJobId(null);
            setErrorMsg(`⚠️ Model training failed: ${res.data.error_message}`);
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

  const uploadFile = async (file) => {
    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setTrainingJobDetail(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("model-training/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
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

      setSuccessMsg("✓ Dataset uploaded and inspected successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Upload failed. Verify CSV integrity.");
    } finally {
      setUploading(false);
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
      
      {/* Toast notifications */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 shadow-2xl backdrop-blur-md animate-fade-in max-w-md">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span className="flex-1 font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-rose-600 dark:text-rose-450 shadow-2xl backdrop-blur-md animate-fade-in max-w-md">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span className="flex-1 font-medium text-left">{errorMsg}</span>
        </div>
      )}

      {/* TABS HEADER */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" /> ML Model Training Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Build, evaluate, tune, and download scikit-learn preprocessing pipelines and estimators.
          </p>
        </div>
      </div>

      {/* CONSOLE PANEL */}
      <div className="space-y-6">
          
          {/* UPLOADER STATE */}
          {!datasetId ? (
            <div className="space-y-6">
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`p-10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center transition duration-300 min-h-[300px] bg-white dark:bg-[#121212]/30 ${
                  uploading ? "border-primary bg-primary/5" : "border-slate-300 dark:border-zinc-800 hover:border-primary dark:hover:border-zinc-700"
                }`}
              >
                <UploadCloud className="w-10 h-10 text-primary animate-bounce mb-4" />
                <h2 className="text-base font-bold text-black dark:text-white">
                  {uploading ? "Uploading dataset and verifying..." : "Drag & Drop dataset file"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-2 leading-relaxed">
                  CSV or Excel files only. Immediately validated for duplicate column indexes, rows sizes, and encoding errors.
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

              {!uploading && cleanHistoryList.length > 0 && (
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <History className="w-4.5 h-4.5 text-primary" />
                    <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Or Use a Clean Dataset from History</h3>
                  </div>
                  <p className="text-xs text-slate-550 dark:text-zinc-400">
                    Skip uploading by choosing a dataset you've previously cleaned on RefineX.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {cleanHistoryList.map(job => (
                      <div 
                        key={job.id}
                        onClick={() => handleUseFromHistory(job)}
                        className="p-3.5 rounded-xl border border-slate-150 dark:border-zinc-850 bg-slate-50/20 dark:bg-zinc-900/10 hover:border-primary dark:hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-zinc-900/40 cursor-pointer transition duration-150 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet className="w-4.5 h-4.5 text-slate-400 group-hover:text-primary transition shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block truncate">{job.dataset_name}</span>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase mt-0.5">Cleaned on {new Date(job.cleaned_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition shrink-0" />
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
              <div className="lg:col-span-1 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm space-y-4">
                <h2 className="text-xs font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-slate-150 dark:border-zinc-850">
                  <Settings className="w-4 h-4 text-primary" /> Training Parameters
                </h2>

                {/* Mode Select */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Training Mode</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
                    <button
                      onClick={() => setTrainingMode("decide")}
                      className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition cursor-pointer text-center ${
                        trainingMode === "decide" ? "bg-white dark:bg-zinc-800 text-primary" : "text-slate-550"
                      }`}
                    >
                      ✨ Decide (Rec)
                    </button>
                    <button
                      onClick={() => setTrainingMode("manual")}
                      className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition cursor-pointer text-center ${
                        trainingMode === "manual" ? "bg-white dark:bg-zinc-800 text-black dark:text-white" : "text-slate-550"
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {/* Y Column */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Target Variable (Y)</label>
                  <select
                    value={targetColumn}
                    onChange={(e) => {
                      setTargetColumn(e.target.value);
                      if (preview?.columns) {
                        setSelectedFeatures(preview.columns.filter(c => c !== e.target.value));
                      }
                    }}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none font-semibold text-slate-800 dark:text-zinc-150 cursor-pointer"
                  >
                    {preview?.columns?.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="text-[9px] font-bold text-primary capitalize">
                    Inferred Type: {inferredTaskType}
                  </span>
                </div>

                {/* X Columns Selection (Only Manual) */}
                {trainingMode === "manual" && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Feature Variables (X)</label>
                    <div className="max-h-36 overflow-y-auto border border-slate-100 dark:border-zinc-800 rounded p-2 bg-white dark:bg-zinc-900 space-y-1">
                      {preview?.columns?.filter(c => c !== targetColumn).map(c => (
                        <label key={c} className="flex items-center gap-1.5 cursor-pointer font-semibold text-[10px]">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(c)}
                            onChange={() => {
                              setSelectedFeatures(prev => 
                                prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                              );
                            }}
                            className="rounded text-primary focus:ring-primary/20 cursor-pointer"
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Algorithms selection (Only Manual) */}
                {trainingMode === "manual" && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Model Algorithms</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
                      <button
                        onClick={() => setModelChoice("all")}
                        className={`py-1 text-[9px] font-bold rounded-lg cursor-pointer text-center ${
                          modelChoice === "all" ? "bg-white dark:bg-zinc-800 text-black dark:text-white" : "text-slate-500"
                        }`}
                      >
                        All Compatible
                      </button>
                      <button
                        onClick={() => setModelChoice("selected")}
                        className={`py-1 text-[9px] font-bold rounded-lg cursor-pointer text-center ${
                          modelChoice === "selected" ? "bg-white dark:bg-zinc-800 text-black dark:text-white" : "text-slate-500"
                        }`}
                      >
                        Choose Models
                      </button>
                    </div>

                    {modelChoice === "selected" && (
                      <div className="space-y-1 border border-slate-100 dark:border-zinc-800 p-2 rounded bg-white dark:bg-zinc-900 max-h-36 overflow-y-auto">
                        {inferredTaskType === "classification" ? (
                          <>
                            {[
                              { id: "knn_classifier", label: "KNN Classifier" },
                              { id: "decision_tree_classifier", label: "Decision Tree Classifier" },
                              { id: "random_forest_classifier", label: "Random Forest Classifier" },
                              { id: "svm_classifier", label: "Support Vector Machine" }
                            ].map(m => (
                              <label key={m.id} className="flex items-center gap-1.5 cursor-pointer font-semibold text-[9.5px]">
                                <input
                                  type="checkbox"
                                  checked={selectedAlgorithms.includes(m.id)}
                                  onChange={() => {
                                    setSelectedAlgorithms(prev => 
                                      prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]
                                    );
                                  }}
                                  className="rounded text-primary cursor-pointer"
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
                              <label key={m.id} className="flex items-center gap-1.5 cursor-pointer font-semibold text-[9.5px]">
                                <input
                                  type="checkbox"
                                  checked={selectedAlgorithms.includes(m.id)}
                                  onChange={() => {
                                    setSelectedAlgorithms(prev => 
                                      prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]
                                    );
                                  }}
                                  className="rounded text-primary cursor-pointer"
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
                    className="w-full flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <span>Advanced Configurations</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition duration-150 ${showAdvanced ? "rotate-90" : ""}`} />
                  </button>
                  {showAdvanced && (
                    <div className="pt-3 space-y-3 text-[9.5px] animate-fade-in">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-500">
                          <span>Test Split Size</span>
                          <span className="text-primary font-black">{testSize * 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.4"
                          step="0.05"
                          value={testSize}
                          onChange={(e) => setTestSize(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold">Random State Seed</label>
                        <input
                          type="number"
                          value={randomState}
                          onChange={(e) => setRandomState(parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold">Cross-Validation Folds</label>
                        <input
                          type="number"
                          min="2"
                          max="10"
                          value={cvFolds}
                          onChange={(e) => setCvFolds(parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded font-semibold text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={shuffle}
                          onChange={(e) => setShuffle(e.target.checked)}
                          className="rounded cursor-pointer"
                        />
                        Shuffle Dataset
                      </label>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/85">
                  {compIssues ? (
                    <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-600 leading-relaxed">
                      {compIssues}
                    </div>
                  ) : (
                    <button
                      onClick={handleTrain}
                      disabled={training || !targetColumn}
                      className="w-full py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl transition duration-150 shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {training ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                      Start ML Model Training
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab("visualization");
                    }}
                    className="w-full mt-2 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition duration-150 shadow flex items-center justify-center gap-1.5 cursor-pointer"
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
                    className="w-full mt-2 py-1.5 text-[9.5px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg text-center cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition"
                  >
                    Clear Dataset
                  </button>
                </div>

              </div>

              {/* MAIN CONTENT AREA (RIGHT 75%) */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* QUALITY INSPECTION NOTIFICATION */}
                {!isClean && warnings && (
                  <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-slate-800 dark:text-zinc-100 space-y-3 animate-fade-in shadow-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <h3 className="text-sm font-black text-black dark:text-white tracking-tight">Dataset Quality Warnings Detected</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                      We automatically scanned the uploaded dataset and found schema warnings. Missing values, constant/empty columns, duplicate records, or infinite floats will negatively impact model convergence, scale metrics, or crash the validation splits. 
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                      {warnings.missing_values > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/30">Missing values: {warnings.missing_values} cells</span>}
                      {warnings.duplicate_rows > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/30">Duplicate rows: {warnings.duplicate_rows}</span>}
                      {warnings.duplicate_columns?.length > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/30">Duplicate columns: {warnings.duplicate_columns.length}</span>}
                      {warnings.infinite_values > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/30">Infinite values: {warnings.infinite_values}</span>}
                      {warnings.mixed_data_types?.length > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/30">Mixed types: {warnings.mixed_data_types.length}</span>}
                      {warnings.constant_columns?.length > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/30">Constant cols: {warnings.constant_columns.length}</span>}
                    </div>
                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={handleRedirectToClean}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition duration-150"
                      >
                        ⚡ Clean Dataset First
                      </button>
                      <button
                        onClick={() => setIsClean(true)}
                        className="px-4 py-2 border border-slate-350 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl hover:bg-white/10 cursor-pointer transition"
                      >
                        Force Train Anyway
                      </button>
                    </div>
                  </div>
                )}

                {/* RUNNING TRAINING PROGRESS */}
                {training && jobStatus && (
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary animate-pulse" />
                        <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">RefineX Training Pipeline Running</h3>
                      </div>
                      <span className="text-sm font-black text-primary">{jobStatus.progress_percent}%</span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-850 overflow-hidden border border-slate-200/50 dark:border-zinc-800">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 ease-out" 
                        style={{ width: `${jobStatus.progress_percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-wider">
                      <span className="capitalize">Stage: <strong className="text-primary font-black">{jobStatus.progress_stage.replace('_', ' ')}</strong></span>
                      <span>Est. Remaining: ~ {Math.max(5, 30 - Math.round(jobStatus.progress_percent * 0.25))} seconds</span>
                    </div>
                  </div>
                )}

                {/* GRID RESULTS */}
                {trainingJobDetail && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Trained Estimators Leaderboard</h2>
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
                            className={`p-5 rounded-2xl border bg-white dark:bg-[#121212] shadow-sm hover:shadow-md cursor-pointer transition duration-200 relative group flex flex-col justify-between h-48 ${
                              isBest 
                                ? "border-primary ring-1 ring-primary/30" 
                                : "border-slate-200 dark:border-zinc-800"
                            }`}
                          >
                            <div>
                              {isBest && (
                                <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/25 text-[8.5px] uppercase font-bold tracking-wider">
                                  👑 Champion
                                </span>
                              )}
                              <h3 className="text-sm font-black text-black dark:text-white tracking-tight pr-12 group-hover:text-primary transition duration-150 capitalize">
                                {model.algorithm.replace('_', ' ')}
                              </h3>
                              <span className="text-[9.5px] text-slate-450 uppercase font-bold mt-1 block">
                                Inferred Task: {trainingJobDetail.evaluation_metrics ? ("r2" in model.metrics ? "Regression" : "Classification") : ""}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-zinc-800/80 pt-3">
                              <div>
                                <span className="text-[8.5px] uppercase font-bold text-slate-400 block">{scoreType} Score</span>
                                <span className="text-xs font-black text-black dark:text-white">{(displayScore * 100).toFixed(2)}%</span>
                              </div>
                              <div>
                                <span className="text-[8.5px] uppercase font-bold text-slate-400 block">CV Score</span>
                                <span className="text-xs font-black text-slate-700 dark:text-zinc-300">{(model.metrics.cv_score * 100).toFixed(2)}%</span>
                              </div>
                              <div>
                                <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Train Time</span>
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
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Dataset Verification Preview <span className="font-semibold text-slate-400">({preview.rows.length} rows loaded)</span></span>
                    </div>
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-[10px]">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-zinc-900 font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-400">
                          <tr>
                            {preview.columns.map(c => (
                              <th key={c} className="px-3 py-2 text-left">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {preview.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                              {preview.columns.map(c => (
                                <td key={c} className="px-3 py-2 truncate max-w-[150px] font-medium">
                                  {row[c] === null || row[c] === undefined ? <span className="text-rose-500 font-bold">null</span> : String(row[c])}
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
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in font-sans">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-zinc-850 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
              <div>
                <h3 className="text-sm font-black text-black dark:text-white tracking-tight capitalize flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-primary" /> Training Details: {trainingJobDetail.dataset_name}
                </h3>
                <span className="text-[10px] text-slate-450 mt-0.5 block font-semibold">Trained with {trainingJobDetail.training_mode.toUpperCase()} mode</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-navigation for Algorithms */}
            <div className="px-4 py-2 bg-slate-100/40 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-850 flex gap-2 overflow-x-auto">
              {Object.keys(trainingJobDetail.evaluation_metrics).map(algo => {
                const isBest = algo === trainingJobDetail.best_model_name;
                const isActive = algo === selectedModelForModal;
                return (
                  <button
                    key={algo}
                    onClick={() => setSelectedModelForModal(algo)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer shrink-0 capitalize ${
                      isActive 
                        ? "bg-primary text-white" 
                        : "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-850 text-slate-650 hover:text-primary"
                    }`}
                  >
                    {algo.replace('_', ' ')} {isBest ? "👑" : ""}
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
                  <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Job Configurations Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-[10px] border p-4 rounded-xl border-slate-100 dark:border-zinc-850 bg-slate-50/20 dark:bg-zinc-900/10">
                    <div>
                      <span className="text-slate-400 block font-semibold">Target (Y)</span>
                      <strong className="text-black dark:text-white text-xs">{trainingJobDetail.target_column}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Features Count (X)</span>
                      <strong className="text-black dark:text-white text-xs">{trainingJobDetail.selected_features.length} variables</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Split Size</span>
                      <strong className="text-black dark:text-white text-xs">{(trainingJobDetail.hyperparameters.test_size || 0.2) * 100}% test</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">CV Folds</span>
                      <strong className="text-black dark:text-white text-xs">{trainingJobDetail.hyperparameters.cv_folds || 5} Folds</strong>
                    </div>
                  </div>
                </div>

                {/* Preprocessing Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Automated Preprocessing</h4>
                  <div className="p-3.5 border rounded-xl border-slate-100 dark:border-zinc-850 bg-slate-50/20 dark:bg-zinc-900/10 text-[9.5px] leading-relaxed text-slate-600 dark:text-zinc-300 font-semibold space-y-1">
                    <div>• Imputed missing numeric fields using Median Strategy</div>
                    <div>• Encoded categorical variables using sparse OneHotEncoder</div>
                    {selectedModelForModal === "polynomial_regression" && <div>• Generated Polynomial Features (degree=2)</div>}
                    {(selectedModelForModal === "knn_classifier" || selectedModelForModal === "svm_classifier") && <div>• Normalized numerical inputs using StandardScaler</div>}
                    {selectedModelForModal && !["knn_classifier", "svm_classifier", "polynomial_regression"].includes(selectedModelForModal) && <div>• Preserved original numeric scales (no scaling needed for trees/linear estimators)</div>}
                  </div>
                </div>

                {/* Live Model Testing Panel */}
                <div className="space-y-3 p-4 rounded-xl border border-primary/10 bg-primary/5 dark:bg-primary/5">
                  <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-primary animate-pulse" /> Test Model (Predict Live)
                  </h4>
                  <p className="text-[9.5px] text-slate-500 dark:text-zinc-400 leading-normal">
                    Provide mock feature values below to test the champion model pipeline on single-row inference.
                  </p>
                  
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {trainingJobDetail.selected_features.map((feature) => (
                      <div key={feature} className="space-y-1">
                        <label className="block text-[9.5px] font-bold text-slate-650 dark:text-zinc-300">{feature}</label>
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
                          className="w-full px-2.5 py-1.5 text-[10px] rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {predictErrorMsg && (
                    <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-[9.5px] font-bold text-rose-600 leading-normal">
                      ⚠ {predictErrorMsg}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 gap-3">
                    <button
                      onClick={handleTestPredict}
                      disabled={predicting}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-[10px] rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {predicting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                      Predict
                    </button>

                    {predictionResult !== null && (
                      <div className="text-right">
                        <span className="text-[8px] uppercase font-bold text-slate-450 block">Predicted Value (Y)</span>
                        <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-primary/20 text-primary border border-primary/25 inline-block">
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
                        <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Evaluation Metrics</h4>
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          {isClassification ? (
                            <>
                              <div className="p-3.5 border rounded-xl border-slate-100 dark:border-zinc-850">
                                <span className="text-slate-400 block font-bold">Accuracy</span>
                                <strong className="text-sm font-black text-emerald-500">{(m.accuracy * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-100 dark:border-zinc-850">
                                <span className="text-slate-400 block font-bold">Weighted F1-Score</span>
                                <strong className="text-sm font-black text-black dark:text-white">{(m.f1_score * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-100 dark:border-zinc-850">
                                <span className="text-slate-400 block font-bold">Precision</span>
                                <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">{(m.precision * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-100 dark:border-zinc-850">
                                <span className="text-slate-400 block font-bold">Recall</span>
                                <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">{(m.recall * 100).toFixed(2)}%</strong>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-3.5 border rounded-xl border-slate-100 dark:border-zinc-850">
                                <span className="text-slate-400 block font-bold">R² Score</span>
                                <strong className="text-sm font-black text-emerald-500">{(m.r2 * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-100 dark:border-zinc-850">
                                <span className="text-slate-400 block font-bold">Adjusted R²</span>
                                <strong className="text-sm font-black text-black dark:text-white">{(m.adjusted_r2 * 100).toFixed(2)}%</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-100 dark:border-zinc-850">
                                <span className="text-slate-400 block font-bold">RMSE</span>
                                <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">{m.rmse.toFixed(4)}</strong>
                              </div>
                              <div className="p-3.5 border rounded-xl border-slate-100 dark:border-zinc-850">
                                <span className="text-slate-400 block font-bold">MAE</span>
                                <strong className="text-sm font-bold text-slate-700 dark:text-zinc-200">{m.mae.toFixed(4)}</strong>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Confusion Matrix (Classification) */}
                      {isClassification && m.confusion_matrix && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Confusion Matrix</h4>
                          <div className="border border-slate-100 dark:border-zinc-850 rounded-xl overflow-hidden p-4 bg-slate-50/20 dark:bg-zinc-900/10">
                            <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold text-slate-700 dark:text-zinc-300">
                              {m.confusion_matrix.map((row, rIdx) => 
                                row.map((val, cIdx) => {
                                  const isDiag = rIdx === cIdx;
                                  return (
                                    <div 
                                      key={`${rIdx}-${cIdx}`}
                                      className={`p-3 rounded-lg border ${
                                        isDiag 
                                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-450" 
                                          : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                                      }`}
                                    >
                                      {val}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                            <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-2.5 px-1">
                              <span>Predicted Classes</span>
                              <span>Target Splits</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actual vs Predicted Summary (Regression) */}
                      {!isClassification && trainingJobDetail.predictions && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Actual vs Predicted (First 5 Rows)</h4>
                          <div className="border border-slate-100 dark:border-zinc-850 rounded-xl overflow-hidden">
                            <table className="w-full text-center text-[10px]">
                              <thead className="bg-slate-50 dark:bg-zinc-900 font-bold uppercase tracking-wider text-slate-750">
                                <tr>
                                  <th className="px-3 py-2">Row Index</th>
                                  <th className="px-3 py-2">Actual Value</th>
                                  <th className="px-3 py-2">Predicted Value</th>
                                  <th className="px-3 py-2">Residual Error</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {trainingJobDetail.predictions.actual?.slice(0, 5).map((act, idx) => {
                                  const pred = trainingJobDetail.predictions.predicted[idx];
                                  const res = act - pred;
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30">
                                      <td className="px-3 py-2 font-bold text-slate-450">#{idx}</td>
                                      <td className="px-3 py-2 font-semibold text-slate-700 dark:text-zinc-250">{act.toFixed(3)}</td>
                                      <td className="px-3 py-2 font-semibold text-primary">{pred.toFixed(3)}</td>
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
            <div className="p-4 border-t border-slate-100 dark:border-zinc-850 flex flex-wrap gap-2 justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20">
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(trainingJobDetail.id, "model")}
                  className="px-3.5 py-2 text-[10px] font-bold rounded-xl bg-primary hover:bg-primary-dark text-white shadow transition cursor-pointer flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" /> Download joblib Model
                </button>
                <button
                  onClick={() => handleDownload(trainingJobDetail.id, "predictions")}
                  className="px-3.5 py-2 text-[10px] font-bold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-200 transition cursor-pointer flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Predictions CSV
                </button>
                <button
                  onClick={() => handleDownload(trainingJobDetail.id, "report")}
                  className="px-3.5 py-2 text-[10px] font-bold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-855 text-slate-800 dark:text-zinc-200 transition cursor-pointer flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" /> PDF Summary Report
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
                    setSuccessMsg("✓ Restored configuration parameters. Ready to retrain.");
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-650 text-white font-bold text-[10px] rounded-xl hover:shadow shadow-md transition cursor-pointer"
                >
                  🔄 Retrain Setup
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    if (setActiveTab) setActiveTab("visualization");
                  }}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-[10px] rounded-xl hover:shadow shadow-md transition cursor-pointer flex items-center gap-1"
                >
                  <LineChart className="w-3.5 h-3.5" /> Visualize Dataset
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-350 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-[10px] rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
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
