import React, { useRef, useEffect } from "react";
import graphErrorImg from "../../assets/icons/graph_error.png";
import {
  Loader2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertCircle,
  BarChart3,
  Sparkles,
  Lightbulb,
} from "lucide-react";

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
  recommendation,
}) {
  const containerRef = useRef(null);

  // Auto scroll to view when loading finishes or chart loads
  useEffect(() => {
    if (!loading && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [loading, html, image]);

  // Loading State
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-purple-950/5 dark:bg-purple-950/20 border border-dashed border-purple-200 dark:border-purple-800/50 rounded-2xl p-8 transition-all duration-300">
        <div className="relative flex items-center justify-center mb-5">
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
          <Loader2 className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin relative z-10" />
        </div>
        <p className="text-sm font-semibold text-purple-950 dark:text-purple-200 tracking-wide">
          Generating visualization...
        </p>
        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1.5 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5" /> Applying smart data aggregations & sorting
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-rose-50/40 dark:bg-rose-950/10 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-8 text-center transition-all duration-300 max-w-2xl mx-auto my-auto">
        <div className="mb-4 flex items-center justify-center">
          <img
            src={graphErrorImg}
            alt="Graph Error"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain select-none"
          />
        </div>
        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-2">{error}</h3>
        {reason && (
          <p className="text-xs text-purple-900/60 dark:text-purple-300/60 mb-5 leading-relaxed max-w-md">
            {reason}
          </p>
        )}
        {recommendation && (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 rounded-xl text-xs text-purple-700 dark:text-purple-300 shadow-sm">
            <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span>
              <strong className="font-semibold">Recommended:</strong> Try a{" "}
              <span className="font-semibold underline decoration-purple-400 underline-offset-2">
                {recommendation}
              </span>{" "}
              instead.
            </span>
          </div>
        )}
      </div>
    );
  }

  // Empty State
  if (!html && !image) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-purple-50/30 dark:bg-purple-950/10 border border-dashed border-purple-200/80 dark:border-purple-900/40 rounded-2xl p-8 text-center transition-all duration-300">
        <div className="w-14 h-14 rounded-2xl bg-purple-100/70 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 shadow-sm border border-purple-200/50 dark:border-purple-800/30">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h4 className="text-sm font-semibold text-purple-950 dark:text-purple-100 mb-1.5">
          Canvas is Empty
        </h4>
        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 max-w-xs leading-relaxed font-normal">
          Select columns in the Layers panel or click a recommended chart from the gallery to begin.
        </p>
      </div>
    );
  }

  // Determine if Plotly interactive HTML or Matplotlib/Seaborn HTML image is provided
  const isInteractive = html && html.includes("plotly");
  const isHtmlImage = html && (html.includes("<img") || html.includes("<svg"));

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col bg-purple-50/20 dark:bg-purple-950/10 border border-purple-200/80 dark:border-purple-900/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${
        fullscreen ? "fixed inset-0 z-50 p-6 bg-white dark:bg-zinc-950 rounded-none border-none" : "relative"
      }`}
    >
      {/* Quick Controls Toolbar */}
      <div className="flex justify-end items-center px-4 py-2.5 border-b border-purple-200/60 dark:border-purple-900/40 bg-white/80 dark:bg-purple-950/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-1 bg-purple-100/50 dark:bg-purple-900/30 p-1 rounded-xl border border-purple-200/50 dark:border-purple-800/40">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold px-2 text-purple-900 dark:text-purple-200 min-w-[45px] text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-purple-200 dark:bg-purple-800/60 mx-1" />
          <button
            onClick={() => setZoom(1.0)}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Render Area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto relative">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            width: "100%",
            height: "100%",
            maxWidth: isInteractive ? "100%" : "850px",
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
              className="w-full h-full border-0 min-h-[400px] rounded-xl"
            />
          ) : isHtmlImage ? (
            <div
              dangerouslySetInnerHTML={{ __html: html }}
              className="w-full h-full flex items-center justify-center overflow-hidden"
            />
          ) : image ? (
            <img
              src={image}
              alt="Generated Chart"
              className="w-full h-auto max-h-full object-contain rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-md"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default GraphCanvas;