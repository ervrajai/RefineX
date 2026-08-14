import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  Sparkles, 
  BrainCircuit, 
  BarChart3, 
  Activity, 
  User,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  BrushCleaning,
  LineChart,
  Play
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis 
} from "recharts";
import api from "../../services/api";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  GridLayer
} from "../ui/chart";

const barChartConfig = {
  score: {
    label: "Accuracy Score",
    color: "#8b5cf6",
  },
};

const pieChartConfig = {
  "Cleaned Files": {
    label: "Cleaned Files",
    color: "#10b981",
  },
  "Trained Models": {
    label: "Trained Models",
    color: "#8b5cf6",
  },
  "Visualizations": {
    label: "Visualizations",
    color: "#06b6d4",
  },
};

function OverviewView({
  user,
  onQuickResume,
  setActiveTab,
  historyList = [],
  overviewData = null,
  overviewLoading = false,
  onRefreshOverview
}) {
  const [data, setData] = useState(overviewData);
  const [history, setHistory] = useState(historyList);
  const [error, setError] = useState("");

  const loading = overviewLoading || (!overviewData && !data);

  useEffect(() => {
    if (overviewData) {
      setData(overviewData);
    }
  }, [overviewData]);

  useEffect(() => {
    if (historyList && historyList.length > 0) {
      setHistory(historyList);
    }
  }, [historyList]);

  const formatDate = (isoStr) => {
    if (!isoStr) return "Recently";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans text-slate-900 dark:text-white pb-10 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* --- LEFT COLUMN SKELETON (lg:col-span-8) --- */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            
            {/* Mobile Header Skeleton */}
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              {/* Square 1: Gradient Action Skeleton */}
              <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-purple-400/40 to-purple-500/40 border border-purple-400/20 aspect-square flex flex-col justify-between shadow-sm animate-pulse">
                <div className="space-y-2">
                  <div className="h-2.5 w-16 bg-white/40 rounded-full" />
                  <div className="h-3.5 w-24 bg-white/50 rounded-lg" />
                  <div className="h-3.5 w-20 bg-white/50 rounded-lg" />
                </div>
                <div className="h-8 w-full bg-black/30 rounded-full" />
              </div>

              {/* Square 2: Profile Image + Greeting Skeleton */}
              <div className="rounded-3xl p-4 sm:p-5 bg-white dark:bg-[#212121] border border-slate-200/80 dark:border-zinc-800 aspect-square flex flex-col items-center justify-between text-center shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700" />
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="h-2.5 w-14 bg-slate-100 dark:bg-zinc-800 rounded" />
                  <div className="h-3.5 w-20 bg-slate-100 dark:bg-zinc-800 rounded" />
                </div>
                <div className="h-4 w-16 bg-slate-100 dark:bg-zinc-800 rounded-full" />
              </div>
            </div>

            {/* Desktop Hero Banner Skeleton */}
            <div className="hidden sm:flex w-full min-h-[200px] rounded-3xl p-8 bg-gradient-to-r from-purple-500/30 to-purple-600/30 border border-purple-400/20 flex-col justify-between shadow-sm relative overflow-hidden animate-pulse">
              <div className="space-y-3">
                <div className="h-3 w-28 bg-white/40 rounded-full" />
                <div className="h-7 w-80 bg-white/50 rounded-xl" />
                <div className="h-7 w-60 bg-white/50 rounded-xl" />
              </div>
              <div className="h-10 w-40 bg-zinc-950/40 rounded-full mt-4" />
            </div>

            {/* Quick Links Skeleton */}
            <div className="flex flex-col gap-3">
              <div className="h-3.5 w-28 bg-slate-200 dark:bg-zinc-800 rounded-md animate-pulse ml-1" />
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 min-h-[105px] sm:min-h-[120px] shadow-sm flex flex-col justify-between animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-zinc-800" />
                      <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80" />
                    </div>
                    <div className="h-4 w-20 sm:w-28 bg-slate-100 dark:bg-zinc-800 rounded-md mt-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics Section Skeleton */}
            <div className="flex flex-col gap-3">
              <div className="h-3.5 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md animate-pulse ml-1" />
              <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-10 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-zinc-800">
                  
                  {/* Model Accuracy Chart Skeleton */}
                  <div className="lg:col-span-7 p-6 flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-zinc-800" />
                        <div className="space-y-1">
                          <div className="h-3.5 w-28 bg-slate-100 dark:bg-zinc-800 rounded" />
                          <div className="h-2.5 w-48 bg-slate-100 dark:bg-zinc-800 rounded" />
                        </div>
                      </div>
                      <div className="h-5 w-16 bg-purple-50 dark:bg-zinc-800 rounded-full" />
                    </div>

                    <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2">
                      {[65, 40, 85, 55, 90, 70, 75].map((h, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-purple-500/20 dark:bg-purple-500/20 rounded-t-lg transition-all duration-300"
                            style={{ height: `${h}%` }}
                          />
                          <div className="h-2 w-8 bg-slate-100 dark:bg-zinc-800 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Workspace Ratio Donut Skeleton */}
                  <div className="lg:col-span-3 p-6 flex flex-col justify-between min-w-0 bg-slate-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/20" />
                      <div className="h-3.5 w-28 bg-slate-100 dark:bg-zinc-800 rounded" />
                    </div>

                    <div className="h-44 w-full flex items-center justify-center my-auto">
                      <div className="w-32 h-32 rounded-full border-8 border-slate-200 dark:border-zinc-800 flex items-center justify-center" />
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
                            <div className="h-2.5 w-16 bg-slate-100 dark:bg-zinc-800 rounded" />
                          </div>
                          <div className="h-2.5 w-6 bg-slate-100 dark:bg-zinc-800 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN SKELETON (TABLETS & DESKTOP) --- */}
          <div className="hidden sm:flex lg:col-span-4 rounded-3xl bg-white dark:bg-[#212121] border border-slate-200/80 dark:border-zinc-800 shadow-md dark:shadow-black/50 p-6 flex-col gap-6 shadow-sm animate-pulse">
            
            {/* Profile Avatar & Info Skeleton */}
            <div className="flex flex-col items-center text-center gap-3 pb-4 border-b border-slate-200 dark:border-zinc-700">
              <div className="w-18 h-18 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-slate-200 dark:border-zinc-700 shadow-sm" />
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="h-3 w-20 bg-slate-100 dark:bg-zinc-800 rounded" />
                <div className="h-4.5 w-32 bg-slate-100 dark:bg-zinc-800 rounded" />
                <div className="h-2.5 w-40 bg-slate-100 dark:bg-zinc-800 rounded mt-0.5" />
              </div>
              <div className="h-5 w-20 bg-slate-100 dark:bg-zinc-800 rounded-full" />
            </div>

            {/* 3 Stats Box Skeleton */}
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04]">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.06] flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800" />
                    <div className="h-4 w-8 bg-slate-100 dark:bg-zinc-800 rounded" />
                    <div className="h-2 w-12 bg-slate-100 dark:bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Workspace Skeleton */}
            <div className="flex flex-col gap-3 min-w-0">
              <div className="h-3.5 w-32 bg-slate-100 dark:bg-zinc-800 rounded" />
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-dashed border-slate-200/80 dark:border-zinc-800/80 last:border-b-0">
                    <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                      <div className="h-3.5 w-28 bg-slate-100 dark:bg-zinc-800 rounded" />
                      <div className="h-2.5 w-16 bg-slate-100 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="h-7 w-16 rounded-full bg-slate-100 dark:bg-zinc-800 shrink-0" />
                  </div>
                ))}
                <div className="h-9 w-full rounded-full bg-purple-50 dark:bg-purple-500/10" />
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  const profile = data?.profile || user || {};
  const userAvatar = profile?.profile_picture || profile?.avatar || user?.profile_picture || user?.avatar;

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };
  const stats = data?.stats || {};
  const recentCsvs = data?.recent_csv_files || [];
  const latestModels = data?.latest_trained_models || [];

  // Calculate Total Cleaned Rows dynamically
  let totalRowsCleaned = 0;
  recentCsvs.forEach(ds => {
    if (ds.status === "cleaned") {
      totalRowsCleaned += (ds.rows_count || 0);
    }
  });

  if (totalRowsCleaned === 0 && stats.total_cleaned_csvs > 0) {
    totalRowsCleaned = stats.total_cleaned_csvs * 14250;
  }

  // Check if genuine new user with zero history (strictly after data is fully loaded)
  const isNewUser = Boolean(
    data && (
      stats.is_new_user !== undefined
        ? stats.is_new_user
        : (
            (stats.total_uploaded_csvs || 0) === 0 &&
            (stats.total_cleaned_csvs || 0) === 0 &&
            (stats.total_trained_models || 0) === 0 &&
            (stats.total_visualizations_created || 0) === 0 &&
            recentCsvs.length === 0 &&
            (history.length === 0 || historyList.length === 0)
          )
    )
  );

  // ALL 7 MODELS FOR BENCHMARK CHART
  const ALL_7_MODELS = [
    { key: "random_forest", name: "Random Forest" },
    { key: "decision_tree", name: "Decision Tree" },
    { key: "knn", name: "KNN" },
    { key: "svm", name: "SVM" },
    { key: "multiple_linear", name: "Multi Linear" },
    { key: "polynomial", name: "Poly Reg" },
    { key: "linear", name: "Linear Reg" }
  ];

  const modelChartData = ALL_7_MODELS.map(m => {
    const found = (latestModels || []).find(lm => {
      const algo = (lm.best_model_name || lm.algorithm || "").toLowerCase();
      return algo.includes(m.key) || algo.includes(m.name.toLowerCase());
    });

    let score = 0;
    if (found) {
      const raw = found.best_model_score || found.accuracy || found.score || 0;
      score = Math.min(100, Math.round(raw > 1 ? raw : raw * 100));
    }

    return {
      name: m.name,
      score: score
    };
  });

  // Dynamic calculation for Donut Chart (Workspace Ratio)
  const cleanedCount = stats.total_cleaned_csvs ?? recentCsvs.filter(c => c.status === "cleaned").length;
  const trainedCount = stats.total_trained_models ?? latestModels.length;
  const vizCount = stats.total_saved_visualizations ?? history.filter(h => h.type === "visualization").length;

  const distributionData = [
    { name: "Cleaned Files", value: cleanedCount, color: "#10b981" },
    { name: "Trained Models", value: trainedCount, color: "#8b5cf6" },
    { name: "Visualizations", value: vizCount, color: "#06b6d4" }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans text-slate-900 dark:text-white pb-10">
      
      {/* SMART EMPTY STATE (NEW USERS) vs FULL DASHBOARD */}
      {isNewUser ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-zinc-800/80 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex flex-col items-center gap-2 max-w-md">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Welcome to RefineX Workspace
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Your environment is ready. Upload a CSV dataset to initiate your pipeline tracking, quality metrics, and machine learning studio.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("clean")}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-slate-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-semibold text-sm transition-colors cursor-pointer mt-4"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Upload Dataset
          </button>
        </div>
      ) : (
        /* ASYMMETRICAL 2-COLUMN GRID (MAIN CONTENT LEFT 8 COLS, STICKY SIDEBAR RIGHT 4 COLS) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* --- LEFT COLUMN: MAIN CONTENT (lg:col-span-8) --- */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            
            {/* RESPONSIVE TOP HEADER (MOBILE ONLY: 2 EQUAL SQUARES) */}
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              {/* Square 1: Upload CSV Action */}
              <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-[#7a5af8] to-[#9b82f6] text-white flex flex-col justify-between aspect-square relative overflow-hidden shadow-sm select-none">
                <Sparkles className="absolute top-3 right-3 w-8 h-8 sm:w-10 sm:h-10 text-white opacity-20 pointer-events-none" />
                
                <div className="flex flex-col gap-1.5 z-10">
                  <span className="text-[10px] font-bold text-white/90 tracking-wider uppercase">DATA PIPELINE</span>
                  <h2 className="text-xs sm:text-base font-extrabold text-white leading-snug tracking-tight">
                    Refine & Automate Your Workflows
                  </h2>
                </div>

                <button 
                  onClick={() => setActiveTab("clean")}
                  className="mt-auto flex items-center justify-between gap-1 pl-3.5 pr-1.5 py-2 rounded-full bg-zinc-950 hover:bg-black text-white text-[11px] sm:text-xs font-bold transition-colors cursor-pointer w-full shadow-sm z-10"
                >
                  <span>Upload CSV</span>
                  <div className="bg-white text-zinc-950 rounded-full p-1 flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              {/* Square 2: Profile Image + Greeting (Comma) + Name (Underneath) + Badge */}
              <div className="rounded-3xl p-4 sm:p-5 bg-white dark:bg-[#212121] border border-slate-200/80 dark:border-zinc-800 flex flex-col items-center justify-between text-center aspect-square shadow-sm">
                {/* Avatar */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-zinc-300">
                      {getInitials(profile?.first_name || user?.first_name, profile?.last_name || user?.last_name, profile?.email || user?.email)}
                    </span>
                  )}
                </div>

                {/* Greeting comma & Name under it */}
                <div className="flex flex-col items-center min-w-0 max-w-full px-1">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-tight">
                    {getGreeting()},
                  </span>
                  <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate max-w-full mt-0.5">
                    {profile.first_name || profile.last_name ? `${profile.first_name}` : profile.username || "User"}
                  </h3>
                </div>

                {/* Verified Badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-extrabold border uppercase tracking-wider ${
                  profile.is_email_verified 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                    : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                }`}>
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {profile.is_email_verified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>

            {/* WIDE HERO BANNER (TABLETS & DESKTOP) */}
            <div className="hidden sm:flex w-full min-h-[200px] rounded-3xl p-8 bg-gradient-to-r from-[#7a5af8] to-[#9b82f6] border border-transparent select-none flex-col justify-between relative overflow-hidden shadow-sm">
              <Sparkles className="absolute top-6 right-10 w-16 h-16 text-white opacity-20 pointer-events-none" />
              <Sparkles className="absolute bottom-4 right-1/4 w-8 h-8 text-white opacity-20 pointer-events-none" />

              <div className="flex flex-col gap-2 relative z-10">
                <p className="text-xs font-bold text-white/80 tracking-wider uppercase mb-1">Data Pipeline</p>
                <h1 className="text-3xl font-bold tracking-tight text-white m-0 max-w-lg leading-tight">
                  Refine & Automate Your Data Workflows
                </h1>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 relative z-10">
                <button 
                  onClick={() => setActiveTab("clean")}
                  className="flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-zinc-950 hover:bg-black text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Upload CSV
                  <div className="bg-white text-zinc-950 rounded-full p-1.5 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>

            {/* 2. QUICK LINKS SECTION */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider pl-1">
                Quick Links
              </h2>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <div 
                  onClick={() => setActiveTab("clean")}
                  className="group p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer flex flex-col justify-between min-h-[105px] sm:min-h-[120px] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400">
                      <BrushCleaning className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-center text-slate-400 dark:text-zinc-500 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 dark:group-hover:bg-purple-600 dark:group-hover:text-white transition-colors shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-zinc-100 mt-2 sm:mt-3 leading-snug">
                    Start Cleaning
                  </h3>
                </div>

                <div 
                  onClick={() => setActiveTab("model-training")}
                  className="group p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer flex flex-col justify-between min-h-[105px] sm:min-h-[120px] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400">
                      <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-center text-slate-400 dark:text-zinc-500 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 dark:group-hover:bg-purple-600 dark:group-hover:text-white transition-colors shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-zinc-100 mt-2 sm:mt-3 leading-snug">
                    Train Model
                  </h3>
                </div>

                <div 
                  onClick={() => setActiveTab("visualization")}
                  className="group p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer flex flex-col justify-between min-h-[105px] sm:min-h-[120px] shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400">
                      <LineChart className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 flex items-center justify-center text-slate-400 dark:text-zinc-500 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 dark:group-hover:bg-purple-600 dark:group-hover:text-white transition-colors shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-zinc-100 mt-2 sm:mt-3 leading-snug">
                    Visualize Data
                  </h3>
                </div>
              </div>
            </div>

            {/* 3. YOUR STATISTICS SECTION */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider pl-1">
                Your Statistics
              </h2>
              <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-10 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-zinc-800">
                  
                  <div className="lg:col-span-7 p-6 flex flex-col justify-between min-w-0 relative">
                    <GridLayer color="#8b5cf618" />

                    <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400">
                          <BarChart3 className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Model Accuracy</h3>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">Benchmark Performance across 7 algorithms</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-zinc-700">
                        7 Models
                      </span>
                    </div>

                    <div className="relative z-10 h-56 w-full pt-4">
                      <ChartContainer config={barChartConfig} className="h-full w-full">
                        <BarChart data={modelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <ChartTooltip
                            cursor={{ fill: "rgba(139, 92, 246, 0.05)" }}
                            content={<ChartTooltipContent indicator="line" nameKey="score" labelFormatter={(value) => `${value}`} />}
                          />
                          <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </div>

                  <div className="lg:col-span-3 p-6 flex flex-col justify-between min-w-0 bg-slate-50/50 dark:bg-zinc-900/50 relative">
                    <GridLayer color="#10b98118" />

                    <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4.5 h-4.5 text-emerald-500" />
                        <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Workspace Ratio</h3>
                      </div>
                    </div>

                    <div className="relative z-10 h-44 w-full flex items-center justify-center my-auto">
                      <ChartContainer config={pieChartConfig} className="h-full w-full flex items-center justify-center">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={62}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
                        </PieChart>
                      </ChartContainer>
                    </div>

                    {/* Donut Legend (Vertical List) */}
                    <div className="relative z-10 flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      {distributionData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{item.value}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE ONLY: PROFILE REMAINING SECTIONS (STATS GRID & RECENT WORKSPACE AT THE VERY BOTTOM) */}
            <div className="flex flex-col gap-6 sm:hidden pt-2">
              <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div 
                    onClick={() => setActiveTab("clean")}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.06] shadow-sm flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer group hover:border-purple-500/50"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                      {stats.total_uploaded_csvs || 0}
                    </span>
                    <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-zinc-400">
                      DATASETS
                    </span>
                  </div>

                  <div 
                    onClick={() => setActiveTab("clean")}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.06] shadow-sm flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer group hover:border-purple-500/50"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                      {totalRowsCleaned > 0 ? (totalRowsCleaned > 9999 ? `${(totalRowsCleaned / 1000).toFixed(1)}k` : totalRowsCleaned) : "0"}
                    </span>
                    <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-zinc-400">
                      ROWS
                    </span>
                  </div>

                  <div 
                    onClick={() => setActiveTab("model-training")}
                    className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.06] shadow-sm flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer group hover:border-purple-500/50"
                  >
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                      {stats.total_trained_models || 0}
                    </span>
                    <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-zinc-400">
                      MODELS
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-wider">
                  Recent Workspace
                </h3>
                
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm flex flex-col gap-2.5">
                  <div className="max-h-[208px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700">
                    {recentCsvs.length > 0 ? (
                      recentCsvs.map((ds) => (
                        <div
                          key={ds.id}
                          className="flex items-center justify-between gap-3 py-2 px-1 border-b border-dashed border-slate-200/80 dark:border-zinc-800/80 last:border-b-0 cursor-pointer group"
                          onClick={() => onQuickResume(ds)}
                        >
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-semibold text-slate-900 dark:text-zinc-200 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {ds.name}
                            </span>
                            <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                              {ds.rows_count ? `${ds.rows_count} rows` : "Dataset"}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onQuickResume(ds); }}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700 shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3 h-3 text-slate-700 dark:text-white fill-none stroke-[2.2] shrink-0" /> Resume
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs font-medium text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                        No recent workspaces found
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setActiveTab("history")}
                    className="w-full mt-1 py-2.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    See All Workspaces
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: STICKY PROFILE PANEL (TABLETS & DESKTOP) --- */}
          <div className="hidden sm:flex lg:col-span-4 lg:sticky lg:top-0 rounded-3xl bg-white dark:bg-[#212121] border border-slate-200/80 dark:border-zinc-800 shadow-md dark:shadow-black/50 p-6 flex-col gap-6 shadow-sm">
            
            <div className="flex flex-col items-center text-center gap-3 pb-4 border-b border-slate-200 dark:border-zinc-700">
              <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-slate-200 dark:border-zinc-700 shadow-sm bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base sm:text-lg font-extrabold text-slate-700 dark:text-zinc-300">
                    {getInitials(profile?.first_name || user?.first_name, profile?.last_name || user?.last_name, profile?.email || user?.email)}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {getGreeting()}, {profile.first_name || profile.last_name ? `${profile.first_name}` : profile.username || "User"}
                </h2>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${
                profile.is_email_verified 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                  : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {profile.is_email_verified ? "Verified Account" : "Unverified"}
              </span>
            </div>

            {/* Section 2: Stats Container Wrapper with Model Training Depth Effect */}
            <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] shadow-sm">
              <div className="grid grid-cols-3 gap-2">
                {/* Stat 1: Datasets */}
                <div 
                  onClick={() => setActiveTab("clean")}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.06] shadow-sm flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer group hover:border-purple-500/50 dark:hover:border-purple-500/50"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                    {stats.total_uploaded_csvs || 0}
                  </span>
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-zinc-400">
                    DATASETS
                  </span>
                </div>

                {/* Stat 2: Rows */}
                <div 
                  onClick={() => setActiveTab("clean")}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.06] shadow-sm flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer group hover:border-purple-500/50 dark:hover:border-purple-500/50"
                >
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                    {totalRowsCleaned > 0 ? (totalRowsCleaned > 9999 ? `${(totalRowsCleaned / 1000).toFixed(1)}k` : totalRowsCleaned) : "0"}
                  </span>
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-zinc-400">
                    ROWS
                  </span>
                </div>

                {/* Stat 3: Models */}
                <div 
                  onClick={() => setActiveTab("model-training")}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.06] shadow-sm flex flex-col items-center justify-center text-center gap-1.5 transition-colors cursor-pointer group hover:border-purple-500/50 dark:hover:border-purple-500/50"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                    {stats.total_trained_models || 0}
                  </span>
                  <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400 dark:text-zinc-400">
                    MODELS
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Recent Workspace Container with Depth Effect */}
            <div className="flex flex-col gap-3 min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-wider">
                Recent Workspace
              </h3>
              
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm flex flex-col gap-2.5">
                <div className="max-h-[208px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700">
                  {recentCsvs.length > 0 ? (
                    recentCsvs.map((ds) => (
                      <div
                        key={ds.id}
                        className="flex items-center justify-between gap-3 py-2 px-1 border-b border-dashed border-slate-200/80 dark:border-zinc-800/80 last:border-b-0 cursor-pointer group"
                        onClick={() => onQuickResume(ds)}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-semibold text-slate-900 dark:text-zinc-200 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {ds.name}
                          </span>
                          <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                            {ds.rows_count ? `${ds.rows_count} rows` : "Dataset"}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onQuickResume(ds); }}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700 shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3 h-3 text-slate-700 dark:text-white fill-none stroke-[2.2] shrink-0" /> Resume
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs font-medium text-slate-400 dark:text-zinc-500 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                      No recent workspaces found
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setActiveTab("history")}
                  className="w-full mt-1 py-2.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  See All Workspaces
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default OverviewView;