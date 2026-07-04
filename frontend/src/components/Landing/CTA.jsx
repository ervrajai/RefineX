import { FiArrowRight } from "react-icons/fi";

function CTA() {
  return (
    <section className="rx-section rx-section-center">
      <div className="rx-container">
        <div style={{
          backgroundColor: "var(--rx-primary)",
          borderRadius: "24px",
          padding: "64px 24px",
          color: "#ffffff",
          boxShadow: "var(--rx-shadow-lg)"
        }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, marginBottom: "16px" }}>
            Ready to refine your workflow?
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "1.1rem", marginBottom: "32px", maxWidth: "600px", margin: "0 auto 32px auto" }}>
            Launch your first cleaning pipeline and turn raw data into reliable machine learning results instantly.
          </p>
          <a href="#" className="rx-btn-primary" style={{
            backgroundColor: "#ffffff", color: "var(--rx-primary)",
            padding: "14px 32px", fontSize: "1.05rem", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }} className="cta-btn-hover">
            Get Started Free <FiArrowRight />
          </a>
        </div>
      </div>
      
      <style>{`
        .cta-btn-hover {
          background-color: #ffffff !important;
          color: var(--rx-primary) !important;
          font-weight: 700;
        }
        .cta-btn-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </section>
  );
}

export default CTA;