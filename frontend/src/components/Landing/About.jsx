import { FiGithub } from "react-icons/fi";

function About() {
  const crew = [
    { name: "Pranay Jain", role: "Frontend Developer" },
    { name: "Vraj Patel", role: "Backend Developer" }
  ];

  return (
    <section id="about" className="py-24 px-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111111] text-center">
      <h2 className="text-3xl font-bold mb-4 text-black dark:text-white tracking-tight">Meet the Team</h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-16">The developers building RefineX.</p>
      
      <div className="grid sm:grid-cols-2 gap-12 max-w-3xl mx-auto">
        {crew.map((member, idx) => (
          <div key={idx} className="flex flex-col items-center">
            
            <div className="w-24 h-24 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center text-2xl font-bold text-primary mb-5 shadow-sm">
              {member.name.split(" ").map(n => n[0]).join("")}
            </div>
            
            <h3 className="text-xl font-semibold text-black dark:text-white mb-1">{member.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{member.role}</p>
            
            <a href="#" className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
              <FiGithub size={18} /> GitHub Profile
            </a>
            
          </div>
        ))}
      </div>
    </section>
  );
}

export default About;