import React, { useState, useEffect, useRef } from "react";
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

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState("auto");
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef(null);

  // Handle scroll effect for transparent nav on large screens
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 1024) {
        setIsScrolled(window.scrollY > 10);
      } else {
        setIsScrolled(true); // Always solid on mobile/tablet
      }
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

    // Listen for system theme changes if set to auto
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
            ? "bg-white/90 dark:bg-black/90 backdrop-blur-md border-gray-200 dark:border-gray-800"
            : "lg:bg-transparent lg:border-transparent lg:backdrop-blur-none bg-white/90 dark:bg-black/90 backdrop-blur-md border-gray-200 dark:border-gray-800"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center relative">
          
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex justify-center items-center w-9 h-9 md:w-10 md:h-10 bg-purple-600 rounded-xl text-white shadow-sm">
              <FiDatabase size={20} />
            </div>
            <span className="font-orbitron text-xl md:text-2xl font-black tracking-wider inline-flex items-center text-black dark:text-white">
              Refine<span className="font-sans text-purple-600 text-2xl md:text-3xl ml-0.5 leading-none">X</span>
            </span>
          </a>

          {/* Desktop Links (Center Pill) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-900 p-1">
            <ul className="flex items-center text-sm font-medium">
              <li>
                <a href="#home" className="block px-5 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#dashboard" className="block px-5 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors">
                  Dashboard
                </a>
              </li>
              <li className="relative group">
                <a href="#features" className="px-5 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors">
                  Features
                  <FiChevronDown className="w-4 h-4 mt-0.5" />
                </a>
                {/* Dropdown Menu */}
                <div className="absolute left-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-50">
                  <ul className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    <li>
                      <a href="#cleaning" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white border-b border-gray-200 dark:border-gray-700 transition-colors">
                        Data Cleaning
                      </a>
                    </li>
                    <li>
                      <a href="#training" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white border-b border-gray-200 dark:border-gray-700 transition-colors">
                        Model Training
                      </a>
                    </li>
                    <li>
                      <a href="#visuals" className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors">
                        Visualization
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <a href="#library" className="block px-5 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors">
                  Library
                </a>
              </li>
              <li>
                <a href="#about" className="block px-5 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <a href="/login" className="hidden md:block font-medium text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
              Log in
            </a>
            <a href="/signup" className="hidden sm:block bg-purple-600 text-white px-4 py-2 md:px-5 rounded-md font-medium text-sm hover:bg-purple-700 transition-colors">
              Sign Up
            </a>

            {/* Theme Dropdown */}
            <div className="relative" ref={themeDropdownRef}>
              <button
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none"
              >
                {theme === "light" ? <FiSun className="w-4 h-4 shrink-0" /> : theme === "dark" ? <FiMoon className="w-4 h-4 shrink-0" /> : <FiMonitor className="w-4 h-4 shrink-0" />}
                <span className="hidden sm:inline capitalize">{theme}</span>
                <FiChevronDown className="w-3.5 h-3.5 opacity-50" />
              </button>

              {isThemeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <button onClick={() => changeTheme("light")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors">
                    <FiSun className="w-4 h-4 shrink-0" /> Light
                  </button>
                  <button onClick={() => changeTheme("dark")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors border-t border-gray-200 dark:border-gray-700">
                    <FiMoon className="w-4 h-4 shrink-0" /> Dark
                  </button>
                  <button onClick={() => changeTheme("auto")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors border-t border-gray-200 dark:border-gray-700">
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
        className={`fixed top-0 right-0 h-full w-[60%] max-w-xs z-50 bg-white dark:bg-[#0d0d0d] border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <span className="font-orbitron text-base font-black tracking-wider inline-flex items-baseline text-black dark:text-white">
            Refine<span className="font-sans text-purple-600 text-xl ml-0.5">X</span>
          </span>
          <button
            onClick={closeMobileMenu}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex flex-col px-3 py-4 gap-0.5 flex-1 overflow-y-auto">
          <a onClick={closeMobileMenu} href="#home" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiHome className="w-4 h-4 shrink-0 text-gray-400" /> Home
          </a>
          <a onClick={closeMobileMenu} href="#dashboard" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiGrid className="w-4 h-4 shrink-0 text-gray-400" /> Dashboard
          </a>
          <a onClick={closeMobileMenu} href="#features" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiLayers className="w-4 h-4 shrink-0 text-gray-400" /> Features
          </a>
          <a onClick={closeMobileMenu} href="#library" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiBook className="w-4 h-4 shrink-0 text-gray-400" /> Library
          </a>
          <a onClick={closeMobileMenu} href="#about" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiInfo className="w-4 h-4 shrink-0 text-gray-400" /> About
          </a>
          
          <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>
          
          <a onClick={closeMobileMenu} href="/login" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
            <FiLogIn className="w-4 h-4 shrink-0 text-gray-400" /> Log in
          </a>
          <a onClick={closeMobileMenu} href="/signup" className="flex items-center justify-center gap-2 mt-1 px-3 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors">
            Sign Up
          </a>
        </nav>
      </div>
    </>
  );
}

export default Navbar;