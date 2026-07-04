import { FiDatabase } from "react-icons/fi";

function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--rx-surface)", borderTop: "1px solid var(--rx-border)" }}>
      <div className="rx-container" style={{ paddingTop: "64px", paddingBottom: "48px" }}>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "40px",
          marginBottom: "48px"
        }}>
          {/* Logo Brand Statement Block (Occupies more width on desktop screens) */}
          <div style={{ gridColumn: "span 2" }} className="footer-brand-span">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                width: "28px", height: "28px", backgroundColor: "var(--rx-primary)",
                borderRadius: "6px", color: "white"
              }}>
                <FiDatabase size={14} />
              </div>
              <span style={{ fontFamily: "var(--rx-font-logo)", fontWeight: 700, fontSize: "1.2rem", letterSpacing: "0.5px" }}>
                RefineX
              </span>
            </div>
            <p style={{ color: "var(--rx-text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: "280px" }}>
              Your complete platform for data cleaning, visualization, and machine learning. Built for students and professionals.
            </p>
          </div>

          {/* Links Grid Column 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>Product</h4>
            <a href="#features" className="rx-link" style={{ fontSize: "0.9rem" }}>Data Cleaning</a>
            <a href="#features" className="rx-link" style={{ fontSize: "0.9rem" }}>ML Training</a>
            <a href="#features" className="rx-link" style={{ fontSize: "0.9rem" }}>Visualizations</a>
          </div>

          {/* Links Grid Column 2 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>Resources</h4>
            <a href="#" className="rx-link" style={{ fontSize: "0.9rem" }}>Documentation</a>
            <a href="#" className="rx-link" style={{ fontSize: "0.9rem" }}>Sample Datasets</a>
            <a href="#" className="rx-link" style={{ fontSize: "0.9rem" }}>GitHub</a>
          </div>

          {/* Links Grid Column 3 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "4px" }}>Legal</h4>
            <a href="#" className="rx-link" style={{ fontSize: "0.9rem" }}>Privacy Policy</a>
            <a href="#" className="rx-link" style={{ fontSize: "0.9rem" }}>Terms of Service</a>
          </div>
        </div>

        {/* Closing Copyright Signoff Bar */}
        <div style={{
          borderTop: "1px solid var(--rx-border)", paddingTop: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px", fontSize: "0.85rem", color: "var(--rx-text-secondary)"
        }}>
          <span>&copy; {new Date().getFullYear()} RefineX Team. All rights reserved.</span>
          <span>Made in Ahmedabad.</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .footer-brand-span { grid-column: span 1 !important; }
        }
      `}</style>
    </footer>
  );
}

export default Footer;