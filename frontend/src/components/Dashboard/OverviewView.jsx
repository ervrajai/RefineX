import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  Sparkles, 
  Download, 
  BrainCircuit, 
  BarChart3, 
  Activity, 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  User,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";

function OverviewView({ user, onQuickResume, setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("dashboard/stats/");
      setData(res.data);
    } catch (err) {
      console.error("Dashboard stats error:", err);
      setError("Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    return new Date(isoStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "—";
    return new Date(isoStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case "upload_csv":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case "clean_csv":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case "download_csv":
        return <Download className="w-4 h-4 text-blue-400" />;
      case "train_model":
        return <BrainCircuit className="w-4 h-4 text-amber-400" />;
      case "create_vis":
        return <BarChart3 className="w-4 h-4 text-cyan-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-3 text-slate-500 dark:text-zinc-400">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Calculating dashboard statistics...</span>
      </div>
    );
  }

  const profile = data?.profile || {};
  const stats = data?.stats || {};
  const recentCsvs = data?.recent_csv_files || [];
  const activities = data?.recent_activities || [];
  const latestModels = data?.latest_trained_models || [];
  const latestViz = data?.latest_visualizations || [];

  const statCards = [
    {
      id: "uploaded",
      title: "Uploaded CSVs",
      value: stats.total_uploaded_csvs || 0,
      icon: FileSpreadsheet,
      gradient: "from-emerald-500/20 to-teal-500/10",
      borderColor: "border-emerald-500/30",
      iconColor: "text-emerald-500 dark:text-emerald-400",
      targetTab: "clean",
    },
    {
      id: "cleaned",
      title: "Cleaned CSVs",
      value: stats.total_cleaned_csvs || 0,
      icon: Sparkles,
      gradient: "from-purple-500/20 to-indigo-500/10",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-500 dark:text-purple-400",
      targetTab: "clean",
    },
    {
      id: "downloaded",
      title: "Downloaded CSVs",
      value: stats.total_downloaded_csvs || 0,
      icon: Download,
      gradient: "from-blue-500/20 to-sky-500/10",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-500 dark:text-blue-400",
      targetTab: "clean",
    },
    {
      id: "models",
      title: "Trained Models",
      value: stats.total_trained_models || 0,
      icon: BrainCircuit,
      gradient: "from-amber-500/20 to-orange-500/10",
      borderColor: "border-amber-500/30",
      iconColor: "text-amber-500 dark:text-amber-400",
      targetTab: "model-training",
    },
    {
      id: "viz",
      title: "Visualizations",
      value: stats.total_visualizations_created || 0,
      icon: BarChart3,
      gradient: "from-cyan-500/20 to-blue-500/10",
      borderColor: "border-cyan-500/30",
      iconColor: "text-cyan-500 dark:text-cyan-400",
      targetTab: "visualization",
    },
    {
      id: "usage",
      title: "Total App Usage",
      value: stats.total_application_usage || 0,
      icon: Activity,
      gradient: "from-violet-500/20 to-fuchsia-500/10",
      borderColor: "border-violet-500/30",
      iconColor: "text-violet-500 dark:text-violet-400",
      targetTab: "history",
    },
    {
      id: "recent_acts",
      title: "Recent Activities (30d)",
      value: stats.recent_activity_count || 0,
      icon: Clock,
      gradient: "from-rose-500/20 to-pink-500/10",
      borderColor: "border-rose-500/30",
      iconColor: "text-rose-500 dark:text-rose-400",
      targetTab: "history",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto font-sans animate-fade-in text-slate-900 dark:text-white pb-10">
      
      {/* Top Banner: User Identity & Account Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4F2DB2] via-[#3B2588] to-[#1E1754] border border-black/20 dark:border-white/20 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-primary to-transparent" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/30 flex items-center justify-center overflow-hidden shrink-0 shadow-lg backdrop-blur">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-white/90" />
              )}
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate text-white">
                  {profile.first_name || profile.last_name 
                    ? `${profile.first_name} ${profile.last_name}` 
                    : profile.username || "User"}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur ${
                  profile.is_email_verified 
                    ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200" 
                    : "bg-amber-500/20 border-amber-400/50 text-amber-200"
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {profile.is_email_verified ? "Verified" : "Unverified"}
                </span>
              </div>

              <span className="text-sm font-medium text-white/80 truncate">
                {profile.email}
              </span>

              <div className="flex items-center gap-4 text-xs font-semibold text-white/60 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(profile.date_joined)}
                </span>
                <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[10px]">
                  {profile.auth_provider || "Email"} Account
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => setActiveTab("clean")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-sm font-extrabold shadow-md transition duration-200 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Clean CSV
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm font-bold backdrop-blur transition duration-200 cursor-pointer"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards Grid (7 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => setActiveTab(card.targetTab)}
              className={`relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} border ${card.borderColor} ${card.iconColor} transition-transform group-hover:scale-110 duration-200`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {card.value}
                </span>
                <span className="text-xs font-bold text-slate-400 group-hover:text-primary transition-colors flex items-center gap-0.5">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid: Top Datasets & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Top 5 Recently Worked CSV Files */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Top 5 Datasets Table Card */}
          <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Recently Worked Datasets
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Quickly resume cleaning or ML workflows on your recent CSV files.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("history")}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                View History <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentCsvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-dashed border-slate-200 dark:border-zinc-800 text-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                  No dataset files found. Upload your first CSV to get started!
                </span>
                <button
                  onClick={() => setActiveTab("clean")}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 transition cursor-pointer"
                >
                  Upload Dataset
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-2">Dataset Name</th>
                      <th className="pb-3 px-2">Dimensions</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2">Last Updated</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                    {recentCsvs.map((ds) => (
                      <tr key={ds.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors group">
                        <td className="py-3 px-2 font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                          {ds.name}
                        </td>
                        <td className="py-3 px-2 text-slate-500 dark:text-zinc-400">
                          {ds.rows_count ? `${ds.rows_count} r × ${ds.cols_count} c` : "—"}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                            ds.status === "cleaned" 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                              : "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                          }`}>
                            {ds.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400">
                          {formatDateTime(ds.updated_at)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => onQuickResume(ds)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary border border-primary/30 text-primary hover:text-white text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
                          >
                            <Play className="w-3 h-3 fill-current" /> Quick Resume
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Grid of Latest Models & Latest Visualizations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Latest Models Card */}
            <div className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Latest Models</h4>
                </div>
                <button onClick={() => setActiveTab("model-training")} className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                  Train ML
                </button>
              </div>

              {latestModels.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No trained models yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {latestModels.slice(0, 3).map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.dataset_name}</span>
                        <span className="text-[10px] text-slate-400">Best: {m.best_model_name}</span>
                      </div>
                      <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold shrink-0">
                        {m.best_model_score ? `${(m.best_model_score * 100).toFixed(1)}%` : m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Latest Visualizations Card */}
            <div className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Saved Charts</h4>
                </div>
                <button onClick={() => setActiveTab("visualization")} className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                  Create Chart
                </button>
              </div>

              {latestViz.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No saved graphs yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {latestViz.slice(0, 3).map((v) => (
                    <div key={v.id} className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{v.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{v.graph_type} ({v.library})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold shrink-0">
                        Saved
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Column (1 Col): Live Recent User Activity Timeline Stream */}
        <div className="flex flex-col p-6 rounded-2xl bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            </div>
            <button onClick={() => setActiveTab("history")} className="text-xs font-bold text-primary hover:underline cursor-pointer">
              All Activity
            </button>
          </div>

          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No activity records logged yet.</p>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
              {activities.map((act) => (
                <div key={act.id} className="relative flex flex-col gap-1">
                  <div className="absolute -left-6 top-0.5 p-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    {getActionIcon(act.action_type)}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {act.title}
                  </span>
                  {act.description && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                      {act.description}
                    </p>
                  )}
                  <span className="text-[10px] font-semibold text-slate-400">
                    {formatDateTime(act.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default OverviewView;
