import { FiDatabase, FiCpu, FiBarChart2 } from "react-icons/fi";

function Features() {
  const features = [
    {
      icon: <FiDatabase size={20} />,
      title: "Data Cleaning",
      desc: "Import your raw CSV, detect nulls or duplicates, and export pristine data ready for analysis."
    },
    {
      icon: <FiCpu size={20} />,
      title: "Model Training",
      desc: "Select a target column and instantly train Regression or Random Forest models with high accuracy."
    },
    {
      icon: <FiBarChart2 size={20} />,
      title: "Visualization",
      desc: "Generate professional Bar, Line, Scatter, or Pie graphs and export the Python code instantly."
    }
  ];

  return (
    <section id="features" className="py-24 px-6 border-t border-border-gray dark:border-gray-800 bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-black dark:text-white tracking-tight">Master Every Feature</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Dedicated pipelines designed to handle data exactly how you want.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="border border-border-gray dark:border-gray-800 rounded-xl p-8 bg-gray-50 dark:bg-[#121212] hover:border-primary dark:hover:border-primary transition-colors">
              <div className="w-10 h-10 bg-white dark:bg-[#1f1f1f] border border-border-gray dark:border-gray-700 text-primary flex items-center justify-center rounded-lg mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black dark:text-white">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;