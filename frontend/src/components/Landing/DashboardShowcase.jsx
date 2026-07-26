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
  Plus,
  ArrowRight,
  User,
  ShieldCheck,
  FolderOpen,
  ChevronRight,
  Sparkles
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
          <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans animate-fade-in text-slate-900 dark:text-white pb-10 overflow-visible">
            {/* ASYMMETRICAL 2-COLUMN GRID (MAIN CONTENT LEFT 8 COLS, STICKY SIDEBAR RIGHT 4 COLS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* --- LEFT COLUMN: MAIN CONTENT (lg:col-span-8) --- */}
              <div className="lg:col-span-8 space-y-6 min-w-0">
                
                {/* 1. HERO BANNER & QUICK ACTIONS */}
                <div className="flex flex-col gap-4">
                  {/* Purple Hero Card */}
                  <div 
                    onClick={() => setActiveTab("clean")}
                    className="group relative w-full min-h-[200px] rounded-3xl p-6 sm:p-8 bg-[#374151] dark:bg-[#1E1C27] border border-transparent dark:border-white/5 overflow-hidden cursor-pointer select-none flex flex-col justify-between shadow-sm"
                  >
                    <div className="flex flex-col gap-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white/95 leading-tight m-0 max-w-lg">
                        Refine & Automate Your Data Pipelines
                      </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mt-6">
                      <p className="text-xs text-slate-300 dark:text-white/60 max-w-md leading-relaxed m-0 font-normal">
                        Upload raw CSV files, clean missing values and outliers automatically, and train high-accuracy models in one click.
                      </p>
                      
                      <div className="flex items-center text-white/80 text-xs font-bold uppercase tracking-widest outline-none group-hover:text-white shrink-0 transition-colors">
                        <span>Upload CSV</span>
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>

                  {/* Secondary Action Cards (Notched Stepper Tracking Cards) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 group/action-cards p-1.5 z-20">
                    
                    {/* Step 1 Card: Start Cleaning */}
                    <div 
                      onClick={() => setActiveTab("clean")}
                      className="group/card relative flex flex-col justify-between p-5 min-h-[130px] rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-zinc-800 shadow-md cursor-pointer transition-all duration-300 hover:!scale-105 hover:z-30 hover:shadow-2xl dark:hover:shadow-purple-500/20 dark:hover:border-purple-500/50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20 shrink-0 group-hover/card:scale-110 transition-transform duration-300">
                          <Wand2 className="w-4.5 h-4.5" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5 pr-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            Step 1
                          </span>
                        </div>
                        <div className="w-[1.5px] h-3.5 bg-purple-500/30 dark:bg-purple-500/25 ml-[3px] my-0.5" />
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full border-2 border-purple-500 bg-white dark:bg-[#121212] shrink-0" />
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate group-hover/card:text-purple-600 dark:group-hover/card:text-purple-400 transition-colors">
                            Start Cleaning
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-0 right-0 w-10 h-10 bg-slate-50 dark:bg-[#09090b] rounded-bl-2xl flex items-center justify-center p-1 z-10 pointer-events-none">
                        <div className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-zinc-400 group-hover/card:bg-purple-600 group-hover/card:text-white group-hover/card:border-purple-600 group-hover/card:translate-x-0.5 transition-all duration-300">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Step 2 Card: Visualize Data */}
                    <div 
                      onClick={() => setActiveTab("visualization")}
                      className="group/card relative flex flex-col justify-between p-5 min-h-[130px] rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-zinc-800 shadow-md cursor-pointer transition-all duration-300 hover:!scale-105 hover:z-30 hover:shadow-2xl dark:hover:shadow-pink-500/20 dark:hover:border-pink-500/50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 border border-pink-500/20 shrink-0 group-hover/card:scale-110 transition-transform duration-300">
                          <LineChart className="w-4.5 h-4.5" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5 pr-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            Step 2
                          </span>
                        </div>
                        <div className="w-[1.5px] h-3.5 bg-pink-500/30 dark:bg-pink-500/25 ml-[3px] my-0.5" />
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full border-2 border-pink-500 bg-white dark:bg-[#121212] shrink-0" />
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate group-hover/card:text-pink-600 dark:group-hover/card:text-pink-400 transition-colors">
                            Visualize Data
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-0 right-0 w-10 h-10 bg-slate-50 dark:bg-[#09090b] rounded-bl-2xl flex items-center justify-center p-1 z-10 pointer-events-none">
                        <div className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-zinc-400 group-hover/card:bg-pink-600 group-hover/card:text-white group-hover/card:border-pink-600 group-hover/card:translate-x-0.5 transition-all duration-300">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Step 3 Card: Train Model */}
                    <div 
                      onClick={() => setActiveTab("model-training")}
                      className="group/card relative flex flex-col justify-between p-5 min-h-[130px] rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-zinc-800 shadow-md cursor-pointer transition-all duration-300 hover:!scale-105 hover:z-30 hover:shadow-2xl dark:hover:shadow-[#673ab7]/20 dark:hover:border-[#673ab7]/50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-2xl bg-[#673ab7]/10 text-[#673ab7] dark:bg-[#673ab7]/20 dark:text-[#a855f7] border border-[#673ab7]/20 shrink-0 group-hover/card:scale-110 transition-transform duration-300">
                          <BrainCircuit className="w-4.5 h-4.5" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5 pr-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#673ab7] shrink-0" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                            Step 3
                          </span>
                        </div>
                        <div className="w-[1.5px] h-3.5 bg-[#673ab7]/30 dark:bg-[#673ab7]/25 ml-[3px] my-0.5" />
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full border-2 border-[#673ab7] bg-white dark:bg-[#121212] shrink-0" />
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate group-hover/card:text-[#673ab7] dark:group-hover/card:text-[#a855f7] transition-colors">
                            Train Model
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-0 right-0 w-10 h-10 bg-slate-50 dark:bg-[#09090b] rounded-bl-2xl flex items-center justify-center p-1 z-10 pointer-events-none">
                        <div className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-zinc-400 group-hover/card:bg-[#673ab7] group-hover/card:text-white group-hover/card:border-[#673ab7] group-hover/card:translate-x-0.5 transition-all duration-300">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. TOP-LEVEL SUMMARY METRICS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      id: "datasets",
                      title: "Datasets Processed",
                      value: "14",
                      unit: "files",
                      badge: "+14 active",
                      badgeType: "positive",
                      icon: FileSpreadsheet,
                      borderColor: "border-emerald-500/30 dark:border-zinc-800",
                      iconColor: "text-emerald-500 dark:text-emerald-400",
                      accentBg: "bg-emerald-500/10 dark:bg-emerald-500/10",
                      onClick: () => setActiveTab("clean")
                    },
                    {
                      id: "rows",
                      title: "Total Rows Cleaned",
                      value: "199,500",
                      unit: "rows",
                      badge: "Cleaned",
                      badgeType: "positive",
                      icon: Sparkles,
                      borderColor: "border-purple-500/30 dark:border-zinc-800",
                      iconColor: "text-purple-500 dark:text-purple-400",
                      accentBg: "bg-purple-500/10 dark:bg-purple-500/10",
                      onClick: () => setActiveTab("clean")
                    },
                    {
                      id: "models",
                      title: "Active ML Models",
                      value: "7",
                      unit: "models ready",
                      badge: "Inference Ready",
                      badgeType: "positive",
                      icon: BrainCircuit,
                      borderColor: "border-amber-500/30 dark:border-zinc-800",
                      iconColor: "text-amber-500 dark:text-amber-400",
                      accentBg: "bg-amber-500/10 dark:bg-amber-500/10",
                      onClick: () => setActiveTab("model-training")
                    }
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.id}
                        onClick={card.onClick}
                        className={`relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#121212] border ${card.borderColor} shadow-sm transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 overflow-hidden min-w-0`}
                      >
                        <div className="relative z-10 flex items-center justify-between mb-3 min-w-0">
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 truncate">
                            {card.title}
                          </span>
                          <div className={`p-2 rounded-xl ${card.accentBg} ${card.iconColor} border ${card.borderColor} shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="relative z-10 flex items-baseline justify-between mt-1 min-w-0">
                          <div className="flex items-baseline gap-1 min-w-0">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                              {card.value}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 shrink-0">
                              {card.unit}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                            {card.badge}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* --- RIGHT COLUMN: PROFILE WIDGET & RECENT WORKSPACES (lg:col-span-4) --- */}
              <div className="lg:col-span-4 sticky top-6 space-y-0 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-zinc-800 shadow-md overflow-hidden flex flex-col min-w-0">
                
                {/* Profile Widget */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col items-center text-center gap-3 relative overflow-hidden bg-slate-50/40 dark:bg-zinc-900/30 shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-200 dark:border-zinc-700 shadow-sm bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-primary dark:text-purple-400" />
                  </div>

                  <div className="flex flex-col items-center">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      Welcome back, RefineX User 👋
                    </h2>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Account
                  </span>
                </div>

                {/* Recent Workspaces */}
                <div className="p-5 flex flex-col gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Recent Workspaces</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">3 Projects</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: "customer_churn_v2.csv", rows: "12,450 rows", date: "2m ago" },
                      { name: "sales_q3_cleaned.csv", rows: "45,210 rows", date: "1h ago" },
                      { name: "telecom_churn_dataset.csv", rows: "8,920 rows", date: "3h ago" },
                    ].map((ds, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveTab("clean")}
                        className="p-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-purple-500/60 dark:hover:border-purple-500/60 transition duration-200 cursor-pointer flex items-center justify-between gap-2.5 group overflow-hidden min-w-0 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 border border-purple-500/20">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {ds.name}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate">
                              {ds.rows} • {ds.date}
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveTab("clean"); }}
                          className="px-2.5 py-1 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 hover:bg-purple-600 dark:hover:bg-purple-600 text-purple-600 dark:text-purple-300 hover:text-white dark:hover:text-white group-hover:bg-purple-600 group-hover:text-white text-[10px] font-black transition-all duration-200 shrink-0 flex items-center gap-1 cursor-pointer border border-purple-500/20 dark:border-purple-500/30"
                        >
                          Resume <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    ))}
                  </div>
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
                  <BarChart3 className="w-6 h-6 text-[#673ab7] dark:text-[#a855f7]" /> Interactive Data Visualization
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
                    <div key={i} className="flex-1 bg-gradient-to-t from-primary to-purple-500 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h}%` }} />
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