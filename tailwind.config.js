/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'from-stone-100',
    'to-stone-200',
    'from-teal-700',
    'to-teal-800',
    'from-slate-100',
    'from-emerald-50',
    'to-teal-100',
    'from-amber-50',
    'to-stone-100',
    'from-zinc-800',
    'to-stone-900'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
