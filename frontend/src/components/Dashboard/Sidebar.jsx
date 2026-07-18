import React, { useState, useEffect, useRef } from "react";
import logoImg from "../../assets/logo/refinex_logo.png";
import { 
  LayoutDashboard, 
  BrushCleaning,
  BrainCircuit,
  LineChart,
  History,
  Cog, 
  LogOut
} from "lucide-react";

// Inline helper to combine Tailwind classes cleanly
const cn = (...classes) => classes.filter(Boolean).join(" ");

const MENU_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "clean", label: "Clean", icon: BrushCleaning },
  { id: "model-training", label: "Model Training", icon: BrainCircuit },
  { id: "visualization", label: "Visualization", icon: LineChart },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Cog },
];

export function MenuToggleIcon({ open, className, fill = "none", stroke = "currentColor", strokeWidth = 2.2, strokeLinecap = "round", strokeLinejoin = "round", duration = 300, ...props }) {
  return (
    <svg
      strokeWidth={strokeWidth}
      fill={fill}
      stroke={stroke}
      viewBox="0 0 32 32"
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      shapeRendering="geometricPrecision"
      className={cn(
        "transition-transform ease-in-out transform-gpu",
        open && "-rotate-45",
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
      }}
      {...props}
    >
      <path
        className={cn(
          "transition-all ease-in-out",
          open
            ? "[stroke-dasharray:20_300] [stroke-dashoffset:-32.42px]"
            : "[stroke-dasharray:12_63]"
        )}
        style={{ transitionDuration: `${duration}ms` }}
        d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
      />
      <path d="M7 16 27 16" />
    </svg>
  );
}

function Sidebar({ activeTab, onTabChange, user, loading, handleLogout, loggingOut, isCollapsed, setIsCollapsed }) {
  // Sidebar Resizing Logic
  const MIN_WIDTH = 76;
  const MAX_WIDTH = 256;
  
  const sidebarRef = useRef(null);
  const [width, setWidth] = useState(isCollapsed ? MIN_WIDTH : MAX_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Sync width ONLY when toggled via button/double click, not after dragging
  useEffect(() => {
    if (!isResizing) {
      if (isCollapsed) {
        setWidth(MIN_WIDTH);
      } else if (width <= MIN_WIDTH + 20) {
        // Only force expand if the user clicks the toggle button while it's closed
        setWidth(MAX_WIDTH);
      }
    }
  }, [isCollapsed]); // Removed isResizing dependency so it doesn't snap on mouse up

  // Handle Dragging
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (!sidebarRef.current) return;
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      let newWidth = e.clientX - sidebarRect.left;

      // Restrict within bounds
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      
      setWidth(newWidth);
      
      // Auto toggle state based on threshold for fluid UI updates
      if (newWidth <= MIN_WIDTH + 20 && !isCollapsed) {
        setIsCollapsed(true);
      } else if (newWidth > MIN_WIDTH + 20 && isCollapsed) {
        setIsCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.classList.remove("select-none"); // Restore text selection
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, isCollapsed, setIsCollapsed]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = "ew-resize";
    document.body.classList.add("select-none"); // Prevent text highlighting while dragging
  };

  const handleDoubleClick = () => {
    const willCollapse = !isCollapsed;
    setIsCollapsed(willCollapse);
    setWidth(willCollapse ? MIN_WIDTH : MAX_WIDTH);
  };

  const getInitials = (firstName = "", lastName = "", email = "") => {
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return email ? email.charAt(0).toUpperCase() : "?";
  };

  return (
    <aside 
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      // Glassmorphism added: bg-opacity applied with backdrop-blur-xl
      className={cn(
        "shrink-0 flex flex-col justify-between h-screen border-r bg-[#fafafa]/80 dark:bg-[#0c0c0e]/80 backdrop-blur-2xl border-slate-200/60 dark:border-zinc-800/60 font-sans select-none relative z-40 overflow-visible",
        // Disable transition while dragging so it's perfectly fluid, enable when clicking
        isResizing ? "" : "transition-all duration-300 ease-out"
      )}
    >
      {/* INVISIBLE DRAG HANDLE - Sits on the right edge */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="absolute top-0 -right-1.5 w-3 h-full cursor-ew-resize z-50 flex items-center justify-center group"
      >
        <div className="w-1 h-12 rounded-full bg-slate-300/0 dark:bg-zinc-700/0 group-hover:bg-slate-400/50 dark:group-hover:bg-zinc-600/50 transition-colors duration-200" />
      </div>

      <div className="flex flex-col gap-6 pt-5 px-3 overflow-hidden">
        {/* Collapsible Header */}
        <div className="flex items-center justify-between min-h-10 px-1 relative">
          <div className={cn(
            "flex items-center gap-2.5 shrink-0 transition-all duration-300",
            isCollapsed ? "w-0 opacity-0 -translate-x-4" : "w-auto opacity-100 translate-x-0"
          )}>
            <img 
              src={logoImg} 
              alt="RefineX Logo" 
              className="w-9 h-9 object-cover rounded-xl shadow-sm shrink-0 transform-gpu"
              style={{ imageRendering: "auto" }}
            />
            <span className="font-display text-xl font-black tracking-wider inline-flex items-center text-black dark:text-white whitespace-nowrap">
              Refine<span className="font-sans text-[#673ab7] text-2xl ml-0.5 leading-none">X</span>
            </span>
          </div>

          <button
            onClick={handleDoubleClick} // Connects to the exact same double-click toggle logic
            className={cn(
              "p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-900/80 transition-all duration-150 ease-out cursor-pointer w-9 h-9 flex items-center justify-center shrink-0",
              isCollapsed ? "mx-auto" : ""
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <MenuToggleIcon 
              open={!isCollapsed} 
              className="w-5.5 h-5.5 text-slate-600 dark:text-zinc-400"
            />
          </button>
        </div>

        {/* Navigation Menu - Buttons cleverly merged for fluid resizing */}
        <nav className="flex flex-col gap-2 mt-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={cn(
                  "group relative flex items-center rounded-xl font-bold transition-all duration-200 ease-out cursor-pointer overflow-hidden transform-gpu",
                  isCollapsed ? "w-10 h-10 mx-auto justify-center" : "w-full px-3 py-2.5 gap-3 text-xs text-left",
                  isActive
                    ? "bg-slate-200/40 dark:bg-zinc-900/40 text-black dark:text-white border border-primary/50"
                    : "bg-transparent text-slate-600 dark:text-zinc-400 border border-transparent hover:border-primary/30 hover:text-black dark:hover:text-white hover:bg-slate-200/20 dark:hover:bg-zinc-900/20"
                )}
              >
                {/* Icon Wrapper */}
                <div className={cn(
                  "shrink-0 flex items-center justify-center transition-colors duration-150 ease-out",
                  !isCollapsed && "p-1.5 rounded-lg border",
                  !isCollapsed && isActive ? "border-primary bg-white/40 dark:bg-zinc-950/20 text-primary" : (!isCollapsed && "border-slate-200 dark:border-zinc-800")
                )}>
                  <Icon className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} strokeWidth={2.2} shapeRendering="geometricPrecision" />
                </div>

                {/* Text Label - Truncates (VS Code style) when sidebar is dragged smaller */}
                <span className={cn(
                  "truncate transition-opacity duration-200 min-w-0",
                  isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 flex-1"
                )}>
                  {item.label}
                </span>

                {item.id === "history" && !isCollapsed && (
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-auto shrink-0 transition-all duration-150",
                    isActive ? "bg-primary/20 text-primary dark:bg-white/20 dark:text-white" : "bg-primary/10 text-primary"
                  )}>
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-200/50 dark:border-zinc-800/50 bg-white/10 dark:bg-zinc-950/10">
        <div className={cn(
          "flex items-center justify-between p-1.5 rounded-xl transition-all duration-300",
          isCollapsed 
            ? "justify-center border-transparent bg-transparent" 
            : "bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-zinc-800/30"
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-slate-200 dark:bg-zinc-800 flex items-center justify-center border border-slate-300/40 dark:border-zinc-700/50">
              {loading ? (
                <div className="w-full h-full animate-pulse bg-slate-300 dark:bg-zinc-700" />
              ) : user?.profile_picture ? (
                <img src={user.profile_picture} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {user ? getInitials(user.first_name, user.last_name, user.email) : "?"}
                </span>
              )}
              {!loading && <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-900" />}
            </div>
            
            <div className={cn(
              "flex flex-col text-left min-w-0 transition-opacity duration-300",
              isCollapsed ? "w-0 opacity-0 hidden" : "flex-1 opacity-100"
            )}>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                {loading ? "Loading..." : (user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : "User")}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                {loading ? "..." : user?.email}
              </span>
            </div>
          </div>

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Log Out"
              className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition duration-150 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;