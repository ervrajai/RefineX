// src/components/Landing/About.jsx
import { motion } from "framer-motion";
import React from "react";

import pranayImg from "../../assets/images/pranay_img.png";
import vrajImg from "../../assets/images/vraj_img.png";

// Reusable Team Card Component
const TeamCard = ({ name, role, imgPath, githubLink, linkedinLink }) => {
  return (
    <div className="group relative w-[240px] h-[320px] mx-auto bg-white dark:bg-[#111111] border-2 border-black dark:border-white shadow-[5px_5px_#673ab7] dark:shadow-[5px_5px_#673ab7] rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_#673ab7]">
      
      {/* Card Photo */}
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-black dark:border-white transition-transform duration-300 group-hover:scale-110 mb-4 bg-gray-200 dark:bg-gray-800">
        <img 
          src={imgPath} 
          alt={name} 
          className="w-full h-full object-cover" 
        />
      </div>

      {/* Card Title & Role */}
      <div className="text-center font-sans">
        <h3 className="text-xl font-bold text-black dark:text-white tracking-wide">
          {name}
        </h3>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mt-1">
          {role}
        </span>
      </div>

      <div className="flex justify-center items-center gap-4 overflow-hidden transition-all duration-300 h-8 opacity-100 mt-4 md:h-0 md:opacity-0 md:mt-0 group-hover:h-8 group-hover:opacity-100 group-hover:mt-4">
        
        {/* GitHub Button */}
        <a 
          href={githubLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-7 h-7 text-black dark:text-white hover:text-[#673ab7] dark:hover:text-[#c084fc] transition-all"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>

        {/* LinkedIn Button */}
        <a 
          href={linkedinLink}
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-7 h-7 text-black dark:text-white hover:text-[#673ab7] dark:hover:text-[#c084fc] transition-all"
        >
           <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </a>

      </div>
    </div>
  );
};

export default function About() {
  return (
    <section id="about" className="py-20 md:py-28 bg-white dark:bg-black w-full">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 tracking-tight">
            Meet the Team
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            The developers building RefineX.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 md:gap-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <TeamCard 
              name="Jain Pranay" 
              role="Frontend Developer" 
              imgPath={pranayImg} 
              githubLink="https://github.com/Pranay0412" 
              linkedinLink="https://www.linkedin.com/in/pranay-jain-d4127"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <TeamCard 
              name="Vraj Patel" 
              role="Backend Developer" 
              imgPath={vrajImg} 
              githubLink="https://github.com/ervrajai/" 
              linkedinLink="https://www.linkedin.com/in/vraj-patel-eng"
            />
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}