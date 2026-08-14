import React, { useState } from "react";
import { History, FileSpreadsheet, ChevronRight, RotateCw, Loader2 } from "lucide-react";

export default function RecentDatasetPanel({
  items = [],
  onSelect,
  onViewAll,
  onRefresh,
  refreshing = false,
  loadingId = null,
}) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = (e) => {
    e.stopPropagation();
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 600);
    if (onRefresh) {
      onRefresh();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? "Recently"
        : d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="w-full p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-md dark:shadow-black/40 flex flex-col justify-between h-[380px] min-h-[380px] max-h-[380px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80 mb-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <History className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600 dark:text-purple-400 shrink-0" />
          <h3 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
            Recent Dataset
          </h3>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh recent datasets"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:border-purple-200 dark:hover:border-purple-800/60 border border-slate-200/80 dark:border-zinc-700/60 shadow-2xs transition-all duration-200 cursor-pointer active:scale-90 disabled:opacity-50"
          >
            <RotateCw
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 ease-in-out ${
                isSpinning || refreshing ? "animate-spin text-purple-600 dark:text-purple-400" : ""
              }`}
            />
          </button>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-[11px] lg:text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              View All →
            </button>
          )}
        </div>
      </div>

      {/* Dataset List - Fixed height locked at max-h-[295px] matching 380px outer box */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[295px] pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700">
        {items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
            No recent datasets found
          </div>
        ) : (
          items.map((item, idx) => {
            const itemId = item.dataset_id || item.id;
            const isLoading = loadingId && (String(loadingId) === String(itemId) || String(loadingId) === String(item.id));
            let rawName = item.dataset_name || item.name || "Untitled Dataset";
            // Strip any version suffix or cleaned tags so original dataset name is always cleanly shown
            const name = rawName
              .replace(/(_cleaned|_cleaned_v\d+)(\.[a-zA-Z0-9]+)?$/i, "$2")
              .replace(/^(cleaned_)/i, "");
            const dt = item.created_at || item.cleaned_at || item.updated_at;
            const rows = item.before_stats?.rows || item.rows;

            return (
              <div
                key={item.id || idx}
                onClick={() => !isLoading && onSelect && onSelect(item)}
                className={`relative group p-2.5 sm:p-3 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 hover:bg-slate-900 dark:hover:bg-white hover:border-slate-900 dark:hover:border-white transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-between shadow-2xs overflow-hidden ${
                  isLoading ? "opacity-80 pointer-events-none" : ""
                }`}
              >
                {/* Left content: Icon + Info */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 group-hover:bg-white/20 dark:group-hover:bg-slate-900/10 group-hover:text-white dark:group-hover:text-slate-900 shrink-0 transition-colors duration-300">
                    <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-white dark:group-hover:text-slate-900 truncate transition-colors duration-300">
                      {name}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 group-hover:text-slate-300 dark:group-hover:text-slate-600 block truncate mt-0.5 transition-colors duration-300">
                      {formatDate(dt)} {rows ? `• ${rows.toLocaleString()} rows` : ""}
                    </span>
                  </div>
                </div>

                {/* Right Arrow indicator or Inline Loading Spinner */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-zinc-500 group-hover:text-white dark:group-hover:text-slate-900 group-hover:translate-x-1 transition-all duration-300" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
