import React from "react";

const techs = [
  { name: "Pandas", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg" },
  { name: "NumPy", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/numpy/numpy-original.svg" },
  { name: "Scikit-Learn", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/scikitlearn/scikitlearn-original.svg" },
  { name: "Matplotlib", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/matplotlib/matplotlib-original.svg" },
  { name: "Plotly", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/plotly/plotly-original.svg" }
];

// Duplicate the array a few times so the marquee is always full on ultra-wide screens
const duplicatedTechs = [...techs, ...techs, ...techs, ...techs, ...techs, ...techs];

export default function Technologies() {
  return (
    <section id="library" className="py-20 md:py-28 bg-white dark:bg-black w-full overflow-hidden">
      
      {/* Required Keyframes for the Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        /* Pause the animation when hovering over the container */
        .marquee-container:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>

      {/* Section Header - Kept centered and contained */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 tracking-tight">
          Powered By The Best
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          The industry-leading frameworks and libraries driving the RefineX engine.
        </p>
      </div>

      {/* Marquee Wrapper - Full Bleed (Edge to Edge) */}
      <div className="relative marquee-container w-full flex items-center py-4">
        
        {/* Scrolling Track */}
        <div className="flex w-max animate-marquee">
          {duplicatedTechs.map((tech, index) => (
            <div
              key={`${tech.name}-${index}`}
              className="flex items-center gap-4 px-6 py-4 mx-3 bg-white dark:bg-[#111111] border border-lightBorder/50 dark:border-white/10 rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-105 hover:border-[#673ab7] hover:shadow-[0_0_20px_rgba(103,58,183,0.15)] shrink-0"
            >
              <img 
                src={tech.url} 
                alt={tech.name} 
                className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-sm" 
              />
              <span className="font-bold text-base md:text-lg text-gray-800 dark:text-gray-200">
                {tech.name}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}