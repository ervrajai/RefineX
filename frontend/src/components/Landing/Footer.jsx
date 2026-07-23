import React from "react";
import { motion } from "framer-motion";
import logoImg from "../../assets/logo/refinex_logo.png";

// --- 100% CRASH-PROOF INLINE SVG ICONS ---
const Github = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Twitter = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const BookOpen = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const linkVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// --- DATA ---
const footerData = {
  sections: [
    { title: "Product", links: ["Data Cleaning", "ML Training", "Visualizations"] },
    { title: "Resources", links: ["Documentation", "Sample Datasets", "GitHub"] },
    { title: "Legal", links: ["Privacy Policy", "Terms of Service"] },
  ],
  social: [
    { 
      href: "#", 
      label: "Twitter", 
      icon: <Twitter className="w-4 h-4" />,
      // Added explicit dark:hover classes for Twitter Blue
      hoverClass: "hover:bg-[#1DA1F2] hover:border-[#1DA1F2] hover:text-white dark:hover:bg-[#1DA1F2] dark:hover:border-[#1DA1F2] dark:hover:text-white" 
    },
    { 
      href: "https://github.com/Pranay0412/RefineX", 
      label: "GitHub", 
      icon: <Github className="w-4 h-4" />,
      // GitHub remains the same (White in dark mode, Black in light mode)
      hoverClass: "hover:bg-[#181717] hover:border-[#181717] hover:text-white dark:hover:bg-white dark:hover:border-white dark:hover:text-black" 
    },
    { 
      href: "#", 
      label: "LinkedIn", 
      icon: <Linkedin className="w-4 h-4" />,
      // Added explicit dark:hover classes for LinkedIn Blue
      hoverClass: "hover:bg-[#0A66C2] hover:border-[#0A66C2] hover:text-white dark:hover:bg-[#0A66C2] dark:hover:border-[#0A66C2] dark:hover:text-white" 
    },
  ],
  subtitle: "Turn raw data into actionable intelligence.",
  copyright: `© ${new Date().getFullYear()} RefineX Team. Made in Ahmedabad.`,
};

// --- REUSABLE NAVIGATION COLUMN ---
const NavSection = ({ title, links, index }) => (
  <motion.div variants={itemVariants} custom={index} className="flex flex-col gap-3">
    <motion.h3
      initial={{ opacity: 0, y: -10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
      className="mb-2 uppercase text-slate-500 dark:text-zinc-400 text-xs font-black tracking-widest"
    >
      {title}
    </motion.h3>
    {links.map((link, linkIndex) => (
      <motion.a
        key={linkIndex}
        variants={linkVariants}
        custom={linkIndex}
        href={link === "GitHub" ? "https://github.com/Pranay0412/RefineX" : "#"}
        target={link === "GitHub" ? "_blank" : "_self"}
        rel="noopener noreferrer"
        whileHover={{ x: 5, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        className="text-slate-600 dark:text-zinc-400 hover:text-[#673ab7] dark:hover:text-[#8B5CF6] transition-colors duration-300 font-sans text-sm font-medium w-max group"
      >
        <span className="relative pb-0.5">
          {link}
          <motion.span
            className="absolute bottom-0 left-0 h-[2px] bg-[#673ab7] rounded-full"
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.3 }}
          />
        </span>
      </motion.a>
    ))}
  </motion.div>
);

// --- MAIN FOOTER ---
export default function Footer() {
  return (
    <footer className="w-full px-4 pt-20 pb-12 overflow-hidden bg-white dark:bg-black">
      
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
        className="relative max-w-6xl mx-auto w-full"
      >
        {/* Clean, Flat Floating Glassmorphism Container Card */}
        <div className="relative z-10 bg-white dark:bg-zinc-900/90 backdrop-blur-2xl border border-slate-200 dark:border-zinc-800 rounded-[32px] p-8 md:p-12 flex flex-col shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden">
          
          <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none z-0 flex justify-center items-end overflow-hidden h-full">
            <span className="text-[12rem] sm:text-[16rem] md:text-[20rem] font-black tracking-tighter text-slate-100/70 dark:text-zinc-800/30 uppercase leading-none transform translate-y-[20%]">
              Refine<span className="text-purple-500/10 dark:text-purple-500/10">X</span>
            </span>
          </div>


          {/* Upper Info Grid */}
          <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
            
            {/* Branding Column */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6 max-w-sm">
              <div className="flex items-center gap-3">
                <img 
                  src={logoImg} 
                  alt="RefineX Logo" 
                  className="w-10 h-10 object-cover rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800" 
                />
                <span className="font-display text-2xl font-black tracking-wider text-slate-900 dark:text-white">
                  Refine<span className="text-[#673ab7] font-sans">X</span>
                </span>
              </div>
              
              <p className="text-slate-600 dark:text-zinc-400 text-sm font-medium leading-relaxed">
                {footerData.subtitle}
              </p>

              {/* High-End Split Actions */}
              <div className="flex flex-wrap gap-3 mt-2">
                {/* GitHub CTA */}
                <a 
                  href="https://github.com/Pranay0412/RefineX" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-xl transition-all duration-200 group"
                >
                  <Github className="w-5 h-5 text-slate-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide leading-none mb-0.5">Open Source</span>
                    <span className="text-[14px] font-black text-slate-800 dark:text-zinc-100 leading-none">GitHub</span>
                  </div>
                </a>

                {/* Documentation CTA */}
                <a 
                  href="#" 
                  className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#673ab7]/10 dark:bg-[#673ab7]/20 hover:bg-[#673ab7]/20 dark:hover:bg-[#673ab7]/30 border border-[#673ab7]/20 dark:border-[#673ab7]/40 rounded-xl transition-all duration-200 group"
                >
                  <BookOpen className="w-5 h-5 text-[#673ab7] dark:text-[#9373d1]" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold text-[#673ab7]/70 dark:text-[#9373d1]/80 uppercase tracking-wide leading-none mb-0.5">Read The</span>
                    <span className="text-[14px] font-black text-[#673ab7] dark:text-[#b49ced] leading-none">Docs</span>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* Navigation Context Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 w-full lg:w-auto">
              {footerData.sections.map((section, index) => (
                <NavSection key={section.title} title={section.title} links={section.links} index={index} />
              ))}
            </div>
          </div>

          {/* Lower Metadata Row */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col-reverse md:flex-row items-center justify-between mt-12 pt-6 relative z-10 gap-6"
          >
            {/* Attribution */}
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 text-center md:text-left">
              {footerData.copyright}
            </p>

            {/* Micro Interaction Social Links */}
            <div className="flex items-center gap-3">
              {footerData.social.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  title={social.label}
                  // Removed the whileHover completely so it stays still
                  whileTap={{ scale: 0.9 }}
                  // Replaced the hardcoded purple with `${social.hoverClass}`
                  className={`w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-400 transition-colors duration-300 shadow-sm ${social.hoverClass}`}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

        </div>
      </motion.div>
    </footer>
  );
}