import React from "react";
import { motion } from "framer-motion";
import logoImg from "../../assets/logo/refinex_logo.png";

// Animation variants for reusability
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
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

const socialVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
    },
  },
};

const backgroundVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 2,
      ease: "easeOut",
    },
  },
};

// RefineX Footer Data
const footerData = {
  sections: [
    { title: "Product", links: ["Data Cleaning", "ML Training", "Visualizations"] },
    { title: "Resources", links: ["Documentation", "Sample Datasets", "GitHub"] },
    { title: "Legal", links: ["Privacy Policy", "Terms of Service"] },
  ],
  social: [
    { href: "#", label: "Twitter", icon: "𝕏" },
    { href: "https://github.com/Pranay0412/RefineX", label: "GitHub", icon: "G" },
    { href: "#", label: "LinkedIn", icon: "in" },
  ],
  title: "RefineX",
  subtitle: "Turn raw data into actionable intelligence.",
  copyright: `© ${new Date().getFullYear()} RefineX Team. Made in Ahmedabad.`,
};

// Reusable components
const NavSection = ({ title, links, index }) => (
  <motion.div variants={itemVariants} custom={index} className="flex flex-col gap-3">
    <motion.h3
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
      className="mb-3 uppercase text-gray-500 dark:text-gray-400 text-sm font-bold tracking-widest border-b border-lightBorder/50 dark:border-white/10 pb-2 hover:text-black dark:hover:text-white transition-colors duration-300"
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
        whileHover={{
          x: 8,
          transition: { type: "spring", stiffness: 300, damping: 20 },
        }}
        className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors duration-300 font-sans text-base font-medium group relative w-max mt-1"
      >
        <span className="relative">
          {link}
          <motion.span
            className="absolute -bottom-1 left-0 h-[2px] bg-[#673ab7]"
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.3 }}
          />
        </span>
      </motion.a>
    ))}
  </motion.div>
);

const SocialLink = ({ href, label, icon, index }) => (
  <motion.a
    variants={socialVariants}
    custom={index}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{
      scale: 1.15,
      rotate: 8,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    }}
    whileTap={{ scale: 0.9 }}
    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-[#673ab7] dark:hover:bg-[#673ab7] border border-lightBorder/50 dark:border-white/10 flex items-center justify-center transition-colors duration-300 group shadow-sm"
    aria-label={label}
  >
    <motion.span
      className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors duration-300"
      whileHover={{ scale: 1.1 }}
    >
      {icon}
    </motion.span>
  </motion.a>
);

export default function Footer() {
  return (
    <div className="relative h-[60vh]" style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}>
      <div className="relative h-[calc(100vh+60vh)] -top-[100vh]">
        <div className="h-[60vh] sticky top-[calc(100vh-60vh)]">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white dark:bg-black border-t border-lightBorder/50 dark:border-white/10 py-10 md:py-16 px-6 md:px-12 h-full w-full flex flex-col justify-between relative overflow-hidden"
          >
            <motion.div
              variants={backgroundVariants}
              className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-[#673ab7]/10 dark:bg-[#673ab7]/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              variants={backgroundVariants}
              className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            {/* Navigation Section */}
            <motion.div variants={containerVariants} className="relative z-10 max-w-7xl mx-auto w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 lg:gap-20 w-full">
                {footerData.sections.map((section, index) => (
                  <NavSection key={section.title} title={section.title} links={section.links} index={index} />
                ))}
              </div>
            </motion.div>

            {/* Footer Bottom Section (Giant Brand Text & Copyright) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
              className="flex flex-col md:flex-row justify-between items-start md:items-end relative z-10 gap-6 mt-10 max-w-7xl mx-auto w-full"
            >
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                  className="flex items-center gap-4 cursor-default"
                >
                  <img src={logoImg} alt="RefineX Logo" className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-2xl shadow-lg border border-lightBorder dark:border-white/10" />
                  <h1 className="text-6xl md:text-[8vw] lg:text-[7vw] leading-[0.8] font-black tracking-wider bg-gradient-to-br from-black via-gray-700 to-black/60 dark:from-white dark:via-gray-300 dark:to-white/60 bg-clip-text text-transparent font-display">
                    Refine<span className="text-[#673ab7] font-sans">X</span>
                  </h1>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="flex items-center gap-3 md:gap-4 mt-6"
                >
                  <motion.div
                    className="w-12 md:w-16 h-1 bg-gradient-to-r from-[#673ab7] to-purple-400 rounded-full"
                    animate={{ scaleX: [1, 1.2, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.5 }}
                    className="text-gray-600 dark:text-gray-400 text-sm md:text-base font-medium font-sans"
                  >
                    {footerData.subtitle}
                  </motion.p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                className="text-left md:text-right flex flex-col md:items-end"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 2, staggerChildren: 0.1 }}
                  className="flex gap-3 mb-4"
                >
                  {footerData.social.map((social, index) => (
                    <SocialLink
                      key={social.label}
                      href={social.href}
                      label={social.label}
                      icon={social.icon}
                      index={index}
                    />
                  ))}
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                  className="text-gray-500 dark:text-gray-500 text-xs md:text-sm font-medium"
                >
                  {footerData.copyright}
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}