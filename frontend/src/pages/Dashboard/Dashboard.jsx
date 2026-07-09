import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Subcomponents
import Sidebar from "../../components/Dashboard/Sidebar";
import SettingsView from "../../components/Dashboard/SettingsView";
import CleanView from "../../components/Dashboard/CleanView";
import HistoryView from "../../components/Dashboard/HistoryView";
import ModelTrainingView from "../../components/Dashboard/ModelTrainingView";

import { 
  Sparkles,
  BrainCircuit,
  LineChart,
  History,
  Bell
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const { setLoggedOut } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Persisted Dataset Workspace states
  const [datasetId, setDatasetId] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [report, setReport] = useState(null);
  const [preview, setPreview] = useState(null);
  const [beforeReport, setBeforeReport] = useState(null);
  const [afterReport, setAfterReport] = useState(null);
  const [cleanLogs, setCleanLogs] = useState([]);

  // Lifted Model Training configuration states
  const [trainingMode, setTrainingMode] = useState("decide");
  const [targetColumn, setTargetColumn] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [modelChoice, setModelChoice] = useState("all");
  const [selectedAlgorithms, setSelectedAlgorithms] = useState([]);
  const [testSize, setTestSize] = useState(0.2);
  const [randomState, setRandomState] = useState(42);
  const [shuffle, setShuffle] = useState(true);
  const [cvFolds, setCvFolds] = useState(5);
  const [trainingJobDetail, setTrainingJobDetail] = useState(null);

  // Theme Sync on Mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "auto";
    const applyTheme = (currentTheme) => {
      const root = document.documentElement;
      if (currentTheme === "dark") {
        root.classList.add("dark");
      } else if (currentTheme === "light") {
        root.classList.remove("dark");
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };
    applyTheme(storedTheme);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get("accounts/me/")
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load profile. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("accounts/logout/");
      setLoggedOut();
      navigate("/login", { replace: true });
    } catch {
      setError("Failed to log out. Please try again.");
      setLoggingOut(false);
    }
  };

  const handleScroll = (e) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  return (
    <div className="flex w-screen h-screen bg-[#fcfcfc] dark:bg-[#070708] text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden font-sans">
      
      {/* Dynamic Collapsible Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        loading={loading}
        handleLogout={handleLogout}
        loggingOut={loggingOut}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Workspace Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Floating Notification Bell (Only shown at the top, fades out on scroll) */}
        <div className={`absolute top-4 right-6 z-40 transition-all duration-300 ${
          isScrolled ? "opacity-0 pointer-events-none -translate-y-2" : "opacity-100 translate-y-0"
        }`}>
          <button className="relative p-2.5 rounded-xl text-slate-500 dark:text-zinc-400 bg-[#fafafa]/80 dark:bg-[#121212]/80 border border-slate-200/50 dark:border-zinc-800 backdrop-blur shadow-sm hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition duration-200 cursor-pointer">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-white dark:ring-zinc-900" />
          </button>
        </div>

        {/* Dynamic content area - listens for scroll to hide/show bell */}
        <main onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 space-y-6 pt-16">
          
          {/* Main Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-450 animate-fade-in" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* TAB 1: OVERVIEW - Blank placeholder as requested */}
          {activeTab === "overview" && null}

          {/* TAB 2: CLEAN */}
          {activeTab === "clean" && (
            <CleanView
              datasetId={datasetId}
              setDatasetId={setDatasetId}
              metadata={metadata}
              setMetadata={setMetadata}
              report={report}
              setReport={setReport}
              preview={preview}
              setPreview={setPreview}
              beforeReport={beforeReport}
              setBeforeReport={setBeforeReport}
              afterReport={afterReport}
              setAfterReport={setAfterReport}
              cleanLogs={cleanLogs}
              setCleanLogs={setCleanLogs}
              setActiveTab={setActiveTab}
            />
          )}

          {/* TAB 3: MODEL TRAINING */}
          {activeTab === "model-training" && (
            <ModelTrainingView
              datasetId={datasetId}
              setDatasetId={setDatasetId}
              metadata={metadata}
              setMetadata={setMetadata}
              preview={preview}
              setPreview={setPreview}
              trainingMode={trainingMode}
              setTrainingMode={setTrainingMode}
              targetColumn={targetColumn}
              setTargetColumn={setTargetColumn}
              selectedFeatures={selectedFeatures}
              setSelectedFeatures={setSelectedFeatures}
              modelChoice={modelChoice}
              setModelChoice={setModelChoice}
              selectedAlgorithms={selectedAlgorithms}
              setSelectedAlgorithms={setSelectedAlgorithms}
              testSize={testSize}
              setTestSize={setTestSize}
              randomState={randomState}
              setRandomState={setRandomState}
              shuffle={shuffle}
              setShuffle={setShuffle}
              cvFolds={cvFolds}
              setCvFolds={setCvFolds}
              trainingJobDetail={trainingJobDetail}
              setTrainingJobDetail={setTrainingJobDetail}
              onLoadWorkspace={(dsId, meta, bReport, aReport, logs, previewData) => {
                setDatasetId(dsId);
                setMetadata(meta);
                setReport(aReport || bReport);
                setBeforeReport(bReport);
                setAfterReport(aReport);
                setCleanLogs(logs || []);
                setPreview(previewData);
              }}
              setActiveTab={setActiveTab}
            />
          )}

          {/* TAB 4: VISUALIZATION */}
          {activeTab === "visualization" && (
            <div className="space-y-4 max-w-xl animate-fade-in text-black dark:text-white">
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121212] shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/10">
                    <LineChart className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-150">Data Visualization</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  (Visualization Tab view is ready. Dashboard plots will be loaded subsequently.)
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: HISTORY */}
          {activeTab === "history" && (
            <HistoryView
              onLoadWorkspace={(dsId, meta, bReport, aReport, logs, previewData) => {
                setDatasetId(dsId);
                setMetadata(meta);
                setReport(aReport || bReport);
                setBeforeReport(bReport);
                setAfterReport(aReport);
                setCleanLogs(logs || []);
                setPreview(previewData);
              }}
              onRestoreRedirect={() => {
                setActiveTab("clean");
              }}
              onTrainModelRedirect={() => {
                setActiveTab("model-training");
              }}
              onLoadTrainingWorkspace={(job) => {
                setTargetColumn(job.target_column);
                setSelectedFeatures(job.selected_features || []);
                setTrainingMode(job.training_mode || "decide");
                if (job.hyperparameters) {
                  setTestSize(job.hyperparameters.test_size || 0.2);
                  setRandomState(job.hyperparameters.random_state || 42);
                  setShuffle(job.hyperparameters.shuffle ?? true);
                  setCvFolds(job.hyperparameters.cv_folds || 5);
                }
                setTrainingJobDetail(job);
                setActiveTab("model-training");
              }}
            />
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <SettingsView
              user={user}
              loading={loading}
              error={error}
            />
          )}

        </main>

        {/* Footer info banner */}
        <footer className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-[#fafafa]/50 dark:bg-[#0c0c0e]/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 flex items-center justify-between select-none">
          <span>RefineX Platform</span>
          <span>© {new Date().getFullYear()} — DB Optimizer</span>
        </footer>

      </div>
    </div>
  );
}

export default Dashboard;