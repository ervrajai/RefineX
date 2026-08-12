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


import logoImg from "../../assets/logo/refinex_logo.png";

import { 
  Sparkles,
  BrainCircuit,
  LineChart,
  History,
  Sun,
  Moon
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

  // Mobile Header Theme State
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    const syncTheme = () => {
      const stored = localStorage.getItem("theme") || (document.documentElement.classList.contains("dark") ? "dark" : "light");
      setThemeState(stored);
    };
    window.addEventListener("themeChange", syncTheme);
    return () => window.removeEventListener("themeChange", syncTheme);
  }, []);

  const isDarkMode = theme === "dark" || (theme === "auto" && document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    const targetMode = isDarkMode ? "light" : "dark";
    localStorage.setItem("theme", targetMode);
    setThemeState(targetMode);
    if (targetMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("themeChange"));
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };

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
  const [overviewLoading, setOverviewLoading] = useState(false);

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

  const lastScrollTopRef = useRef(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const handleScroll = (e) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    setIsScrolled(currentScrollTop > 10);

    if (currentScrollTop <= 10) {
      setIsHeaderVisible(true);
    } else if (currentScrollTop > lastScrollTopRef.current + 8) {
      // User scrolling DOWN -> vanish header
      setIsHeaderVisible(false);
    } else if (currentScrollTop < lastScrollTopRef.current - 8) {
      // User scrolling UP -> reveal header
      setIsHeaderVisible(true);
    }
    lastScrollTopRef.current = currentScrollTop;
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
        
        {/* MOBILE FLOATING TOP GLASS HEADER (Elevated Floating Pill Bar, Vanishes on Scroll Down / Reveals on Scroll Up) */}
        <header className={`md:hidden fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-[420px] pointer-events-auto transition-all duration-300 ease-in-out transform ${
          isHeaderVisible ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"
        }`}>
          <div className="relative flex items-center justify-between px-3.5 h-[52px] rounded-full bg-white/80 dark:bg-[#212121]/80 backdrop-blur-3xl border border-slate-200/80 dark:border-zinc-800 shadow-md dark:shadow-black/50">
            {/* Left: App Logo & Brand Name */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("overview")}>
              <img src={logoImg} alt="RefineX Logo" className="w-[32px] h-[32px] object-cover rounded-lg shrink-0 shadow-xs" />
              <span className="sidebar-refine text-base tracking-wider inline-flex items-center text-slate-900 dark:text-white whitespace-nowrap">
                Refine<span className="font-sans text-[#673ab7] text-xl font-black ml-0.5 inline-flex items-center justify-center leading-none">X</span>
              </span>
            </div>

            {/* Right: Dark/Light Mode Toggle + Profile Avatar */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="w-8.5 h-8.5 rounded-full flex items-center justify-center bg-slate-100/90 dark:bg-zinc-800/90 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-purple-600" />
                )}
              </button>

              {/* Profile Avatar Button -> Tapping redirects to Settings / Profile */}
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                title="View Profile Settings"
                className="relative w-8.5 h-8.5 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800 flex items-center justify-center border-2 border-purple-500/40 dark:border-purple-400/40 shadow-2xs cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
              >
                {loading ? (
                  <div className="w-full h-full animate-pulse bg-slate-300 dark:bg-zinc-700" />
                ) : user?.profile_picture ? (
                  <img src={user.profile_picture} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {user ? getInitials(user.first_name, user.last_name, user.email) : "?"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic content area - listens for scroll */}
        <main id="main-scroll-container" onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pt-16 sm:pt-6">
          
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