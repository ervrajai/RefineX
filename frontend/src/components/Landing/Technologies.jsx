import { FiLayers } from "react-icons/fi";

function Technologies() {
  const technologies = ["Pandas", "NumPy", "Scikit-Learn", "Matplotlib", "Plotly", "Seaborn"];

  return (
    <section id="library" className="rx-section rx-section-center" style={{ backgroundColor: "var(--rx-surface)" }}>
      <div className="rx-container">
        <h2 className="rx-title">Powered By The Best</h2>
        <p className="rx-subtitle">The frameworks and libraries driving RefineX.</p>
        
        <div style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          {technologies.map((item) => (
            <div key={item} className="rx-card" style={{
              padding: "16px 32px", borderRadius: "12px", display: "flex",
              alignItems: "center", gap: "12px", transform: "none"
            }}>
              <FiLayers color="var(--rx-primary)" size={18} />
              <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Technologies;