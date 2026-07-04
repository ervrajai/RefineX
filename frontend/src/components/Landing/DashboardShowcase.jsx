import { FiCheckCircle, FiActivity, FiCpu } from "react-icons/fi";

function DashboardShowcase() {
  return (
    <section id="dashboard" className="rx-section" style={{ backgroundColor: "var(--rx-surface)" }}>
      <div className="rx-container">
        <div className="rx-card" style={{ padding: "clamp(24px, 5vw, 48px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px", alignItems: "center" }}>
            
            {/* Context Left Column Details */}
            <div>
              <h2 className="rx-title" style={{ fontSize: "2rem", textAlign: "left" }}>
                Interactive dashboard at a glance
              </h2>
              <p className="rx-subtitle" style={{ margin: "16px 0 24px 0", textAlign: "left" }}>
                Track cleaning progress, model performance, and data trends without switching tools.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", fontSize: "1.05rem", color: "var(--rx-text-secondary)" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}><FiCheckCircle color="var(--rx-primary)"/> Live status monitoring</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}><FiActivity color="var(--rx-primary)"/> Visual summaries for every dataset</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px" }}><FiCpu color="var(--rx-primary)"/> Fast export of trained models</li>
              </ul>
            </div>

            {/* Simulated Live Analytics Platform Mock Container */}
            <div style={{
              backgroundColor: "var(--rx-bg)",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid var(--rx-border)",
              boxShadow: "var(--rx-shadow)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--rx-text-primary)", fontWeight: 600, marginBottom: "12px" }}>
                <span>Tasks completed</span>
                <strong style={{ color: "var(--rx-primary)" }}>82%</strong>
              </div>
              
              {/* Animated Horizontal Processing Bar Meter */}
              <div style={{ height: "10px", backgroundColor: "var(--rx-surface)", borderRadius: "999px", marginBottom: "24px", overflow: "hidden" }}>
                <div style={{ width: "82%", height: "100%", backgroundColor: "var(--rx-primary)", borderRadius: "999px" }} />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "14px", backgroundColor: "var(--rx-surface)", borderRadius: "8px", border: "1px solid var(--rx-border)", fontSize: "0.95rem" }}>
                  <strong style={{ color: "var(--rx-text-primary)" }}>Validation checks:</strong> <span style={{ color: "var(--rx-text-secondary)" }}>120 clean logs detected</span>
                </div>
                <div style={{ padding: "14px", backgroundColor: "var(--rx-surface)", borderRadius: "8px", border: "1px solid var(--rx-border)", fontSize: "0.95rem" }}>
                  <strong style={{ color: "var(--rx-text-primary)" }}>Model accuracy:</strong> <span style={{ color: "var(--rx-text-secondary)" }}>94.2% Random Forest</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardShowcase;