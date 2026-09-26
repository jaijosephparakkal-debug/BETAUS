import type { CSSProperties } from "react";

export type CompanyTheme = {
  displayName: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
  tagline: string;
  /** --brand-* CSS custom properties, "R G B" triples matching each company's guideline colour. */
  vars: CSSProperties;
  /** Full-page background (a subtle glow toward the primary colour) — used on the per-company login screen. */
  pageBackground: string;
};

// Colour ramps are derived from each company's own brand guideline hex, on a
// light theme — 50 is the lightest tint (subtle backgrounds/highlights), 900
// the deepest shade, following the standard Tailwind convention. 500/600
// carry each company's primary guideline colour (GASNEEDS red #D30A0A,
// Flaretech blue #007EC8) for links, headings and borders; 700 is a darker
// shade of the same hue for hover states. See GASNEEDS_Brand_Guidelines.pdf
// and FLARETECH-UAE.pdf for the source hex.
//
// --card-text / --button-bg: dialog/card boxes (white background) get the
// primary colour for text and a *secondary* accent colour for buttons —
// Flaretech's flame orange (#F5881F), GASNEEDS' black — so every button
// rendered inside a Card picks this up automatically via the .card-themed
// rules in globals.css.
const THEMES: Record<string, CompanyTheme> = {
  flaretechnical: {
    displayName: "Flaretech Trading LLC",
    logo: "/logos/flaretech.png",
    logoWidth: 1197,
    logoHeight: 1147,
    tagline: "Everything For Gas",
    vars: {
      "--brand-50": "239 248 254",
      "--brand-100": "217 238 252",
      "--brand-200": "174 219 248",
      "--brand-300": "122 194 242",
      "--brand-500": "31 141 207",
      "--brand-600": "0 126 200",
      "--brand-700": "0 93 147",
      "--brand-900": "0 49 82",
      // Blue text, orange buttons, on white card backgrounds.
      "--card-text": "0 126 200", // same blue as --brand-600
      "--button-bg": "245 136 31", // the logo's flame orange, #F5881F
      "--button-bg-hover": "199 106 15",
    } as CSSProperties,
    // Faint blue (top-left) and orange (bottom-right) wash, echoing the
    // logo's own diagonal flame-to-drop split, over a near-white base.
    pageBackground:
      "radial-gradient(circle at 15% 8%, rgba(0,126,200,0.12) 0%, transparent 42%), " +
      "radial-gradient(circle at 85% 92%, rgba(245,136,31,0.12) 0%, transparent 42%), " +
      "#f8fafc",
  },
  gasneeds: {
    displayName: "Gasneeds Trading LLC",
    logo: "/logos/gasneeds.png",
    logoWidth: 630,
    logoHeight: 373,
    tagline: "Gas Solutions Delivered",
    vars: {
      "--brand-50": "253 238 238",
      "--brand-100": "251 214 214",
      "--brand-200": "245 174 174",
      "--brand-300": "237 128 128",
      "--brand-500": "226 59 59",
      "--brand-600": "211 10 10",
      "--brand-700": "158 8 8",
      "--brand-900": "92 4 4",
      // Red text, black buttons, on white card backgrounds.
      "--card-text": "211 10 10", // same red as --brand-600
      "--button-bg": "23 23 23",
      "--button-bg-hover": "51 51 51",
    } as CSSProperties,
    pageBackground:
      "radial-gradient(circle at 15% 8%, rgba(211,10,10,0.10) 0%, transparent 42%), " +
      "radial-gradient(circle at 85% 92%, rgba(17,17,17,0.06) 0%, transparent 42%), " +
      "#fafafa",
  },
};

const DEFAULT_THEME: CompanyTheme = THEMES.flaretechnical;

export function getCompanyTheme(slug: string): CompanyTheme {
  return THEMES[slug] ?? DEFAULT_THEME;
}
