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
        // Elevated panel background (cards, header) — sits one step lighter
        // than the page background below for a subtle dark-theme lift.
        surface: "#121722",
        // App-wide dark theme: re-pointing the neutral scale here means every
        // existing bg-slate-50 / text-slate-900 / border-slate-200 / etc.
        // across the app (used as page bg / primary text / borders) becomes
        // dark-theme-correct without editing each of those call sites. The
        // ramp is inverted on purpose — slate-50 is now the darkest value
        // (page background) and slate-900 the lightest (primary text).
        slate: {
          50: "#0a0e15",
          100: "#1c2430",
          200: "#2a3444",
          300: "#3a4557",
          400: "#5b6576",
          500: "#7c8797",
          600: "#a0aabb",
          700: "#c3cbd6",
          800: "#dde3ea",
          900: "#f2f5f8",
        },
      },
    },
  },
  plugins: [],
};
export default config;
