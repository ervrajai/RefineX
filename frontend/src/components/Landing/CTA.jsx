import { FiArrowRight } from "react-icons/fi";

function CTA() {
  return (
    <section className="py-24 px-6 bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto bg-primary dark:bg-primary-dark rounded-2xl p-12 md:p-16 text-center text-white">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
          Ready to refine your workflow?
        </h2>
        <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          Launch your first cleaning pipeline and turn raw data into reliable machine learning results instantly.
        </p>
        <a href="#" className="inline-flex items-center gap-2 bg-white text-primary hover:bg-gray-50 font-semibold px-8 py-4 rounded-lg transition-colors">
          Get Started Free <FiArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}

export default CTA;