import { Link } from "react-router-dom";

function AuthLayout({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="mb-8 text-center">
            <Link to="/" className="text-2xl font-semibold tracking-[0.08em] text-slate-950">
              Refinex
            </Link>
            <h1 className="mt-6 text-2xl font-semibold text-slate-950">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          </div>

          {children}

          {footerText && (
            <p className="mt-7 text-center text-sm text-slate-500">
              {footerText}{" "}
              <Link to={footerLink} className="font-semibold text-teal-700 hover:text-teal-800">
                {footerLabel}
              </Link>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default AuthLayout;
