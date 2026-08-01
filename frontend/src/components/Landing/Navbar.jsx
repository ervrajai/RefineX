import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  FiMenu, 
  FiX, 
  FiDatabase, 
  FiSun, 
  FiMoon, 
  FiMonitor,
  FiChevronDown,
  FiHome,
  FiGrid,
  FiLayers,
  FiBook,
  FiInfo,
  FiLogIn
} from "react-icons/fi";
import logoImg from "../../assets/logo/refinex_logo.png";

const NAV_LINKS = [
  { name: "Home", href: "/#home" },
  { name: "Dashboard", href: "/#dashboard" },
  { name: "Features", href: "/#features" }, 
  { name: "Library", href: "/#library" },   
  { name: "About", href: "/#about" },
];

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState("auto");
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const themeDropdownRef = useRef(null);

  // Handle scroll effect for Solid-to-Blurred nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Handle Theme Application
  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem("theme") || "auto";
    setTheme(storedTheme);

    const applyTheme = (currentTheme) => {
      if (currentTheme === "dark") {
        root.classList.add("dark");
      } else if (currentTheme === "light") {
        root.classList.remove("dark");
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme(storedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "auto") applyTheme("auto");
    };
    mediaQuery.addEventListener("change", handleChange);
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Handle clicking outside theme dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeTheme = (newTheme) => {
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
    setIsThemeDropdownOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = "";
  };

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
    document.body.style.overflow = "hidden";
  };

  return (
    <>
      {/* ══════════════════ NAV ══════════════════ */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 border-b ${
          isScrolled
            ? "bg-white/80 dark:bg-[#0F0F0F]/80 backdrop-blur-md border-lightBorder/50 dark:border-gray-800"
            : "bg-white dark:bg-[#0F0F0F] border-transparent" 
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center relative">
          
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            {/* Using the imported image here */}
            <img 
              src={logoImg} 
              alt="RefineX Logo" 
              className="w-9 h-9 md:w-10 md:h-10 object-cover rounded-xl shadow-sm"
            />
            <span className="sidebar-refine text-xl md:text-2xl tracking-wider inline-flex items-center text-slate-900 dark:text-white whitespace-nowrap">
              Refine<span className="font-sans text-[#673ab7] text-2xl md:text-3xl font-black ml-0.5 leading-none">X</span>
            </span>
          </a>

          {/* Desktop Links (Animated Outline Container) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ul 
              className="flex items-center p-1.5 rounded-[40px] bg-[#FFFFFF]/80 dark:bg-[#212121]/80 border border-lightBorder/50 dark:border-gray-800/80 relative"
              onMouseLeave={() => setHoveredLink(null)}
            >
              {NAV_LINKS.map((link) => (
                <li key={link.name} className="relative z-10">
                  <a 
                    href={link.href} 
                    onMouseEnter={() => setHoveredLink(link.name)}
                    className="block relative px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors z-20 hover:text-brand dark:hover:text-white"
                  >
                    {link.name}
                  </a>
                  {/* Framer Motion LayoutId creates the gliding outline effect */}
                  {hoveredLink === link.name && (
                    <motion.div
                      layoutId="nav-outline"
                      className="absolute inset-0 border border-brand rounded-[20px] pointer-events-none"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 md:gap-5 shrink-0">
            <a 
              href="/login" 
              className="hidden md:block font-bold text-sm text-gray-900 dark:text-white hover:text-brand dark:hover:text-brand transition-colors"
            >
              Log in
            </a>


            <a 
              href="/signup" 
              className="hidden sm:flex items-center gap-2.5 px-6 py-2.5 bg-[#673ab7] hover:bg-[#111111] dark:hover:bg-white text-white font-bold text-sm rounded-[20px] transition-colors duration-200 group shadow-sm"
            >
              <span className="text-white group-hover:text-white dark:group-hover:text-black transition-colors duration-200">
                Sign Up
              </span>
              
              <div className="flex justify-center items-center">
                <div className="relative w-[10px] h-[2px] bg-[#673ab7] group-hover:bg-white dark:group-hover:bg-black transition-colors duration-200 mt-[1px]">
                  <div className="absolute top-[-3px] right-[3px] group-hover:right-0 p-[3px] border-solid border-white dark:group-hover:border-black border-b-[2px] border-r-[2px] transform -rotate-45 transition-all duration-200 box-border"></div>
                </div>
              </div>
            </a>

            {/* Theme Dropdown */}
            <div className="relative" ref={themeDropdownRef}>
              <button
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-lightBorder/80 dark:border-gray-700 bg-gray-50 dark:bg-neutral-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none"
              >
                {theme === "light" ? <FiSun className="w-4 h-4 shrink-0" /> : theme === "dark" ? <FiMoon className="w-4 h-4 shrink-0" /> : <FiMonitor className="w-4 h-4 shrink-0" />}
                <span className="hidden sm:inline capitalize">{theme}</span>
                <FiChevronDown className="w-3.5 h-3.5 opacity-50" />
              </button>

              {isThemeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#212121] border border-lightBorder/80 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <button onClick={() => changeTheme("light")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors">
                    <FiSun className="w-4 h-4 shrink-0" /> Light
                  </button>
                  <button onClick={() => changeTheme("dark")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors border-t border-lightBorder/50 dark:border-gray-700">
                    <FiMoon className="w-4 h-4 shrink-0" /> Dark
                  </button>
                  <button onClick={() => changeTheme("auto")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors border-t border-lightBorder/50 dark:border-gray-700">
                    <FiMonitor className="w-4 h-4 shrink-0" /> Auto
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger Button */}
            <button
              onClick={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
              className="lg:hidden p-2 rounded-md text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════ MOBILE DRAWER ══════════════════ */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobileMenu}
      ></div>

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[60%] max-w-xs z-50 bg-[#FFFFFF] dark:bg-[#212121] border-l border-lightBorder/50 dark:border-gray-800 shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-lightBorder/50 dark:border-gray-800">
          <span className="sidebar-refine text-lg tracking-wider inline-flex items-center text-slate-900 dark:text-white whitespace-nowrap">
            Refine<span className="font-sans text-[#673ab7] text-2xl font-black ml-0.5 leading-none">X</span>
          </span>
          <button
            onClick={closeMobileMenu}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex flex-col px-3 py-4 gap-0.5 flex-1 overflow-y-auto">
          <a onClick={closeMobileMenu} href="#home" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-brand dark:hover:text-brand hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiHome className="w-4 h-4 shrink-0 text-gray-400" /> Home
          </a>
          <a onClick={closeMobileMenu} href="#dashboard" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-brand dark:hover:text-brand hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiGrid className="w-4 h-4 shrink-0 text-gray-400" /> Dashboard
          </a>
          <a onClick={closeMobileMenu} href="#features" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-brand dark:hover:text-brand hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiLayers className="w-4 h-4 shrink-0 text-gray-400" /> Features
          </a>
          <a onClick={closeMobileMenu} href="#library" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-brand dark:hover:text-brand hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiBook className="w-4 h-4 shrink-0 text-gray-400" /> Library
          </a>
          <a onClick={closeMobileMenu} href="#about" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-brand dark:hover:text-brand hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiInfo className="w-4 h-4 shrink-0 text-gray-400" /> About
          </a>
          
          <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>
          
          <a onClick={closeMobileMenu} href="/login" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-brand dark:hover:text-brand hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiLogIn className="w-4 h-4 shrink-0 text-gray-400" /> Log in
          </a>
          <a onClick={closeMobileMenu} href="/signup" className="flex items-center justify-center gap-2 mt-1 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#673ab7] text-white hover:bg-[#522e93] transition-colors">
            Sign Up
          </a>
        </nav>
      </div>
    </>
  );
}

export default Navbar;