import { useState } from "react";
import { FiUploadCloud, FiFile } from "react-icons/fi";

function Hero() {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFileName(file.name);
  };

  return (
    <section id="home" className="relative py-32 px-6 overflow-hidden bg-white dark:bg-black w-full">
      
      {/* ── Hero gradient orb animations injected directly ── */}
      <style>{`
        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          25% { transform: translate(8%, -12%) scale(1.08); }
          50% { transform: translate(-5%, 6%) scale(0.96); }
          75% { transform: translate(12%, 4%) scale(1.04); }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          25% { transform: translate(-10%, 8%) scale(1.06); }
          50% { transform: translate(7%, -10%) scale(1.1); }
          75% { transform: translate(-4%, 5%) scale(0.97); }
        }
        @keyframes orbDrift3 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(6%, 10%) scale(1.05); }
          66% { transform: translate(-9%, -6%) scale(0.98); }
        }
        @keyframes orbDrift4 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          40% { transform: translate(-7%, -9%) scale(1.07); }
          80% { transform: translate(10%, 6%) scale(0.95); }
        }
        @keyframes heroFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.88; }
        }

        .hero-orb-1 { animation: orbDrift1 9s ease-in-out infinite; }
        .hero-orb-2 { animation: orbDrift2 12s ease-in-out infinite; }
        .hero-orb-3 { animation: orbDrift3 10s ease-in-out infinite; }
        .hero-orb-4 { animation: orbDrift4 14s ease-in-out infinite; }
        .hero-bg { animation: heroFade 8s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .hero-orb-1, .hero-orb-2, .hero-orb-3, .hero-orb-4, .hero-bg {
            animation: none;
          }
        }

        .hero-overlay-light {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 12%, rgba(255, 255, 255, 1) 88%);
        }
        .hero-overlay-dark {
          background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 12%, rgba(0, 0, 0, 1) 88%);
        }
      `}</style>

      {/* ░░ Animated multi-radial gradient background ░░ */}
      <div className="hero-bg absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        {/* Top-left: primary brand violet */}
        <div className="hero-orb-1 absolute top-[-25%] left-[-5%] w-[420px] h-[420px] md:w-[680px] md:h-[680px] rounded-full blur-[110px] bg-[#673ab7]/30 dark:bg-[#673ab7]/45"></div>

        {/* Top-right: soft indigo accent */}
        <div className="hero-orb-2 absolute top-[-18%] right-[-8%] w-[320px] h-[320px] md:w-[540px] md:h-[540px] rounded-full blur-[130px] bg-[#7c3aed]/20 dark:bg-[#7c3aed]/35"></div>

        {/* Center-right: deep violet */}
        <div className="hero-orb-3 absolute top-[30%] right-[5%] w-[220px] h-[220px] md:w-[380px] md:h-[380px] rounded-full blur-[100px] bg-[#4a1d96]/15 dark:bg-[#4a1d96]/30"></div>

        {/* Center-left: pink-violet bleed */}
        <div className="hero-orb-4 absolute top-[20%] left-[5%] w-[200px] h-[200px] md:w-[340px] md:h-[340px] rounded-full blur-[120px] bg-[#9333ea]/15 dark:bg-[#9333ea]/25"></div>

        {/* Fade-to-bg overlay — light mode */}
        <div className="hero-overlay-light absolute inset-0 dark:hidden"></div>
        {/* Fade-to-bg overlay — dark mode */}
        <div className="hero-overlay-dark absolute inset-0 hidden dark:block"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
          Analyze, clean and train datasets instantly.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Our automated pipeline allows you to upload, visualize, and apply machine learning models to your data with zero coding required.
        </p>
        
        <div className="flex justify-center">
          <label className="w-full max-w-md aspect-video border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-md shadow-xl flex flex-col justify-center items-center p-8 rounded-2xl cursor-pointer hover:border-[#673ab7] dark:hover:border-[#673ab7] transition-colors group relative overflow-hidden">
            
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".csv, .xlsx, .json"
            />
            
            {fileName ? (
              <div className="flex flex-col items-center text-center z-10">
                <FiFile size={32} className="text-[#673ab7] mb-3" />
                <h3 className="font-semibold text-black dark:text-white mb-1 truncate max-w-[250px]">
                  {fileName}
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">Click to replace file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center z-10 pointer-events-none">
                <FiUploadCloud size={32} className="text-gray-500 dark:text-gray-400 group-hover:text-[#673ab7] dark:group-hover:text-[#673ab7] mb-3 transition-colors" />
                <h3 className="font-medium text-black dark:text-white mb-1">Upload a dataset</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">CSV, EXCEL, or JSON up to 50MB</p>
              </div>
            )}
          </label>
        </div>
      </div>
    </section>
  );
}

export default Hero;