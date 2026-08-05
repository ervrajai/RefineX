import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function FeatureCard({ title, steps, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="w-full h-[420px] relative border border-solid border-lightBorder/50 dark:border-white/10 rounded-2xl overflow-hidden group hover:shadow-[0_0_30px_rgba(103,58,183,0.3)] transition-all duration-300 cursor-pointer"
    >
      
      {/* Background Layer 1: Solid Brand color peering through the cut corners */}
      <div className="w-full h-full p-1 absolute bg-[#673ab7]">
        <div className="w-full h-full rounded-xl rounded-tr-[100px] rounded-br-[40px] bg-white dark:bg-[#212121]"></div>
      </div>

      {/* Background Layer 2: Spinning Ambient Orb */}
      <div className="w-full h-full flex items-center justify-center relative rounded-2xl">
        <div
          className="w-56 h-56 rounded-full bg-gradient-to-tr from-[#673ab7] to-[#c084fc] animate-spin opacity-40 dark:opacity-60 blur-2xl"
          style={{ animationDuration: "12s" }}
        ></div>
      </div>

      {/* Background Layer 3: Glass Overlay */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-2xl rounded-2xl"></div>

      {/* Foreground Content Layer */}
      <div className="w-full h-full p-2.5 flex justify-between absolute inset-0">
        
        {/* Left Column (Main Content) - Increased width to 80% */}
        <div className="w-[80%] p-5 md:p-6 flex flex-col rounded-xl backdrop-blur-lg bg-white/70 dark:bg-gray-50/5 border border-lightBorder/30 dark:border-white/5 text-black dark:text-gray-200 shadow-sm">
          <span className="text-2xl font-bold tracking-tight mb-4 text-black dark:text-white leading-tight">
            {title}
          </span>
          
          {/* Vertical Timeline for Steps */}
          <ul className="space-y-4 relative border-l-2 border-gray-300 dark:border-gray-700 ml-2 mt-2 flex-1">
            {steps.map((step, idx) => (
              <li key={idx} className="pl-5 relative">
                {/* Timeline Dot (Last one is glowing brand color) */}
                <div 
                  className={`absolute w-2.5 h-2.5 rounded-full -left-[5.5px] top-1 border-2 border-white dark:border-[#111111] ${
                    idx === steps.length - 1 
                      ? 'bg-[#673ab7] shadow-[0_0_10px_rgba(103,58,183,0.8)] border-none -left-[5px]' 
                      : 'bg-gray-400 dark:bg-gray-500'
                  }`}
                ></div>
                <h4 className="font-bold text-sm text-black dark:text-white leading-none mb-1">
                  {step.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug pr-2">
                  {step.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column (Controls & Tags) */}
        <div className="h-full pt-3 pb-2 pr-1 flex flex-col items-end text-gray-400 dark:text-white/40">
          <span className="text-[10px] uppercase font-bold tracking-widest leading-[12px]">RefineX</span>
          <span className="text-[10px] uppercase font-bold tracking-widest leading-[13px]">Engine</span>
          
          {/* Circular Arrow Button */}
          <div className="w-10 h-10 mt-auto flex items-center justify-center rounded-full backdrop-blur-lg bg-gray-200/50 dark:bg-gray-50/10 cursor-pointer transition-all duration-300 group-hover:bg-[#673ab7] group-hover:text-white dark:group-hover:bg-[#673ab7] dark:group-hover:text-white text-gray-700 dark:text-gray-300 border border-lightBorder/50 dark:border-white/10 group-hover:scale-110">
            <span className="font-serif">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 12 12"
                className="w-5 h-5"
              >
                <g fill="none">
                  <path
                    d="M4.646 2.146a.5.5 0 0 0 0 .708L7.793 6L4.646 9.146a.5.5 0 1 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"
                    fill="currentColor"
                  ></path>
                </g>
              </svg>
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
}


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Time delay between each card appearing
    },
  },
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30 // Starts 30px lower down
  },
  visible: { 
    opacity: 1, 
    y: 0, // Floats up to its natural position
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15 
    } 
  },
};

export default function Features() {
  const navigate = useNavigate();

  const cleaningSteps = [
    { name: "Upload Dataset", desc: "Import your raw CSV safely." },
    { name: "Auto-Detect Issues", desc: "Find nulls, duplicates & outliers instantly." },
    { name: "Resolve & Export", desc: "Apply fixes and download pristine data." }
  ];

  const trainingSteps = [
    { name: "Select Target", desc: "Choose the column you want to predict." },
    { name: "Train Algorithm", desc: "Run Regression or Random Forest models." },
    { name: "Evaluate & Save", desc: "Check accuracy scores and download the .pkl file." }
  ];

  const visualizationSteps = [
    { name: "Pick Data Points", desc: "Select X, Y, and Z axes from your dataset." },
    { name: "Generate Chart", desc: "Create Plotly, Seaborn & Matplotlib heatmaps, bar, line, or 3D scatter graphs." },
    { name: "Export Assets", desc: "Download interactive graph images and ready-to-run Python code." }
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-white dark:bg-[#0F0F0F] w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 tracking-tight">
            Master Every Feature
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Dedicated pipelines designed to handle data exactly how you want. Clean, train, and visualize instantly.
          </p>
        </div>

        {/* Animated Feature Cards Grid Container */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
        >
          <motion.div variants={cardVariants}>
            <FeatureCard
              title="Data Cleaning"
              steps={cleaningSteps}
              onClick={() => navigate("/clean")}
            />
          </motion.div>
          
          <motion.div variants={cardVariants}>
            <FeatureCard
              title="Model Training"
              steps={trainingSteps}
              onClick={() => navigate("/signup", { state: { message: "Sign up required: Please create a free account first to access ML Model Training features." } })}
            />
          </motion.div>
          
          <motion.div variants={cardVariants}>
            <FeatureCard
              title="Visualization"
              steps={visualizationSteps}
              onClick={() => navigate("/signup", { state: { message: "Sign up required: Please create a free account first to access Data Visualization features." } })}
            />
          </motion.div>
        </motion.div>
        
      </div>
    </section>
  );
}