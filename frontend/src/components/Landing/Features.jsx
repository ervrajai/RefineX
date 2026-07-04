import { FiDatabase, FiCpu, FiBarChart2 } from "react-icons/fi";

function Features() {
  const pipelineData = [
    {
      icon: <FiDatabase size={28} />,
      title: "Data Cleaning",
      items: [
        { label: "Upload Dataset", desc: "Import your raw CSV safely" },
        { label: "Auto-Detect Issues", desc: "Find nulls, duplicates & outliers instantly" },
        { label: "Resolve & Export", desc: "Apply fixes and download pristine data" }
      ]
    },
    {
      icon: <FiCpu size={28} />,
      title: "Model Training",
      items: [
        { label: "Select Target", desc: "Choose the column you want to predict" },
        { label: "Train Algorithm", desc: "Run Regression or Random Forest models" },
        { label: "Evaluate & Save", desc: "Check accuracy scores and download .pkl" }
      ]
    },
    {
      icon: <FiBarChart2 size={28} />,
      title: "Visualization",
      items: [
        { label: "Pick Data Points", desc: "Select X and Y axes from your dataset" },
        { label: "Generate Chart", desc: "Create Bar, Line, Scatter, or Pie graphs" },
        { label: "Export Assets", desc: "Download the graph image and Python code" }
      ]
    }
  ];

  return (
    <section id="features" className="rx-section rx-section-center">
      <div className="rx-container">
        <h2 className="rx-title">Master Every Feature</h2>
        <p className="rx-subtitle">Dedicated pipelines designed to handle data exactly how you want.</p>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "32px",
          textAlign: "left"
        }}>
          {pipelineData.map((feature, idx) => (
            <div key={idx} className="rx-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{
                color: "white", backgroundColor: "var(--rx-primary)", 
                width: "54px", height: "54px", borderRadius: "12px",
                display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center"
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 700 }}>{feature.title}</h3>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
                {feature.items.map((step, sIdx) => (
                  <li key={sIdx} style={{ fontSize: "0.95rem" }}>
                    <strong style={{ color: "var(--rx-text-primary)", display: "block", marginBottom: "2px" }}>
                      {step.label}
                    </strong>
                    <span style={{ color: "var(--rx-text-secondary)" }}>{step.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;