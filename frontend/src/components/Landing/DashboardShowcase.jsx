import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function DashboardShowcase() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"]
  });

  // Maps scroll progress (0 to 1) to rotateX (25deg to 0deg) and scale (0.85 to 1)
  const rotateX = useTransform(scrollYProgress, [0, 1], [25, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);

  return (
    <section id="workflow" className="py-20 md:py-28 bg-white dark:bg-black w-full">
      <div id="dashboard" ref={containerRef} className="w-full max-w-5xl mx-auto z-20 relative px-4 pb-20 pt-16" style={{ perspective: "1200px" }}>
        <motion.div
          style={{ rotateX, scale, transformOrigin: "top center" }}
          className="w-full rounded-xl border border-lightBorder/50 dark:border-brand/30 bg-[#ffffff]/50 dark:bg-[#000000]/50 backdrop-blur-sm p-1.5 md:p-2 shadow-2xl mx-auto"
        >
          <div className="bg-white dark:bg-black rounded-lg aspect-[16/9] w-full flex items-center justify-center border border-lightBorder dark:border-gray-800 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(103,58,183,0.15)]">
            
            <img
              src="https://placehold.co/1200x675/1e1e1e/673ab7?text=RefineX+Dashboard+Preview"
              alt="Dashboard Preview"
              className="w-full h-full object-cover"
            />
            
            <div className="absolute top-0 left-0 w-full h-6 md:h-8 bg-white dark:bg-black flex items-center px-3 md:px-4 gap-1.5 md:gap-2 border-b border-lightBorder dark:border-gray-800">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400"></div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}