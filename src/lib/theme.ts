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

// Colour ramps are derived from each company's own brand guideline hex.
// 500/600/700/900 (buttons, links, focus rings) keep each company's primary
// guideline colour — GASNEEDS red #D30A0A, Flaretech blue #007EC8. 50/100/
// 200/300 (borders and subtle background tints, used app-wide) run the
// *secondary* guideline colour instead, per request: Flaretech's borders are
// yellowish-orange (#F5881F, the flame in their logo) and GASNEEDS' borders
// are red (#D30A0A, same as their primary — they only have the one accent
// colour). All tinted toward black since the app runs a dark theme. See
// GASNEEDS_Brand_Guidelines.pdf and FLARETECH-UAE.pdf for the source hex.
//
// --card-text / --button-bg: dialog/card boxes only (the page gradient below
// is untouched) — white card background, brand-coloured text, brand-coloured
// buttons, per request.
const THEMES: Record<string, CompanyTheme> = {
  flaretechnical: {
    displayName: "Flaretech Trading LLC",
    logo: "/logos/flaretech.png",
    logoWidth: 1197,
    logoHeight: 1147,
    tagline: "Everything For Gas",
    vars: {
      "--brand-50": "29 16 4",
      "--brand-100": "74 41 9",
      "--brand-200": "135 75 17",
      "--brand-300": "184 102 23",
      "--brand-500": "31 141 207",
      "--brand-600": "0 126 200",
      // Lighter than 600 (not darker) — this theme is dark, so 700 doubles as
      // both "readable text on a dark brand-tinted chip" and a brighter,
      // more legible button hover state.
      "--brand-700": "89 171 219",
      "--brand-900": "0 57 90",
      // Blue text, orange buttons, on white card backgrounds.
      "--card-text": "0 126 200", // same blue as --brand-600
      "--button-bg": "180 83 9", // a readable, slightly deeper orange than the glow's #F5881F
      "--button-bg-hover": "150 68 5",
    } as CSSProperties,
    // Blue (top-left) and orange (bottom-right) glow, echoing the logo's own
    // diagonal flame-to-drop split, over a near-black base.
    pageBackground:
      "radial-gradient(circle at 22% 18%, rgba(0,126,200,0.65) 0%, transparent 45%), " +
      "radial-gradient(circle at 78% 82%, rgba(245,136,31,0.55) 0%, transparent 45%), " +
      "#05070a",
  },
  gasneeds: {
    displayName: "Gasneeds Trading LLC",
    logo: "/logos/gasneeds.png",
    logoWidth: 630,
    logoHeight: 373,
    tagline: "Gas Solutions Delivered",
    vars: {
      "--brand-50": "25 1 1",
      "--brand-100": "63 3 3",
      "--brand-200": "116 6 6",
      "--brand-300": "158 8 8",
      "--brand-500": "216 39 39",
      "--brand-600": "211 10 10",
      "--brand-700": "226 96 96",
      "--brand-900": "95 4 4",
      // Red text, black buttons, on white card backgrounds.
      "--card-text": "211 10 10", // same red as --brand-600
      "--button-bg": "17 17 17",
      "--button-bg-hover": "40 40 40",
    } as CSSProperties,
    pageBackground:
      "radial-gradient(circle at 30% 20%, #4a0808 0%, #0a0505 55%, #0a0505 100%)",
  },
};

const DEFAULT_THEME: CompanyTheme = THEMES.flaretechnical;

export function getCompanyTheme(slug: string): CompanyTheme {
  return THEMES[slug] ?? DEFAULT_THEME;
}
