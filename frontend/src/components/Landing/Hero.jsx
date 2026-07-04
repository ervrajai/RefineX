import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="home" className="relative pt-[100px] pb-20 md:pt-[120px] md:pb-24 px-4 overflow-hidden bg-[#ffffff] dark:bg-[#000000] w-full min-h-[80vh] flex flex-col items-center">
      
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ x: ["0%", "8%", "-5%", "12%", "0%"], y: ["0%", "-12%", "6%", "4%", "0%"] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-25%] left-[-5%] w-[420px] h-[420px] md:w-[680px] md:h-[680px] rounded-full blur-[110px] bg-[#673ab7]/30 dark:bg-[#673ab7]/45"
        />
        <motion.div
          animate={{ x: ["0%", "-10%", "7%", "-4%", "0%"], y: ["0%", "8%", "-10%", "5%", "0%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-18%] right-[-8%] w-[320px] h-[320px] md:w-[540px] md:h-[540px] rounded-full blur-[130px] bg-[#7c3aed]/20 dark:bg-[#7c3aed]/35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-black opacity-90 z-0"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-10 md:gap-12">
        <div className="flex flex-col gap-4 px-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#000000] dark:text-[#ffffff] leading-tight">
            Analyze, clean and train <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brandDark">datasets of any shape</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-600 dark:text-gray-400 font-medium">
            Our automated pipeline allows you to upload, visualize, and apply machine learning models to your data with zero coding required.
          </p>
        </div>

        {/* Premium Framer Motion Upload Button */}
        <motion.div 
          className="relative flex items-center justify-center w-[300px] h-[300px] cursor-pointer group"
          whileHover="hover"
        >
          {/* Background Glow */}
          <motion.div
            variants={{ hover: { scale: 1.62, opacity: 0.8 } }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-full bg-brand/20 blur-xl"
          />
          
          {/* Inner Circle */}
          <motion.label
            htmlFor="csv-upload"
            variants={{ hover: { scale: 1.05, borderColor: "rgba(103, 58, 183, 0.6)", boxShadow: "0 0 50px rgba(103, 58, 183, 0.2)" } }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative flex flex-col items-center justify-center text-center rounded-full w-[268px] h-[268px] bg-white dark:bg-[#0d0d0d] border-[1.5px] border-brand/15 z-10 cursor-pointer"
          >
            <motion.div 
              variants={{ hover: { scale: 1.1, boxShadow: "0 0 20px rgba(103, 58, 183, 0.35)" } }}
              className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-brand to-brandDark flex items-center justify-center mb-4"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </motion.div>
            <p className="font-bold text-sm text-black dark:text-white mb-1">Click or drag & drop<br/>your files here</p>
            <p className="text-xs font-medium text-brand mb-2">Or select a folder</p>
            <p className="text-[10px] text-gray-400">CSV · Excel · JSON · Dataset<br/>Up to 50 MB free</p>
            <input id="csv-upload" type="file" className="hidden" accept=".csv,.xlsx,.xls,.json" />
          </motion.label>
        </motion.div>
      </div>
    </section>
  );
}