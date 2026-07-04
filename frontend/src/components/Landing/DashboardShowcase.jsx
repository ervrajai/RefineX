import { FiCheckCircle, FiActivity, FiCpu } from "react-icons/fi";

function DashboardShowcase() {
  return (
    <section id="dashboard" className="py-24 px-6 border-t border-border-gray dark:border-gray-800 bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        
        <div>
          <h2 className="text-3xl font-bold mb-4 text-black dark:text-white tracking-tight">
            Interactive dashboard at a glance
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Track cleaning progress, model performance, and data trends without switching tools.
          </p>
          
          <ul className="space-y-4 text-gray-800 dark:text-gray-300 font-medium">
            <li className="flex items-center gap-3"><FiCheckCircle className="text-primary"/> Live status monitoring</li>
            <li className="flex items-center gap-3"><FiActivity className="text-primary"/> Visual summaries for datasets</li>
            <li className="flex items-center gap-3"><FiCpu className="text-primary"/> Fast export of trained models</li>
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-[#121212] border border-border-gray dark:border-gray-800 rounded-xl p-8">
          <div className="flex justify-between font-semibold mb-4 text-black dark:text-white">
            <span>Tasks completed</span>
            <span className="text-primary">82%</span>
          </div>
          
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-primary w-[82%] transition-all duration-500"></div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-[#1a1a1a] border border-border-gray dark:border-gray-800 rounded-lg text-sm">
              <strong className="text-black dark:text-white">Validation checks:</strong> <span className="text-gray-600 dark:text-gray-400 ml-1">120 clean logs detected</span>
            </div>
            <div className="p-4 bg-white dark:bg-[#1a1a1a] border border-border-gray dark:border-gray-800 rounded-lg text-sm">
              <strong className="text-black dark:text-white">Model accuracy:</strong> <span className="text-gray-600 dark:text-gray-400 ml-1">94.2% Random Forest</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default DashboardShowcase;