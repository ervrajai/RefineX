// src/components/Landing/Footer.jsx
import React from "react";
import logoImg from "../../assets/logo/refinex_logo.png"; 

function Footer() {
  const linkHoverClass = "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:font-bold hover:drop-shadow-[0_0_8px_rgba(0,0,0,0.4)] dark:hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300 hover:translate-x-1 w-max";

  return (
    <footer className="border-t border-lightBorder/50 dark:border-white/10 bg-white dark:bg-black pt-20 pb-8 px-6 w-full">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Section: Branding & Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-12 mb-16">
          
          {/* Brand Info */}
          <div className="col-span-2">
            <a href="#home" className="flex items-center gap-2 mb-6 w-max">
              <img 
                src={logoImg} 
                alt="RefineX Logo" 
                className="w-8 h-8 md:w-9 md:h-9 object-cover rounded-xl shadow-sm"
              />
              <span className="font-display text-xl md:text-2xl font-black tracking-wider inline-flex items-center text-black dark:text-white">
                Refine<span className="font-sans text-[#673ab7] text-2xl md:text-3xl ml-0.5 leading-none">X</span>
              </span>
            </a>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
              Your complete platform for data cleaning, visualization, and machine learning. Built for students and professionals.
            </p>
          </div>

          {/* Links Column 1: Product */}
          <div className="flex flex-col gap-4 text-sm font-medium">
            <h4 className="font-bold text-black dark:text-white mb-2 uppercase tracking-widest text-xs">Product</h4>
            <a href="#workflow" className={linkHoverClass}>Data Cleaning</a>
            <a href="#workflow" className={linkHoverClass}>ML Training</a>
            <a href="#workflow" className={linkHoverClass}>Visualizations</a>
          </div>

          {/* Links Column 2: Resources */}
          <div className="flex flex-col gap-4 text-sm font-medium">
            <h4 className="font-bold text-black dark:text-white mb-2 uppercase tracking-widest text-xs">Resources</h4>
            <a href="#" className={linkHoverClass}>Documentation</a>
            <a href="#" className={linkHoverClass}>Sample Datasets</a>
            <a href="https://github.com/Pranay0412/RefineX" target="_blank" rel="noopener noreferrer" className={linkHoverClass}>GitHub</a>
          </div>

          {/* Links Column 3: Legal */}
          <div className="flex flex-col gap-4 text-sm font-medium">
            <h4 className="font-bold text-black dark:text-white mb-2 uppercase tracking-widest text-xs">Legal</h4>
            <a href="#" className={linkHoverClass}>Privacy Policy</a>
            <a href="#" className={linkHoverClass}>Terms of Service</a>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-lightBorder/50 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-500">
          <span>&copy; {new Date().getFullYear()} RefineX Team. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            Made in <span className="font-bold text-black dark:text-white">Ahmedabad</span>.
          </span>
        </div>
        
      </div>
    </footer>
  );
}

export default Footer;