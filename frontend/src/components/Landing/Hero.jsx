import { FiUploadCloud } from "react-icons/fi";

function Hero() {
  return (
    <section id="home" className="rx-section rx-section-center" style={{ position: "relative", overflow: "hidden" }}>
      <div className="rx-container">
        <h1 className="rx-title" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", maxWidth: "900px", margin: "0 auto 24px", lineHeight: 1.15 }}>
          Analyze, clean and train <span className="text-gradient">datasets of any shape</span>
        </h1>
        <p className="rx-subtitle" style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)" }}>
          Our automated pipeline allows you to upload, visualize, and apply machine learning models to your data with zero coding required.
        </p>
        
        {/* Dynamic Drag Drop Circle Target */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
          <div style={{
            width: "clamp(280px, 40vw, 360px)",
            height: "clamp(280px, 40vw, 360px)",
            borderRadius: "50%",
            border: "2px dashed var(--rx-primary)",
            backgroundColor: "var(--rx-surface)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "32px",
            cursor: "pointer",
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.03)"
          }} className="upload-zone-hover">
            <FiUploadCloud size={48} color="var(--rx-primary)" style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "1.1rem", marginBottom: "6px", color: "var(--rx-text-primary)" }}>Click or drag & drop files</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--rx-text-secondary)", marginBottom: "12px" }}>or select a directory folder</p>
            <span style={{ fontSize: "0.75rem", color: "var(--rx-text-secondary)", backgroundColor: "var(--rx-border)", padding: "4px 10px", borderRadius: "999px", opacity: 0.8 }}>
              CSV · EXCEL · JSON up to 50MB
            </span>
          </div>
        </div>
      </div>
      
      <style>{`
        .upload-zone-hover:hover {
          background-color: var(--rx-card-bg) !important;
          border-color: var(--rx-primary-hover) !important;
          transform: scale(1.02);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
      `}</style>
    </section>
  );
}

export default Hero;