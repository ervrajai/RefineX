import { useState, useEffect } from "react";
import { FiChevronDown, FiSun, FiMoon, FiMonitor, FiMenu, FiX, FiDatabase } from "react-icons/fi";

function Navbar() {
  const [theme, setTheme] = useState("light");
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("rx-theme") || "auto";
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (mode) => {
    setTheme(mode);
    localStorage.setItem("rx-theme", mode);
    if (mode === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", mode);
    }
    setThemeOpen(false);
  };

  return (
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 32px", backgroundColor: "var(--rx-bg)", borderBottom: "1px solid var(--rx-border)",
      position: "sticky", top: 0, zIndex: 100, height: "70px"
    }}>
      {/* Brand Brand Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          width: "34px", height: "34px", backgroundColor: "var(--rx-primary)",
          borderRadius: "8px", color: "white"
        }}>
          <FiDatabase size={18} />
        </div>
        <div style={{
          fontFamily: "var(--rx-font-logo)", fontSize: "1.35rem",
          fontWeight: 800, color: "var(--rx-text-primary)", letterSpacing: "1px"
        }}>
          RefineX
        </div>
      </div>

      {/* Desktop Links Container */}
      <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <a href="#home" className="rx-link">Home</a>
        <a href="#dashboard" className="rx-link">Dashboard</a>
        
        {/* Dropdown Feature Menu */}
        <div style={{ position: "relative" }} 
             onMouseEnter={() => setFeaturesOpen(true)} 
             onMouseLeave={() => setFeaturesOpen(false)}>
          <span className="rx-link" style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            Features <FiChevronDown size={14} />
          </span>
          {featuresOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, paddingTop: "8px",
              backgroundColor: "var(--rx-card-bg)", border: "1px solid var(--rx-border)",
              borderRadius: "8px", width: "180px", boxShadow: "var(--rx-shadow)", padding: "8px"
            }}>
              <a href="#features" style={{ display: "block", padding: "8px 12px", borderRadius: "6px" }} className="rx-link">Data Cleaning</a>
              <a href="#features" style={{ display: "block", padding: "8px 12px", borderRadius: "6px" }} className="rx-link">Model Training</a>
              <a href="#features" style={{ display: "block", padding: "8px 12px", borderRadius: "6px" }} className="rx-link">Visualization</a>
            </div>
          )}
        </div>
        
        <a href="#library" className="rx-link">Library</a>
        <a href="#about" className="rx-link">About</a>
      </div>

      {/* Action Buttons + Controls */}
      <div className="desktop-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <a href="#" className="rx-link" style={{ fontSize: "0.95rem" }}>Log in</a>
        <a href="#" className="rx-btn-primary" style={{ padding: "8px 18px", fontSize: "0.95rem" }}>Sign Up</a>

        {/* Theme Select Toggler */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setThemeOpen(!themeOpen)} className="rx-btn-secondary" style={{ padding: "8px 12px", gap: "6px" }}>
            {theme === "light" ? <FiSun /> : theme === "dark" ? <FiMoon /> : <FiMonitor />}
            <span style={{ textTransform: "capitalize", fontSize: "0.9rem" }}>{theme}</span>
          </button>
          
          {themeOpen && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: "8px",
              backgroundColor: "var(--rx-card-bg)", border: "1px solid var(--rx-border)",
              borderRadius: "8px", padding: "6px", minWidth: "130px", boxShadow: "var(--rx-shadow)",
              display: "flex", flexDirection: "column", gap: "2px"
            }}>
              <button onClick={() => applyTheme("light")} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", cursor: "pointer", color: "var(--rx-text-primary)", width: "100%", borderRadius: "6px" }}><FiSun size={14}/> Light</button>
              <button onClick={() => applyTheme("dark")} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", cursor: "pointer", color: "var(--rx-text-primary)", width: "100%", borderRadius: "6px" }}><FiMoon size={14}/> Dark</button>
              <button onClick={() => applyTheme("auto")} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", cursor: "pointer", color: "var(--rx-text-primary)", width: "100%", borderRadius: "6px" }}><FiMonitor size={14}/> Auto</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Responsive Hamburger Controls */}
      <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
        background: "none", border: "none", color: "var(--rx-text-primary)", cursor: "pointer", display: "none"
      }}>
        {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Responsive Injection CSS Style Rules */}
      <style>{`
        @media (max-width: 992px) {
          .desktop-nav, .desktop-actions { display: none !important; }
          .mobile-toggle-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;