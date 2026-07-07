import React from "react";
import logoImg from "../../assets/logo/refinex_logo.png";
import { 
  LayoutDashboard, 
  Sparkles,
  BrainCircuit,
  LineChart,
  History,
  Settings, 
  LogOut
} from "lucide-react";

// Inline helper to combine Tailwind classes cleanly
const cn = (...classes) => classes.filter(Boolean).join(" ");

const MENU_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "clean", label: "Clean", icon: Sparkles },
  { id: "model-training", label: "Model Training", icon: BrainCircuit },
  { id: "visualization", label: "Visualization", icon: LineChart },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

// Animated SVG Hamburger Toggle Icon Component - Pixel Aligned
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
        style={{
          transitionDuration: `${duration}ms`,
        }}
        d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
      />
      <path d="M7 16 27 16" />
    </svg>
  );
}

function Sidebar({ activeTab, onTabChange, user, loading, handleLogout, loggingOut, isCollapsed, setIsCollapsed }) {
  const getInitials = (firstName = "", lastName = "", email = "") => {
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <aside 
      className={`shrink-0 flex flex-col justify-between h-screen border-r bg-[#fafafa] dark:bg-[#0c0c0e] border-slate-200 dark:border-zinc-800 transition-all duration-300 ease-in-out font-sans select-none relative ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col gap-6 pt-5 px-3">
        {/* Collapsible Header (Logo + Custom Animated Menu Icon) */}
        <div className="flex items-center justify-between min-h-10 px-1 relative">
          
          {/* Logo & Brand title matched to landing page */}
          <div className={`flex items-center gap-2.5 shrink-0 transition-all duration-300 overflow-hidden ${
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}>
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

          {/* Animated Menu Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-2 rounded-xl text-slate-550 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-900/80 transition-all duration-150 ease-out cursor-pointer w-9 h-9 flex items-center justify-center shrink-0",
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

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2 mt-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            // Collapsed state: Render a simple centered square icon button with snappy active/hover styles
            if (isCollapsed) {
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 ease-out cursor-pointer border mx-auto transform-gpu",
                    isActive
                      ? "border-primary bg-slate-200/40 dark:bg-zinc-900/40 text-black dark:text-white"
                      : "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 hover:border-primary/60 hover:text-black dark:hover:text-white hover:bg-slate-200/20 dark:hover:bg-zinc-900/20"
                  )}
                >
                  <Icon 
                    className="w-5 h-5 shrink-0" 
                    strokeWidth={2.2} 
                    shapeRendering="geometricPrecision" 
                  />
                </button>
              );
            }

            // Expanded state: Render smooth snappy hover buttons with high-contrast text and icons
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 ease-out cursor-pointer text-left w-full overflow-hidden bg-transparent border transform-gpu",
                  isActive
                    ? "text-black dark:text-white border-primary/80 bg-slate-200/20 dark:bg-zinc-900/20"
                    : "text-slate-600 dark:text-zinc-400 border-transparent hover:border-primary/50 hover:text-black dark:hover:text-white hover:bg-slate-200/10 dark:hover:bg-zinc-900/10"
                )}
              >
                {/* Icon border container */}
                <div className={cn(
                  "p-1.5 rounded-lg border transition-colors duration-150 ease-out",
                  isActive 
                    ? "border-primary text-black dark:text-white bg-white/40 dark:bg-zinc-950/20" 
                    : "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-400 group-hover:border-primary/60 group-hover:text-black dark:group-hover:text-white"
                )}>
                  <Icon 
                    className="w-4 h-4 shrink-0" 
                    strokeWidth={2.2} 
                    shapeRendering="geometricPrecision" 
                  />
                </div>

                <span className="transition-all duration-150 ease-out whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>

                {/* Live indicators on History */}
                {item.id === "history" && (
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-auto shrink-0 transition-all duration-150 ease-out",
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

      {/* Collapsible User Profile Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/20">
        <div className={cn(
          "flex items-center justify-between p-1.5 rounded-xl transition-all duration-300",
          isCollapsed 
            ? "justify-center border-transparent bg-transparent" 
            : "bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/40 dark:border-zinc-800/30"
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar container */}
            <div className="relative shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-slate-200 dark:bg-zinc-850 flex items-center justify-center border border-slate-300/40 dark:border-zinc-700/50">
              {loading ? (
                <div className="w-full h-full animate-pulse bg-slate-300 dark:bg-zinc-750" />
              ) : user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {user ? getInitials(user.first_name, user.last_name, user.email) : "?"}
                </span>
              )}
              {!loading && <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-900" />}
            </div>
            
            {/* Expanded Text details */}
            <div className={`flex flex-col text-left min-w-0 transition-all duration-300 ${
              isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
            }`}>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                {loading ? "Loading..." : (user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : "User")}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-550 truncate">
                {loading ? "..." : user?.email}
              </span>
            </div>
          </div>

          {/* Hide logout button if collapsed */}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Log Out"
              className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-555 hover:text-rose-500 hover:bg-rose-500/10 transition duration-150 cursor-pointer disabled:opacity-50"
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
