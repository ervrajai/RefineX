import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Subcomponents
import Sidebar from "../../components/Dashboard/Sidebar";
import OverviewView from "../../components/Dashboard/OverviewView";
import SettingsView from "../../components/Dashboard/SettingsView";
import CleanView from "../../components/Dashboard/CleanView";
import HistoryView from "../../components/Dashboard/HistoryView";
import ModelTrainingView from "../../components/Dashboard/ModelTrainingView";
import VisualizationView from "../../components/Dashboard/VisualizationView";


import { 
  Sparkles,
  BrainCircuit,
  LineChart,
  History
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, setLoggedOut } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Centralized History & Dataset Pagination State
  const [historyList, setHistoryList] = useState([]);
  const [historyHasMore, setHistoryHasMore] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);

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
  const [restoredGraph, setRestoredGraph] = useState(null);

  // Lifted Model Training execution states for tab switch persistence & background execution
  const [activeJobId, setActiveJobId] = useState(null);
  const [training, setTraining] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const notifiedJobsRef = useRef(new Set());

  // Background polling for model training status so training continues seamless polling across tab switches
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
            // Load completed job details
            const detailRes = await api.get(`model-training/jobs/${activeJobId}/`);
            setTrainingJobDetail(detailRes.data);
            fetchInitialHistory();
          } else if (res.data.status === "failed") {
            setTraining(false);
            setActiveJobId(null);
          }
        } catch (err) {
          console.error("Background training polling error:", err);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJobId, training]);

  // Lifted Visualization States for RAM caching & mount bypass
  const [chartData, setChartData] = useState(null);
  const [chartConfig, setChartConfig] = useState(null);
  const [isGraphLoading, setIsGraphLoading] = useState(false);

  // Reset visualization loading state when datasetId changes
  useEffect(() => {
    setIsGraphLoading(false);
  }, [datasetId]);

  // Centralized Overview Statistics Cache State
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Central Initial Overview Fetch (cached in state, refetched only on page refresh or explicit update)
  const fetchOverviewData = async (force = false) => {
    if (overviewData && !force) return;
    setOverviewLoading(true);
    try {
      const res = await api.get("dashboard/stats/");
      setOverviewData(res.data);
    } catch (err) {
      console.error("Dashboard stats error:", err);
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  // Central Initial History Fetch (PAGINATED, DYNAMIC REFRESH LIMIT)
  const fetchInitialHistory = async (targetLimit) => {
    setHistoryLoading(true);
    try {
      const fetchLimit = targetLimit || Math.max(10, historyList.length || 10);
      const res = await api.get(`history/?limit=${fetchLimit}&offset=0`);
      const results = res.data.results || (Array.isArray(res.data) ? res.data : []);
      const hasNext = Boolean(res.data.next);
      setHistoryList(results);
      setHistoryOffset(results.length);
      setHistoryHasMore(hasNext);
    } catch (err) {
      console.error("Failed to fetch initial history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Next Page for Infinite Scroll
  const fetchMoreHistory = async () => {
    if (historyLoadingMore || !historyHasMore) return;
    setHistoryLoadingMore(true);
    try {
      const res = await api.get(`history/?limit=10&offset=${historyOffset}`);
      const newResults = res.data.results || [];
      const hasNext = Boolean(res.data.next);
      setHistoryList((prev) => [...prev, ...newResults]);
      setHistoryOffset((prev) => prev + newResults.length);
      setHistoryHasMore(hasNext);
    } catch (err) {
      console.error("Failed to load more history:", err);
    } finally {
      setHistoryLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialHistory();
  }, []);

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

  const handleQuickResume = (ds) => {
    setDatasetId(ds.id);
    setMetadata({
      name: ds.name,
      file_type: ds.file_type,
      file_size: ds.file_size,
      rows: ds.rows_count,
      columns: ds.cols_count,
      status: ds.status
    });
    if (ds.before_report || ds.after_report) {
      setBeforeReport(ds.before_report || null);
      setAfterReport(ds.after_report || null);
      setReport(ds.after_report || ds.before_report || null);
    }
    if (ds.clean_logs) {
      setCleanLogs(ds.clean_logs);
    }
    setActiveTab("clean");
  };

  const handleScroll = (e) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  return (
    <div className="flex w-screen h-screen bg-[#F8FAFC] dark:bg-[#0F0F0F] text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden font-sans">
      
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
        
        {/* Dynamic content area - listens for scroll */}
        <main id="main-scroll-container" onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 space-y-6 pt-16">
          
          {/* Main Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-450 animate-fade-in" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <OverviewView
              user={user}
              setActiveTab={setActiveTab}
              onQuickResume={handleQuickResume}
              historyList={historyList}
              overviewData={overviewData}
              overviewLoading={overviewLoading}
              onRefreshOverview={() => fetchOverviewData(true)}
            />
          )}

          {/* TAB 2: CLEAN - Strict Conditional Rendering (No CSS hidden class) */}
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
              historyList={historyList}
              onRefreshHistory={fetchInitialHistory}
            />
          )}

          {/* TAB 3: MODEL TRAINING - Strict Conditional Rendering */}
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
              activeJobId={activeJobId}
              setActiveJobId={setActiveJobId}
              training={training}
              setTraining={setTraining}
              jobStatus={jobStatus}
              setJobStatus={setJobStatus}
              notifiedJobsRef={notifiedJobsRef}
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
              historyList={historyList}
              onRefreshHistory={fetchInitialHistory}
            />
          )}

          {/* TAB 4: VISUALIZATION - Strict Conditional Rendering */}
          {activeTab === "visualization" && (
            <VisualizationView
              datasetId={datasetId}
              setDatasetId={setDatasetId}
              metadata={metadata}
              setMetadata={setMetadata}
              report={report}
              setReport={setReport}
              preview={preview}
              setPreview={setPreview}
              setBeforeReport={setBeforeReport}
              setAfterReport={setAfterReport}
              setCleanLogs={setCleanLogs}
              setActiveTab={setActiveTab}
              restoredGraph={restoredGraph}
              setRestoredGraph={setRestoredGraph}
              historyList={historyList}
              onRefreshHistory={fetchInitialHistory}
              chartData={chartData}
              setChartData={setChartData}
              chartConfig={chartConfig}
              setChartConfig={setChartConfig}
              isGraphLoading={isGraphLoading}
              setIsGraphLoading={setIsGraphLoading}
            />
          )}

          {/* TAB 5: HISTORY */}
          {activeTab === "history" && (
            <HistoryView
              historyList={historyList}
              historyHasMore={historyHasMore}
              historyLoading={historyLoading}
              historyLoadingMore={historyLoadingMore}
              onFetchMoreHistory={fetchMoreHistory}
              onRefreshHistory={fetchInitialHistory}
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
              onLoadVisualizationWorkspace={(graph) => {
                setRestoredGraph(graph);
                setActiveTab("visualization");
              }}
            />
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <SettingsView
              user={user}
              loading={loading}
              error={error}
              handleLogout={handleLogout}
              onProfileUpdate={(updatedUser) => setUser(updatedUser)}
            />
          )}

        </main>
      </div>
    </div>
  );
}

export default Dashboard;