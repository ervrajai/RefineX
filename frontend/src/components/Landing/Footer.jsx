import { FiDatabase } from "react-icons/fi";

function Footer() {
  return (
    <footer className="border-t border-border-gray dark:border-gray-800 bg-gray-50 dark:bg-[#121212] pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex justify-center items-center w-7 h-7 bg-primary rounded text-white">
                <FiDatabase size={14} />
              </div>
              <span className="font-bold text-lg tracking-wide text-black dark:text-white">RefineX</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
              Your complete platform for data cleaning, visualization, and machine learning. Built for students and professionals.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <h4 className="font-semibold text-black dark:text-white mb-1">Product</h4>
            <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">Data Cleaning</a>
            <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">ML Training</a>
            <a href="#features" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">Visualizations</a>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <h4 className="font-semibold text-black dark:text-white mb-1">Resources</h4>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">Sample Datasets</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">GitHub</a>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <h4 className="font-semibold text-black dark:text-white mb-1">Legal</h4>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors">Terms of Service</a>
          </div>

        </div>

        <div className="border-t border-border-gray dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
          <span>&copy; {new Date().getFullYear()} RefineX Team. All rights reserved.</span>
          <span>Made in Ahmedabad.</span>
        </div>
        
      </div>
    </footer>
  );
}

export default Footer;