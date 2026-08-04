import React from "react";
import { History, FileSpreadsheet, ChevronRight } from "lucide-react";

export default function RecentDatasetPanel({
  items = [],
  onSelect,
  onViewAll,
  loadingId = null,
}) {
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
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600 dark:text-purple-400 shrink-0" />
          <h3 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Recent Dataset
          </h3>
        </div>
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

      {/* Dataset List - Fixed height locked at max-h-[295px] matching 380px outer box */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[295px] pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700">
        {items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
            No recent datasets found
          </div>
        ) : (
          items.map((item, idx) => {
            const name = item.dataset_name || item.name || "Untitled Dataset";
            const dt = item.created_at || item.cleaned_at || item.updated_at;
            const rows = item.before_stats?.rows || item.rows;

            return (
              <div
                key={item.id || idx}
                onClick={() => onSelect && onSelect(item)}
                className="relative group p-2.5 sm:p-3 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 hover:bg-slate-900 dark:hover:bg-white hover:border-slate-900 dark:hover:border-white transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-between shadow-2xs overflow-hidden"
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

                {/* Right Arrow indicator */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-zinc-500 group-hover:text-white dark:group-hover:text-slate-900 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
