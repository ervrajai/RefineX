import { FiGithub } from "react-icons/fi";

function About() {
  const crew = [
    { name: "Pranay Jain", role: "Frontend Developer" },
    { name: "Vraj Patel", role: "Backend Developer" }
  ];

  return (
    <section id="about" className="rx-section rx-section-center">
      <div className="rx-container">
        <h2 className="rx-title">Meet the Team</h2>
        <p className="rx-subtitle">The developers building RefineX.</p>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "32px",
          maxWidth: "800px",
          margin: "0 auto"
        }}>
          {crew.map((member, idx) => (
            <div key={idx} className="rx-card" style={{ padding: "40px 24px" }}>
              {/* Profile Avatar Frame Container */}
              <div style={{
                width: "90px", height: "90px", borderRadius: "50%",
                backgroundColor: "var(--rx-surface)", margin: "0 auto 20px auto",
                border: "2px solid var(--rx-border)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", fontWeight: 700, color: "var(--rx-primary)"
              }}>
                {member.name.split(" ").map(n => n[0]).join("")}
              </div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "6px" }}>{member.name}</h3>
              <p style={{ color: "var(--rx-primary)", fontWeight: 600, fontSize: "0.95rem", marginBottom: "20px" }}>{member.role}</p>
              <a href="#" className="rx-btn-secondary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
                <FiGithub /> GitHub Profile
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default About;