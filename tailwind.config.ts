import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Driven by --brand-* CSS variables so the ramp can be re-pointed
        // per company (see src/lib/theme.ts) without touching every
        // component that already uses bg-brand-600 / text-brand-700 / etc.
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
        },
        // Elevated panel background (cards, header) — plain white on the
        // light theme.
        surface: "#ffffff",
        // Dialog/card boxes: white background with brand-coloured text and
        // buttons (see src/lib/theme.ts and the .card-themed rules in
        // globals.css that apply these on top of the existing slate/brand
        // utility classes already used throughout the app's forms).
        "card-text": "rgb(var(--card-text) / <alpha-value>)",
        "button-bg": "rgb(var(--button-bg) / <alpha-value>)",
        "button-bg-hover": "rgb(var(--button-bg-hover) / <alpha-value>)",
        // Standard Tailwind slate scale (light theme) — no override needed;
        // bg-slate-50 is a light page background, text-slate-900 is dark text.
      },
    },
  },
  plugins: [],
};
export default config;
