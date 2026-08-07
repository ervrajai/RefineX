import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import logoImg from "../../assets/logo/refinex_logo.png";
import { 
  LayoutDashboard, 
  BrushCleaning,
  BrainCircuit,
  LineChart,
  History,
  Cog, 
  LogOut,
  Sun,
  Moon
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

// Specific mapping for shorter mobile labels
const MOBILE_LABELS = {
  "overview": "Home",
  "clean": "Clean",
  "model-training": "Train",
  "visualization": "Graph",
  "history": "History",
  "settings": "Settings"
};

function Sidebar({ activeTab, onTabChange, user, loading, handleLogout, loggingOut, isCollapsed, setIsCollapsed }) {
  // Dark/Light Theme state and toggle logic
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    const syncTheme = () => {
      const stored = localStorage.getItem("theme") || (document.documentElement.classList.contains("dark") ? "dark" : "light");
      setThemeState(stored);
    };
    window.addEventListener("themeChange", syncTheme);
    return () => window.removeEventListener("themeChange", syncTheme);
  }, []);

  const isDarkMode = theme === "dark" || (theme === "auto" && document.documentElement.classList.contains("dark"));

  const toggleTheme = (newTheme) => {
    let mode = newTheme;
    if (!mode) {
      mode = isDarkMode ? "light" : "dark";
    }
    const targetMode = mode === "dark" ? "dark" : "light";
    localStorage.setItem("theme", targetMode);
    setThemeState(targetMode);

    if (targetMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("themeChange"));
  };

  // Sidebar Resizing Logic
  const MIN_WIDTH = 90;
  const MAX_WIDTH = 280;
  
  const sidebarRef = useRef(null);
  const [width, setWidth] = useState(isCollapsed ? MIN_WIDTH : MAX_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Sync width ONLY when toggled via button/double click, not after dragging
  useEffect(() => {
    if (!isResizing) {
      if (isCollapsed) {
        setWidth(MIN_WIDTH);
      } else if (width <= MIN_WIDTH + 20) {
        setWidth(MAX_WIDTH);
      }
    }
  }, [isCollapsed, isResizing, width]); 

  // Handle Dragging Desktop Sidebar
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (!sidebarRef.current) return;
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      let newWidth = e.clientX - sidebarRect.left;

      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      
      setWidth(newWidth);
      
      if (newWidth <= MIN_WIDTH + 20 && !isCollapsed) {
        setIsCollapsed(true);
      } else if (newWidth > MIN_WIDTH + 20 && isCollapsed) {
        setIsCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.classList.remove("select-none"); 
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
    document.body.classList.add("select-none"); 
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

  // --- MOBILE NAV SCROLL HIDE/SHOW LOGIC ---
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      if (!target || target.id !== "main-scroll-container") return;

      const currentScrollY = target.scrollTop;

      if (currentScrollY < 0) {
        setIsNavVisible(true);
        return;
      }
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setIsNavVisible(false); 
      } else {
        setIsNavVisible(true); 
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  // --- MOBILE NAV DRAG & SNAP LOGIC ---
  const mobileNavRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const [dragX, setDragX] = useState(null);
  const [isDraggingMenu, setIsDraggingMenu] = useState(false);
  
  const activeIndex = Math.max(0, MENU_ITEMS.findIndex(item => item.id === activeTab));

  const handlePointerDown = (e) => {
    if (!mobileNavRef.current) return;
    hasDraggedRef.current = false;
    
    const rect = mobileNavRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const itemWidth = rect.width / MENU_ITEMS.length;
    
    const clickedIndex = Math.floor(x / itemWidth);
    if (clickedIndex === activeIndex) {
      setIsDraggingMenu(true);
      mobileNavRef.current.setPointerCapture(e.pointerId);
      
      let startDragX = x - (itemWidth / 2);
      if (startDragX < 0) startDragX = 0;
      if (startDragX > rect.width - itemWidth) startDragX = rect.width - itemWidth;
      setDragX(startDragX);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingMenu || !mobileNavRef.current) return;
    hasDraggedRef.current = true; 
    
    const rect = mobileNavRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const itemWidth = rect.width / MENU_ITEMS.length;
    
    let boundedX = x - itemWidth / 2;
    if (boundedX < 0) boundedX = 0;
    if (boundedX > rect.width - itemWidth) boundedX = rect.width - itemWidth;
    
    setDragX(boundedX);
  };

  const handlePointerUp = (e) => {
    if (!isDraggingMenu || !mobileNavRef.current) return;
    setIsDraggingMenu(false);
    
    const rect = mobileNavRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const itemWidth = rect.width / MENU_ITEMS.length;
    
    let newIndex = Math.floor(x / itemWidth);
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= MENU_ITEMS.length) newIndex = MENU_ITEMS.length - 1;
    
    if (newIndex !== activeIndex) {
      onTabChange(MENU_ITEMS[newIndex].id);
    }
    
    setDragX(null);
    mobileNavRef.current.releasePointerCapture(e.pointerId);
    
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const getPillStyle = () => {
    if (isDraggingMenu && dragX !== null) {
      return {
        transform: `translateX(${dragX}px)`,
        width: `${100 / MENU_ITEMS.length}%`,
        transition: 'none'
      };
    }
    return {
      transform: `translateX(${activeIndex * 100}%)`,
      width: `${100 / MENU_ITEMS.length}%`,
      transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
    };
  };

  return (
    <>
      {/* --- INJECTED CSS FOR HAMBURGER ANIMATION & ORBITRON FONT --- */}
      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-refine {
          font-family: "Orbitron", sans-serif;
          font-optical-sizing: auto;
          font-weight: 900;
          font-style: normal;
        }

        /* From Uiverse.io by Madflows */ 
        .toggle-switch {
          position: relative;
          width: 100px;
          height: 50px;
          --light: #d8dbe0;
          --dark: #28292c;
          --link: rgb(27, 129, 112);
          --link-hover: rgb(24, 94, 82);
        }

        .switch-label {
          position: absolute;
          width: 100%;
          height: 50px;
          background-color: var(--dark);
          border-radius: 25px;
          cursor: pointer;
          border: 3px solid var(--dark);
        }

        .checkbox {
          position: absolute;
          display: none;
        }

        .slider {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 25px;
          -webkit-transition: 0.3s;
          transition: 0.3s;
        }

        .checkbox:checked ~ .slider {
          background-color: var(--light);
        }

        .slider::before {
          content: "";
          position: absolute;
          top: 10px;
          left: 10px;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          -webkit-box-shadow: inset 12px -4px 0px 0px var(--light);
          box-shadow: inset 12px -4px 0px 0px var(--light);
          background-color: var(--dark);
          -webkit-transition: 0.3s;
          transition: 0.3s;
        }

        .checkbox:checked ~ .slider::before {
          -webkit-transform: translateX(50px);
          -ms-transform: translateX(50px);
          transform: translateX(50px);
          background-color: var(--dark);
          -webkit-box-shadow: none;
          box-shadow: none;
        }
        .hamburger {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hamburger input {
          display: none;
        }
        .hamburger svg {
          height: 2.2em;
          font-size: 12px;
          transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .line {
          fill: none;
          stroke: currentColor;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-width: 3;
          transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
                      stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .line-top-bottom {
          stroke-dasharray: 12 63;
        }
        .hamburger input:checked + svg {
          transform: rotate(-45deg);
        }
        .hamburger input:checked + svg .line-top-bottom {
          stroke-dasharray: 20 300;
          stroke-dashoffset: -32.42;
        }
      `}} />

      {/* --- DESKTOP SIDEBAR --- */}
      <aside 
        ref={sidebarRef}
        style={{ width: `${width}px` }}
        className={cn(
          "hidden md:flex shrink-0 flex-col justify-between h-screen border-r bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800/80 font-sans select-none relative z-40 overflow-hidden",
          isResizing ? "" : "transition-[width] duration-300 ease-in-out"
        )}
      >
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className="absolute top-0 -right-1.5 w-3 h-full cursor-ew-resize z-50 flex items-center justify-center group"
        >
          <div className="w-1.5 h-16 rounded-full bg-slate-100 group-hover:bg-slate-300 dark:bg-zinc-800 dark:group-hover:bg-zinc-600 transition-colors duration-300 ease-in-out" />
        </div>

        <div className="flex flex-col flex-1 px-3 pt-6 pb-4 overflow-y-auto overflow-x-hidden no-scrollbar">
          {/* Header Section with Proper Alignment for Expanded & Collapsed States */}
          <div className={cn(
            "flex items-center mb-8 px-2 min-w-0",
            isCollapsed ? "justify-center flex-col gap-4" : "justify-between"
          )}>
            <div className={cn(
              "flex items-center gap-3 shrink-0 transition-opacity duration-300 ease-in-out overflow-hidden",
              isCollapsed ? "opacity-0 w-0 h-0 hidden" : "opacity-100 w-auto flex"
            )}>
              <img 
                src={logoImg} 
                alt="RefineX Logo" 
                className="w-[40px] h-[40px] object-cover rounded-lg shrink-0 shadow-sm"
              />
              <span className="sidebar-refine text-xl tracking-wider inline-flex items-center text-slate-900 dark:text-white whitespace-nowrap">
                Refine<span className="font-sans text-[#673ab7] text-2xl font-black ml-0.5 inline-flex items-center justify-center leading-none">X</span>
              </span>
            </div>

            <div className={cn(
              "flex items-center justify-center shrink-0 transition-all duration-300 ease-in-out",
              isCollapsed ? "mx-auto w-full" : ""
            )}>
              <label 
                className="hamburger p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" 
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <input type="checkbox" checked={!isCollapsed} onChange={handleDoubleClick} />
                <svg viewBox="0 0 32 32">
                  <path className="line line-top-bottom" d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22" />
                  <path className="line" d="M7 16 27 16" />
                </svg>
              </label>
            </div>
          </div>

          <nav className="flex flex-col gap-2.5 items-center w-full">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  className={cn(
                    "group flex items-center rounded-lg cursor-pointer transition-all duration-300 ease-in-out",
                    isCollapsed ? "justify-center p-3 mx-auto w-11 h-11" : "px-3.5 py-3 gap-3.5 w-full text-left",
                    isActive
                      ? "bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white shadow-sm"
                      : "bg-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
                  )}
                >
                  <Icon 
                    className={cn(
                      "shrink-0 w-5 h-5 transition-colors duration-300 ease-in-out", 
                      isActive 
                        ? "text-purple-600 dark:text-purple-400" 
                        : "text-slate-500 dark:text-zinc-500 group-hover:text-slate-800 dark:group-hover:text-zinc-200"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />

                  {!isCollapsed && (
                    <span className={cn(
                      "truncate min-w-0 flex-1 text-[14px] tracking-wide transition-all duration-300 ease-in-out",
                      isActive ? "font-bold text-slate-900 dark:text-white" : "font-medium"
                    )}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* --- THEME TOGGLE SECTION (CLOSED VS OPENED) --- */}
        <div className="px-3.5 py-3 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 transition-colors duration-300">
          {isCollapsed ? (
            /* CLOSED SIDEBAR: Uiverse.io Toggle Switch */
            <div className="w-full flex items-center justify-center py-1">
              <div className="toggle-switch transform scale-[0.40] origin-center -my-3.5 -mx-7 shrink-0" title="Toggle Light/Dark Theme">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={!isDarkMode}
                    onChange={() => toggleTheme(!isDarkMode ? "dark" : "light")}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          ) : (
            /* OPENED SIDEBAR: Pill-Shaped Segmented Control (Exact login/signup style) */
            <div className="relative flex w-full items-center rounded-full border border-slate-200/80 dark:border-zinc-800/90 bg-slate-200/70 dark:bg-[#1c1c1e] p-1 shadow-inner">
              <motion.div
                className="absolute inset-y-1 rounded-full bg-white dark:bg-[#3a3a3c] shadow-sm border border-slate-200/80 dark:border-zinc-700/80"
                initial={false}
                animate={{
                  left: isDarkMode ? "50%" : "4px",
                  width: "calc(50% - 4px)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />

              <button
                type="button"
                onClick={() => toggleTheme("light")}
                className={`relative z-10 w-1/2 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                  !isDarkMode
                    ? "text-[#1c1c1e] dark:text-white"
                    : "text-slate-500 dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white"
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>

              <button
                type="button"
                onClick={() => toggleTheme("dark")}
                className={`relative z-10 w-1/2 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                  isDarkMode
                    ? "text-[#1c1c1e] dark:text-white"
                    : "text-slate-500 dark:text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white"
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-900 transition-colors duration-300 ease-in-out">
          <div className={cn(
            "flex items-center transition-all duration-300 ease-in-out w-full",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            <div className={cn(
              "flex items-center gap-3 min-w-0 transition-opacity duration-300 ease-in-out overflow-hidden", 
              isCollapsed ? "opacity-0 w-0 h-0 hidden" : "opacity-100 w-auto flex"
            )}>
              <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800 flex items-center justify-center border-2 border-slate-300 dark:border-zinc-700 shadow-sm transition-all duration-300 ease-in-out">
                {loading ? (
                  <div className="w-full h-full animate-pulse bg-slate-300 dark:bg-zinc-700 transition-colors duration-300" />
                ) : user?.profile_picture ? (
                  <img src={user.profile_picture} alt="avatar" className="w-full h-full object-cover transition-opacity duration-300" />
                ) : (
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors duration-300">
                    {user ? getInitials(user.first_name, user.last_name, user.email) : "?"}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col text-left min-w-0 flex-1">
                <span className="text-[14px] font-bold text-slate-900 dark:text-zinc-100 truncate leading-tight mb-0.5 transition-colors duration-300">
                  {loading ? "Loading..." : (user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}` : "User")}
                </span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-zinc-400 truncate leading-tight transition-colors duration-300">
                  {loading ? "..." : user?.email}
                </span>
              </div>
            </div>

            {isCollapsed && (
               <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800 flex items-center justify-center border-2 border-slate-300 dark:border-zinc-700 shadow-sm transition-all duration-300 ease-in-out mx-auto">
                {loading ? (
                  <div className="w-full h-full animate-pulse bg-slate-300 dark:bg-zinc-700 transition-colors duration-300" />
                ) : user?.profile_picture ? (
                  <img src={user.profile_picture} alt="avatar" className="w-full h-full object-cover transition-opacity duration-300" />
                ) : (
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors duration-300">
                    {user ? getInitials(user.first_name, user.last_name, user.email) : "?"}
                  </span>
                )}
              </div>
            )}

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Log Out"
                className="group p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 ml-2 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm transition-all duration-300 ease-in-out"
              >
                <LogOut className="w-4 h-4 transition-colors duration-300 ease-in-out group-hover:text-red-600 dark:group-hover:text-red-500" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className={cn(
        "md:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[380px] pointer-events-auto transition-transform duration-300 ease-in-out",
        isNavVisible ? "translate-y-0 bottom-5" : "translate-y-32 bottom-5"
      )}>
        <div className="relative flex items-center p-1.5 h-[64px] rounded-full bg-[#FFFFFF]/80 dark:bg-[#212121]/70 backdrop-blur-3xl border border-slate-200 dark:border-zinc-800 shadow-md touch-none select-none">
          <div 
            ref={mobileNavRef}
            className="relative flex w-full h-full items-center"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Draggable Active Pill Outline */}
            <div 
              className="absolute top-0 bottom-0 rounded-full border border-purple-600 dark:border-purple-400 bg-transparent shadow-xs z-0 cursor-grab active:cursor-grabbing"
              style={getPillStyle()}
            />

            {/* Menu Buttons */}
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!hasDraggedRef.current) {
                      onTabChange(item.id);
                    }
                  }}
                  title={item.label}
                  className={cn(
                    "relative z-10 flex-1 flex flex-col items-center justify-center h-full rounded-full transition-colors duration-300 ease-out",
                    isActive 
                      ? "text-slate-900 dark:text-white" 
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  )}
                >
                  <div className="flex flex-col items-center justify-center w-full h-full relative">
                    <Icon 
                      className={cn(
                        "w-[22px] h-[22px] transition-all duration-300 ease-out", 
                        isActive 
                          ? "text-purple-600 dark:text-purple-400 translate-y-0 scale-110" 
                          : "text-slate-800 dark:text-white -translate-y-2 scale-105"
                      )} 
                      strokeWidth={isActive ? 2.5 : 2.2} 
                    />
                    
                    <span 
                      className={cn(
                        "text-[9px] font-semibold absolute bottom-0.5 transition-all duration-300 ease-out",
                        isActive ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                      )}
                    >
                      {MOBILE_LABELS[item.id]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;