import React from "react";

function Technologies() {
  const technologies = [
    {
      name: "Pandas",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg",
    },
    {
      name: "NumPy",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg",
    },
    {
      name: "Scikit-Learn",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Scikit_learn_logo_small.svg",
    },
    {
      name: "Matplotlib",
      // Updated to a reliable, direct SVG icon source that won't block access
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/84/Matplotlib_icon.svg",
    },
    {
      name: "Plotly",
      logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/plotly/plotly-original.svg",
    },
    {
      name: "Seaborn",
      logo: "https://raw.githubusercontent.com/mwaskom/seaborn/master/doc/_static/logo-mark-lightbg.png",
    },
  ];

  return (
    <section id="library" className="py-24 px-6 border-t border-gray-200 dark:border-gray-800 text-center">
      <h2 className="text-3xl font-bold mb-4 text-black dark:text-white tracking-tight">
        Powered by standard libraries
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
        The open-source ecosystem driving RefineX.
      </p>
      
      {/* 
        Responsive Grid: 
        - Mobile: 2 columns (grid-cols-2)
        - Tablets: 3 columns (sm:grid-cols-3)
        - Large Screens: 6 columns, forcing 1 line (lg:grid-cols-6)
        - max-w-6xl ensures it spans wide enough on big screens 
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
        {technologies.map((item) => (
          <div 
            key={item.name} 
            // 'aspect-square' enforces a perfect 1:1 ratio automatically.
            // No transforms are used—only simple background/border color transitions.
            className="aspect-square flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-[#222222] hover:border-primary dark:hover:border-primary"
          >
            <img 
              src={item.logo} 
              alt={`${item.name} logo`} 
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain mb-4 mix-blend-multiply dark:mix-blend-normal dark:brightness-110" 
            />
            <span className="font-medium text-black dark:text-white text-sm sm:text-base tracking-wide">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Technologies;