import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

function SpotlightCard({ children }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="group relative rounded-2xl overflow-hidden border border-lightBorder dark:border-gray-800 bg-[#ffffff] dark:bg-[#0d0d0d] hover:border-brand transition-colors duration-300 hover:shadow-[0_0_30px_rgba(103,58,183,0.15)]"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(103, 58, 183, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 p-8">
        {children}
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="workflow" className="py-20 bg-[#ffffff] dark:bg-[#000000] w-full">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#000000] dark:text-[#ffffff] mb-4">Master Every Feature</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Dedicated pipelines designed to handle data exactly how you want.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <SpotlightCard>
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Data Cleaning</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Find nulls, duplicates & outliers instantly and apply fixes.</p>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Model Training</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Run Regression or Random Forest models effortlessly.</p>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6">Visualization</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create beautiful graphs and export assets instantly.</p>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}