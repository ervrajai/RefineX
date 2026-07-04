import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="py-20 md:py-24 bg-[#ffffff] dark:bg-[#000000] w-full">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#000000] dark:text-[#ffffff] mb-4">Meet the Team</h2>
          <p className="text-gray-600 dark:text-gray-400">The developers building RefineX.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-center">
          <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center">
            <a href="https://github.com/Pranay0412" target="_blank" rel="noopener noreferrer" className="w-36 h-36 md:w-40 md:h-40 rounded-full border-4 border-transparent hover:border-brand transition-colors p-1 mb-4 block">
              <img src="/assets/pranay_img.png" alt="Jain Pranay" className="w-full h-full rounded-full object-cover bg-gray-200" />
            </a>
            <h3 className="text-xl font-bold text-[#000000] dark:text-[#ffffff]">Jain Pranay</h3>
            <p className="text-brand font-medium">Frontend Developer</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center">
            <a href="https://github.com/ervrajai/" target="_blank" rel="noopener noreferrer" className="w-36 h-36 md:w-40 md:h-40 rounded-full border-4 border-transparent hover:border-brand transition-colors p-1 mb-4 block">
              <img src="/assets/vraj_img.png" alt="Vraj Patel" className="w-full h-full rounded-full object-cover bg-gray-200" />
            </a>
            <h3 className="text-xl font-bold text-[#000000] dark:text-[#ffffff]">Vraj Patel</h3>
            <p className="text-brand font-medium">Backend Developer</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}