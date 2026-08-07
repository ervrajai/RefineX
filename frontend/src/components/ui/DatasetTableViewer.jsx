import React from "react";
import { Table, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatedSelect } from "./AnimatedSelect";

export default function DatasetTableViewer({
  preview,
  metadata,
  searchQuery,
  setSearchQuery,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  handleTableScroll,
  handleSort,
  paginatedRows = [],
  processedRows = [],
  totalPages = 1,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#212121] shadow-sm overflow-hidden flex flex-col">
      {/* Header bar: Title stats + Search + Rows per page */}
      <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-zinc-950/20">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Table className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
            Interactive Preview{" "}
            <span className="font-semibold text-slate-400 dark:text-zinc-500">
              (Loaded {preview?.rows?.length || 0} of {metadata?.rows || 0} rows)
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search preview rows..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:border-purple-600 transition duration-150 text-slate-900 dark:text-white"
            />
          </div>

          <AnimatedSelect
            value={rowsPerPage}
            onChange={(val) => {
              setRowsPerPage(Number(val));
              setCurrentPage(1);
            }}
            options={[
              { value: 10, label: "10 rows" },
              { value: 25, label: "25 rows" },
              { value: 50, label: "50 rows" },
              { value: 100, label: "100 rows" },
            ]}
            className="w-28"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto max-h-[450px] overflow-y-auto" onScroll={handleTableScroll}>
        <table className="w-full text-[11px] border-collapse relative">
          <thead className="sticky top-0 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-bold uppercase tracking-wider z-20 shadow-sm">
            <tr>
              {preview?.columns?.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort && handleSort(col)}
                  className="px-4 py-3 text-left font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    {col}
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors duration-150 odd:bg-transparent even:bg-slate-50/30 dark:even:bg-zinc-900/10"
                >
                  {preview?.columns?.map((col) => (
                    <td key={col} className="px-4 py-2.5 truncate max-w-[200px] font-medium text-slate-650 dark:text-zinc-300">
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-rose-600 dark:text-rose-500 font-bold">null</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={preview?.columns?.length || 1} className="text-center py-12 px-4">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                    <div className="p-3 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-inner">
                      <Search className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                        {searchQuery ? `No records found matching "${searchQuery}"` : "No table records available"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {searchQuery
                          ? "We couldn't find any rows matching your search query. Try typing a different keyword or column value."
                          : "This dataset preview does not contain any data rows to display."}
                      </p>
                    </div>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setCurrentPage(1);
                        }}
                        className="mt-1 px-4 py-1.5 text-xs font-bold rounded-full bg-purple-600 hover:bg-purple-500 text-white transition duration-150 shadow-xs cursor-pointer active:scale-95"
                      >
                        Clear Search Filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4 text-xs font-semibold bg-slate-50/30 dark:bg-zinc-950/10">
        <span className="text-slate-500 dark:text-zinc-400">
          Showing {Math.min(processedRows.length, (currentPage - 1) * rowsPerPage + 1)} - {Math.min(processedRows.length, currentPage * rowsPerPage)} of {processedRows.length} preview rows
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition duration-150 flex items-center justify-center shadow-xs mx-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="mx-2 text-sm text-slate-600 dark:text-zinc-400">
            Page{" "}
            <input
              type="number"
              min={1}
              max={totalPages || 1}
              value={currentPage}
              onChange={(e) => {
                const val = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                setCurrentPage(val);
              }}
              className="w-12 text-center py-1 border border-slate-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 focus:outline-none text-slate-900 dark:text-white mx-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
            />{" "}
            of {totalPages || 1}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition duration-150 flex items-center justify-center shadow-xs mx-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
