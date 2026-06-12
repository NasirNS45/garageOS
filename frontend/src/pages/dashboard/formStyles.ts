export const inputClass =
  "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition";

/** Returns the appropriate input class with red styling when there is an error. */
export function fieldClass(hasError: boolean) {
  return hasError
    ? "w-full bg-slate-50 dark:bg-slate-900 border border-red-400 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition"
    : inputClass;
}
