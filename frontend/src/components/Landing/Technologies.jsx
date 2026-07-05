// src/components/Landing/Technologies.jsx
import React from "react";

const techs = [
  { name: "Pandas", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg" },
  { name: "NumPy", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/numpy/numpy-original.svg" },
  { name: "Scikit-Learn", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/scikitlearn/scikitlearn-original.svg" },
  { name: "Matplotlib", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/matplotlib/matplotlib-original.svg" },
  { name: "Plotly", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/plotly/plotly-original.svg" }
];

export default function Technologies() {
  return (
    <section id="library" className="py-20 md:py-28 bg-white dark:bg-black w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Section Header (Matched to Features design) */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 tracking-tight">
            Powered By The Best
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            The industry-leading frameworks and libraries driving the RefineX engine.
          </p>
        </div>

        {/* Tech Cards Grid */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {techs.map((tech) => (
            <div
              key={tech.name}
              className="group relative flex flex-col w-[140px] md:w-[160px] items-center justify-center p-6 bg-white dark:bg-[#111111] border border-lightBorder/50 dark:border-white/10 rounded-2xl cursor-pointer transition-all duration-500 ease-out hover:border-[#673ab7] hover:bg-[#673ab7]/5 dark:hover:bg-[#673ab7]/20 hover:shadow-[0_0_30px_rgba(103,58,183,0.15)]"
            >
              <img 
                src={tech.url} 
                alt={tech.name} 
                className="w-12 h-12 md:w-14 md:h-14 mb-4 transition-all duration-500 ease-out opacity-100 grayscale-0 md:opacity-40 md:grayscale group-hover:grayscale-0 group-hover:opacity-100" 
              />
              
              <span className="font-bold text-sm transition-colors duration-300 text-[#673ab7] dark:text-white md:text-gray-500 md:dark:text-gray-400 group-hover:text-[#673ab7] dark:group-hover:text-white">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}