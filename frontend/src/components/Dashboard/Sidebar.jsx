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

// Specific mapping for shorter mobile labels
const MOBILE_LABELS = {
  "overview": "Home",
  "clean": "Clean",
  "model-training": "Train",
  "visualization": "Graph",
  "history": "History",
  "settings": "Settings"
};

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
        setWidth(MAX_WIDTH);
      }
    }
  }, [isCollapsed]); 

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
      // Capture scroll events specifically from the main scroll container
      if (!target || target.id !== "main-scroll-container") return;

      const currentScrollY = target.scrollTop;

      // Prevent negative scroll values (like iOS rubber-banding bounce) from hiding the nav bar
      if (currentScrollY < 0) {
        setIsNavVisible(true);
        return;
      }
      
      // Hide on scroll down, show on scroll up 
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setIsNavVisible(false); // Scrolling down (hide)
      } else {
        setIsNavVisible(true); // Scrolling up (show)
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
  
  // Calculate index directly from array
  const activeIndex = Math.max(0, MENU_ITEMS.findIndex(item => item.id === activeTab));

  const handlePointerDown = (e) => {
    if (!mobileNavRef.current) return;
    hasDraggedRef.current = false;
    
    const rect = mobileNavRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const itemWidth = rect.width / MENU_ITEMS.length;
    
    // Only start drag if interacting with the currently active pill
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
      {/* --- DESKTOP SIDEBAR --- */}
      <aside 
        ref={sidebarRef}
        style={{ width: `${width}px` }}
        className={cn(
          "hidden md:flex shrink-0 flex-col justify-between h-screen border-r bg-[#FFFFFF]/80 dark:bg-[#212121]/80 backdrop-blur-2xl border-slate-200/60 dark:border-zinc-800/60 font-sans select-none relative z-40 overflow-visible",
          isResizing ? "" : "transition-all duration-300 ease-out"
        )}
      >
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className="absolute top-0 -right-1.5 w-3 h-full cursor-ew-resize z-50 flex items-center justify-center group"
        >
          <div className="w-1 h-12 rounded-full bg-slate-300/0 dark:bg-zinc-700/0 group-hover:bg-slate-400/50 dark:group-hover:bg-zinc-600/50 transition-colors duration-200" />
        </div>

        <div className="flex flex-col gap-6 pt-5 px-3 overflow-hidden">
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
              onClick={handleDoubleClick}
              className={cn(
                "p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-[#F1F5F9]/60 dark:hover:bg-zinc-900/80 transition-all duration-150 ease-out cursor-pointer w-9 h-9 flex items-center justify-center shrink-0",
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
                  <div className={cn(
                    "shrink-0 flex items-center justify-center transition-colors duration-150 ease-out",
                    !isCollapsed && "p-1.5 rounded-lg border",
                    !isCollapsed && isActive ? "border-primary bg-white/40 dark:bg-zinc-950/20 text-primary" : (!isCollapsed && "border-slate-200 dark:border-zinc-800")
                  )}>
                    <Icon className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} strokeWidth={2.2} shapeRendering="geometricPrecision" />
                  </div>

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

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className={cn(
        "md:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[380px] pointer-events-auto transition-transform duration-300 ease-in-out",
        isNavVisible ? "translate-y-0 bottom-5" : "translate-y-32 bottom-5"
      )}>
        
        {/* Dark/White Spread (Glow) behind the bar */}
        <div className="absolute -inset-[3px] rounded-full bg-black/20 dark:bg-white/10 blur-xl opacity-80 -z-10 pointer-events-none" />

        <div className="relative flex items-center p-1.5 h-[64px] rounded-full bg-[#FFFFFF]/80 dark:bg-[#212121]/70 backdrop-blur-3xl border border-black/30 dark:border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)] touch-none select-none">
          <div 
            ref={mobileNavRef}
            className="relative flex w-full h-full items-center"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Draggable Active Pill Background */}
            <div 
              className="absolute top-0 bottom-0 rounded-full border border-black/30 dark:border-white/30 bg-[#F1F5F9]/95 dark:bg-[#272727]/90 shadow-sm z-0 cursor-grab active:cursor-grabbing"
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
                        isActive ? "translate-y-0 scale-110" : "-translate-y-2 scale-105"
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