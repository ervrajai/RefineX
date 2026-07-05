function FormField({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className={`mt-2 w-full rounded-md border bg-white px-3 py-3 text-sm text-slate-950 outline-none transition focus:ring-2 ${
          error
            ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
            : "border-slate-200 focus:border-teal-600 focus:ring-teal-100"
        }`}
      />
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export default FormField;
