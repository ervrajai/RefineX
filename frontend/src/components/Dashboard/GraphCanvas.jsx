import React, { useRef, useEffect } from "react";
import { Loader2, Maximize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

function GraphCanvas({
  html,
  image,
  loading,
  zoom,
  setZoom,
  fullscreen,
  setFullscreen,
  error,
  reason,
  recommendation
}) {
  const containerRef = useRef(null);

  // Auto scroll to view when loading finishes or chart loads
  useEffect(() => {
    if (!loading && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [loading, html, image]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] bg-slate-50 dark:bg-zinc-900/40 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-6 transition-all duration-300">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">Generating visualization...</p>
        <p className="text-xs text-slate-400 dark:text-zinc-550 mt-1">Applying smart data aggregations & sorting</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl p-8 text-center transition-all duration-300 max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg font-bold mb-4">
          ⚠️
        </div>
        <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-2">{error}</h3>
        {reason && <p className="text-xs text-slate-500 dark:text-zinc-450 mb-4 max-w-md">{reason}</p>}
        {recommendation && (
          <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400">
            <span className="font-bold">Recommended:</span> Try a <span className="font-bold underline">{recommendation}</span> instead.
          </div>
        )}
      </div>
    );
  }

  if (!html && !image) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] bg-slate-50 dark:bg-zinc-900/30 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-6 text-center text-slate-400 dark:text-zinc-550 transition-all duration-300">
        <span className="text-4xl mb-3">📊</span>
        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Canvas is Empty</h4>
        <p className="text-2xs max-w-xs leading-normal">
          Select columns in the Layers panel or click a recommended chart from the gallery to begin.
        </p>
      </div>
    );
  }

  // Determine if Plotly interactive HTML is provided
  // Note: generate_graph returns raw interactive html (which has script tags)
  const isInteractive = html && html.includes("plotly");

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col bg-slate-100/50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300 ${
        fullscreen ? "fixed inset-0 z-50 p-6 bg-white dark:bg-zinc-950" : "relative"
      }`}
    >
      {/* Quick controls bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200/60 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-2xs text-slate-500 dark:text-zinc-400 font-medium">
            {isInteractive ? "Interactive Plotly Preview" : "Static Output"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-2xs font-semibold px-1 text-slate-600 dark:text-zinc-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer ml-1"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer ml-1"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Render Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.15s ease-out",
            width: "100%",
            height: "100%",
            maxWidth: isInteractive ? "100%" : "800px",
            maxHeight: isInteractive ? "100%" : "600px",
          }}
          className="flex items-center justify-center"
        >
          {isInteractive ? (
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8" />
                    <style>
                      body, html {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        background: transparent;
                      }
                      .plotly-graph-div {
                        margin: 0 auto;
                      }
                    </style>
                  </head>
                  <body>
                    ${html}
                  </body>
                </html>
              `}
              title="Interactive Visualization"
              sandbox="allow-scripts"
              className="w-full h-full border-0 min-h-[400px]"
            />
          ) : (
            <img
              src={image || `data:image/svg+xml;base64,${btoa(html)}`}
              alt="Generated Chart"
              className="w-full h-auto max-h-full object-contain rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default GraphCanvas;
