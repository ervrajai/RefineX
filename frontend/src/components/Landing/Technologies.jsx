import { motion } from "framer-motion";

const techs = [
  { name: "Pandas", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg" },
  { name: "NumPy", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/numpy/numpy-original.svg" },
  { name: "Scikit-Learn", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/scikitlearn/scikitlearn-original.svg" },
  { name: "Matplotlib", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/matplotlib/matplotlib-original.svg" },
  { name: "Plotly", url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/plotly/plotly-original.svg" }
];

export default function Technologies() {
  return (
    <section id="library" className="py-16 md:py-24 bg-[#ffffff] dark:bg-[#000000] w-full">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#000000] dark:text-[#ffffff]">Powered By The Best</h2>
          <p className="text-gray-600 dark:text-gray-400">The frameworks and libraries driving RefineX.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {techs.map((tech) => (
            <motion.div
              key={tech.name}
              whileHover={{ scale: 1.05, y: -5 }}
              className="flex flex-col w-[140px] items-center justify-center p-6 bg-[#ffffff] dark:bg-[#121212] border border-lightBorder dark:border-gray-800 rounded-2xl hover:border-brand cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(103,58,183,0.3)] transition-colors duration-300"
            >
              <img src={tech.url} alt={tech.name} className="w-12 h-12 md:w-14 md:h-14 mb-3 dark:invert opacity-80" />
              <span className="font-bold text-sm text-[#000000] dark:text-[#ffffff]">{tech.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}