import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Sidebar from "../Dashboard/Sidebar";
import {
  LayoutDashboard,
  BrushCleaning,
  BrainCircuit,
  LineChart,
  History,
  Cog,
  X,
  Maximize2,
  Minimize2,
  Database,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  UploadCloud,
  Wand2,
  FileSpreadsheet,
  Award,
  Bell,
  HardDrive,
  Activity,
  BarChart3,
  Plus
} from "lucide-react";

export default function DashboardShowcase() {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Demo user data for realistic dashboard rendering
  const demoUser = {
    first_name: "RefineX",
    last_name: "User",
    email: "user@refinex.io",
    profile_picture: null
  };

  // Tracks scroll position for inline 3D rotation effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [25, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);

  // Lock document body scroll when fullscreen mode is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Exit fullscreen mode when pressing the Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Renders the exact RefineX workspace views matching the actual app
  const renderDashboardTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6 font-sans text-slate-800 dark:text-zinc-100 animate-fade-in pb-10">
            {/* Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
                  Welcome back, RefineX User 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                  Here is your dataset cleaning and machine learning studio performance overview.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab("clean")}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs shadow-md shadow-primary/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>New Cleaning Job</span>
              </button>
            </div>

            {/* 4 STATS METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Total Datasets Cleaned",
                  value: "14",
                  unit: "files",
                  badge: "+12% this week",
                  badgeType: "positive",
                  gradient: "from-blue-500/10 to-cyan-500/10",
                  borderColor: "border-blue-500/20",
                  iconColor: "text-blue-500",
                  icon: UploadCloud
                },
                {
                  title: "Cleaning Actions Ran",
                  value: "128",
                  unit: "transforms",
                  badge: "100% automated",
                  badgeType: "positive",
                  gradient: "from-purple-500/10 to-pink-500/10",
                  borderColor: "border-purple-500/20",
                  iconColor: "text-purple-500",
                  icon: Wand2
                },
                {
                  title: "ML Models Trained",
                  value: "7",
                  unit: "estimators",
                  badge: "7 Models Supported",
                  badgeType: "positive",
                  gradient: "from-amber-500/10 to-orange-500/10",
                  borderColor: "border-amber-500/20",
                  iconColor: "text-amber-500",
                  icon: BrainCircuit
                },
                {
                  title: "Workspace Storage",
                  value: "145.2 MB",
                  limit: "of 1 GB",
                  percent: 14.5,
                  gradient: "from-emerald-500/10 to-teal-500/10",
                  borderColor: "border-emerald-500/20",
                  iconColor: "text-emerald-500",
                  icon: HardDrive
                }
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="relative flex flex-col justify-between p-5 rounded-2xl bg-white/70 dark:bg-[#212121]/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-400 truncate">
                        {card.title}
                      </span>
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} border ${card.borderColor} ${card.iconColor} shrink-0`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                    </div>

                    {card.percent !== undefined ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {card.value}
                          </span>
                          <span className="text-xs font-bold text-slate-400">{card.limit}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${card.percent}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between mt-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {card.value}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">{card.unit}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          {card.badge}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* QUICK ACTIONS BUTTONS */}
            <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#212121]/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-3">
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Upload Dataset", icon: UploadCloud, color: "text-emerald-500", bg: "bg-emerald-500/10", tab: "clean" },
                  { label: "Start Cleaning", icon: Wand2, color: "text-purple-500", bg: "bg-purple-500/10", tab: "clean" },
                  { label: "Visualization", icon: LineChart, color: "text-cyan-500", bg: "bg-cyan-500/10", tab: "visualization" },
                  { label: "Train Model", icon: BrainCircuit, color: "text-amber-500", bg: "bg-amber-500/10", tab: "model-training" },
                ].map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveTab(action.tab)}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 hover:border-primary text-slate-900 dark:text-white flex flex-col items-center text-center gap-2.5 transition duration-200 cursor-pointer active:scale-95 group"
                    >
                      <div className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition duration-200 shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold truncate w-full">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MAIN WORKSPACE SPLIT (RECENT PIPELINES + 7 MODELS LEADERBOARD) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Pipeline Runs Table (2 Cols) */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white/70 dark:bg-[#212121]/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-primary" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Pipeline Executions</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    ● Live Audit
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "customer_churn_v2.csv", type: "KNN Imputation + Scaling", rows: "12,450", status: "Completed", score: "98.4%", time: "2m ago" },
                    { name: "sales_q3_clean.csv", type: "Outlier Trimming", rows: "45,210", status: "Completed", score: "96.1%", time: "1h ago" },
                    { name: "telecom_churn_dataset.csv", type: "AutoML Training", rows: "8,920", status: "Completed", score: "95.8%", time: "3h ago" },
                  ].map((job, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-primary/50 transition flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{job.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{job.type} • {job.rows} rows</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold text-emerald-500">{job.score}</span>
                        <span className="text-[10px] text-slate-400">{job.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported 7 Models Leaderboard (1 Col) */}
              <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#212121]/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Supported 7 Models</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">5-Fold CV</span>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {[
                    { name: "Random Forest Classifier", score: 98.4, type: "Classification", color: "bg-emerald-500" },
                    { name: "Decision Tree Classifier", score: 96.1, type: "Classification", color: "bg-primary" },
                    { name: "KNN Classifier", score: 95.8, type: "Classification", color: "bg-cyan-500" },
                    { name: "Support Vector Machine", score: 94.2, type: "Classification", color: "bg-indigo-500" },
                    { name: "Multiple Linear Regression", score: 92.5, type: "Regression", color: "bg-purple-500" },
                    { name: "Polynomial Regression", score: 91.0, type: "Regression", color: "bg-amber-500" },
                    { name: "Linear Regression", score: 89.2, type: "Regression", color: "bg-slate-400" },
                  ].map((m, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="truncate">{m.name}</span>
                        <span className="font-mono text-primary">{m.score}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                        <div className={`h-full ${m.color}`} style={{ width: `${m.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        );

      case "clean":
        return (
          <div className="space-y-6 font-sans text-slate-800 dark:text-zinc-100 animate-fade-in pb-10">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
                  <BrushCleaning className="w-6 h-6 text-primary" /> RefineX Data Cleaning Studio
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Automatic missing value imputation, outlier detection, and duplicate resolution console.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 self-start sm:self-auto">
                Dataset Quality: 94.2%
              </span>
            </div>

            {/* Active Dataset Container */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-white">customer_churn_v2.csv</h3>
                    <span className="text-[11px] text-slate-400">12,450 rows • 18 columns • 1.45 MB</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab("model-training")}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Send to ML Studio</span>
                </button>
              </div>

              {/* Data Table Preview */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-zinc-900 font-bold uppercase text-slate-600 dark:text-zinc-400">
                    <tr>
                      <th className="p-3">Customer_ID</th>
                      <th className="p-3">Age</th>
                      <th className="p-3">Tenure_Months</th>
                      <th className="p-3">Monthly_Charges</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {[
                      { id: "CUST-901", age: 34, tenure: 12, charges: "$65.40", status: "Cleaned" },
                      { id: "CUST-902", age: 45, tenure: 24, charges: "$89.90", status: "Cleaned" },
                      { id: "CUST-903", age: 29, tenure: 6, charges: "$45.10", status: "Imputed KNN" },
                      { id: "CUST-904", age: 52, tenure: 36, charges: "$110.20", status: "Cleaned" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                        <td className="p-3 font-mono font-bold text-primary">{row.id}</td>
                        <td className="p-3">{row.age}</td>
                        <td className="p-3">{row.tenure} mos</td>
                        <td className="p-3 font-mono">{row.charges}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "model-training":
        return (
          <div className="space-y-6 font-sans text-slate-800 dark:text-zinc-100 animate-fade-in pb-10">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-primary" /> Model Training Studio
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Train and evaluate the exact 7 scikit-learn estimators for classification & regression tasks.
                </p>
              </div>
              <button className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer">
                <Zap className="w-4 h-4" /> Start Training (7 Models)
              </button>
            </div>

            {/* EXACT 7 SUPPORTED MODELS DISPLAY GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Random Forest Classifier", accuracy: "98.4%", f1: "0.981", time: "1.42s", type: "Classification", status: "Champion Model", color: "border-emerald-500/40 bg-emerald-500/5" },
                { name: "Decision Tree Classifier", accuracy: "96.1%", f1: "0.958", time: "0.85s", type: "Classification", status: "Evaluated", color: "border-slate-200 dark:border-zinc-800" },
                { name: "KNN Classifier", accuracy: "95.8%", f1: "0.954", time: "0.98s", type: "Classification", status: "Evaluated", color: "border-slate-200 dark:border-zinc-800" },
                { name: "Support Vector Machine", accuracy: "94.2%", f1: "0.939", time: "1.85s", type: "Classification", status: "Evaluated", color: "border-slate-200 dark:border-zinc-800" },
                { name: "Multiple Linear Regression", accuracy: "92.5%", f1: "0.920", time: "0.65s", type: "Regression", status: "Evaluated", color: "border-slate-200 dark:border-zinc-800" },
                { name: "Polynomial Regression", accuracy: "91.0%", f1: "0.902", time: "1.15s", type: "Regression", status: "Evaluated", color: "border-slate-200 dark:border-zinc-800" },
                { name: "Linear Regression", accuracy: "89.2%", f1: "0.885", time: "0.45s", type: "Regression", status: "Baseline", color: "border-slate-200 dark:border-zinc-800" },
              ].map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl border bg-white dark:bg-[#212121] shadow-sm flex flex-col justify-between space-y-3 ${m.color}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-black dark:text-white leading-snug">{m.name}</h4>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{m.type}</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">{m.status}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5 text-center pt-1 border-t border-slate-100 dark:border-zinc-800">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900">
                      <span className="text-[8px] text-slate-400 block uppercase">Accuracy</span>
                      <span className="text-xs font-bold text-emerald-500">{m.accuracy}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900">
                      <span className="text-[8px] text-slate-400 block uppercase">F1-Score</span>
                      <span className="text-xs font-bold">{m.f1}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-900">
                      <span className="text-[8px] text-slate-400 block uppercase">Time</span>
                      <span className="text-xs font-bold font-mono">{m.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "visualization":
        return (
          <div className="space-y-6 font-sans text-slate-800 dark:text-zinc-100 animate-fade-in pb-10">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm flex justify-between items-center">
              <div>
                <h1 className="text-xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-cyan-500" /> Interactive Data Visualization
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Feature correlation heatmaps, distribution charts, and custom scatter projections.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm space-y-4">
              <div className="h-64 w-full rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800 p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400">Churn Rate vs Tenure Distribution</span>
                
                {/* Mock Chart Visual Bars */}
                <div className="flex items-end justify-between h-40 px-6 gap-3">
                  {[45, 78, 62, 94, 85, 60, 92, 70, 88].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-primary to-cyan-400 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h}%` }} />
                  ))}
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <span>0-6 mos</span>
                  <span>6-12 mos</span>
                  <span>12-24 mos</span>
                  <span>24-36 mos</span>
                  <span>36+ mos</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-6 font-sans text-slate-800 dark:text-zinc-100 animate-fade-in pb-10">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm flex justify-between items-center">
              <div>
                <h1 className="text-xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
                  <History className="w-6 h-6 text-primary" /> Execution Audit History
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Chronological records of all cleaning transformations, dataset exports, and model artifacts.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { title: "Random Forest Champion Model Saved", time: "2 hours ago", details: "Accuracy: 98.4% • PKL Artifact Created" },
                { title: "KNN Missing Imputation Completed", time: "4 hours ago", details: "customer_churn_v2.csv • 12,450 rows processed" },
                { title: "Dataset Export (Excel Format)", time: "1 day ago", details: "sales_q3_cleaned.xlsx • Downloaded" },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-black dark:text-white">{item.title}</h4>
                    <span className="text-[10px] text-slate-400">{item.details}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6 font-sans text-slate-800 dark:text-zinc-100 animate-fade-in pb-10">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm flex justify-between items-center">
              <div>
                <h1 className="text-xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
                  <Cog className="w-6 h-6 text-primary" /> Workspace Settings
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Manage user profile, API credentials, and default pipeline hyperparameters.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm space-y-4 max-w-xl">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1">User Name</label>
                <input type="text" value="RefineX Demo User" readOnly className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1">User Email</label>
                <input type="email" value="user@refinex.io" readOnly className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold outline-none" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper renderer for the complete workspace UI inside the window
  const renderDashboardLayout = () => {
    return (
      <div className="flex w-full h-full bg-[#F8FAFC] dark:bg-[#0F0F0F] text-slate-900 dark:text-white overflow-hidden font-sans select-none relative">
        {/* Real Sidebar Component */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={demoUser}
          loading={false}
          handleLogout={() => {}}
          loggingOut={false}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Floating Top Notification Bell */}
          <div className="absolute top-4 right-6 z-40">
            <button className="relative p-2 rounded-xl text-slate-500 dark:text-zinc-400 bg-[#FFFFFF]/80 dark:bg-[#212121]/80 border border-slate-200/50 dark:border-zinc-800 backdrop-blur shadow-sm hover:bg-[#F1F5F9] dark:hover:bg-[#272727] hover:text-slate-900 dark:hover:text-white transition duration-200 cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-white dark:ring-zinc-900" />
            </button>
          </div>

          {/* Dynamic Tab Workspace Container */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pt-16">
            {renderDashboardTabContent()}
          </main>
        </div>
      </div>
    );
  };

  return (
    <section id="dashboard" className="py-20 md:py-28 bg-white dark:bg-[#0F0F0F] w-full overflow-hidden">
      
      {/* Section Title Header */}
      <div className="text-center mb-10 md:mb-16 px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 tracking-tight">
          The RefineX Workspace
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Everything you need to clean data, train models, and visualize results. Click the green macOS button for interactive fullscreen sandbox mode.
        </p>
      </div>

      {/* Inline 3D Card Section */}
      <div 
        ref={containerRef} 
        className="w-full max-w-6xl mx-auto z-20 relative px-4 md:px-8 pb-20" 
        style={{ perspective: "1200px" }}
      >
        <motion.div
          style={{ rotateX, scale, transformOrigin: "top center" }}
          className="w-full rounded-xl border border-lightBorder/50 dark:border-brand/30 bg-[#FFFFFF]/50 dark:bg-[#000000]/50 backdrop-blur-sm p-1.5 md:p-2 shadow-2xl mx-auto"
        >
          {/* Inner macOS Window */}
          <motion.div 
            layoutId="dashboard-showcase-window"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-[#212121] rounded-lg aspect-[16/9] w-full flex flex-col border border-lightBorder dark:border-gray-800 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(103,58,183,0.15)] group"
          >
            
            {/* macOS Header bar */}
            <div className="w-full h-7 md:h-8 bg-gray-100 dark:bg-[#212121] flex items-center justify-between px-3 md:px-4 border-b border-lightBorder dark:border-gray-800 z-10 shrink-0 select-none">
              <div className="flex items-center gap-2">
                {/* Red button (Close/Exit) */}
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center group/btn cursor-pointer"
                  title="Close Window"
                >
                  <X className="w-2 h-2 text-rose-950 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>

                {/* Yellow button (Minimize) */}
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center group/btn cursor-pointer"
                  title="Minimize Window"
                >
                  <Minimize2 className="w-2 h-2 text-amber-950 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>

                {/* Green button (Expand / Clickable Fullscreen trigger) */}
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-all transform hover:scale-125 flex items-center justify-center group/btn cursor-pointer ring-2 ring-emerald-500/30"
                  title="Click to Enter Fullscreen Sandbox Mode"
                >
                  <Maximize2 className="w-2 h-2 text-emerald-950 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>

                <span className="text-[10px] md:text-xs text-gray-400 font-mono ml-2">app.refinex.io/workspace</span>
              </div>

              {/* Click to expand prompt badge */}
              <button
                onClick={() => setIsFullscreen(true)}
                className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 transition-all cursor-pointer"
              >
                <span>Interactive Sandbox</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Inner Dashboard Layout Component */}
            <div className="w-full flex-1 relative overflow-hidden">
              {renderDashboardLayout()}
            </div>

          </motion.div>
        </motion.div>
      </div>

      {/* FULLSCREEN OVERLAY SANDBOX MODE */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl p-2 sm:p-4 md:p-6 flex flex-col justify-center items-center overflow-hidden"
          >
            <motion.div
              layoutId="dashboard-showcase-window"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full h-full max-w-7xl max-h-[94vh] rounded-2xl border border-lightBorder/60 dark:border-brand/40 bg-white dark:bg-[#0F0F0F] shadow-2xl flex flex-col overflow-hidden relative"
            >
              {/* Fullscreen macOS Header bar */}
              <div className="w-full h-8 md:h-10 bg-gray-100 dark:bg-[#212121] flex items-center justify-between px-4 border-b border-lightBorder dark:border-gray-800 z-10 shrink-0 select-none">
                <div className="flex items-center gap-2">
                  {/* Red button -> Exit Fullscreen */}
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center group/btn cursor-pointer ring-2 ring-rose-500/30"
                    title="Exit Fullscreen (Red Button)"
                  >
                    <X className="w-2.5 h-2.5 text-rose-950 opacity-90 group-hover/btn:opacity-100 transition-opacity" />
                  </button>

                  {/* Yellow button -> Minimize */}
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="w-3.5 h-3.5 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center group/btn cursor-pointer"
                    title="Minimize Sandbox"
                  >
                    <Minimize2 className="w-2.5 h-2.5 text-amber-950 opacity-90 group-hover/btn:opacity-100 transition-opacity" />
                  </button>

                  {/* Green button -> Exit / Toggle Fullscreen */}
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center group/btn cursor-pointer"
                    title="Exit Fullscreen"
                  >
                    <Maximize2 className="w-2.5 h-2.5 text-emerald-950 opacity-90 group-hover/btn:opacity-100 transition-opacity" />
                  </button>

                  <span className="text-xs text-gray-400 font-mono ml-2">app.refinex.io/sandbox-fullscreen</span>
                </div>

                {/* Close Button Header Action */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 hidden sm:inline">
                    Press <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-sans border border-gray-300 dark:border-zinc-700">ESC</kbd> to exit
                  </span>
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Exit Sandbox</span>
                  </button>
                </div>
              </div>

              {/* Fullscreen Interactive Content */}
              <div className="w-full flex-1 relative overflow-hidden">
                {renderDashboardLayout()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}