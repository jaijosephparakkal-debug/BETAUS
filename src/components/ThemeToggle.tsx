"use client";

import { useTransition } from "react";
import { setThemeAction } from "@/app/themeActions";

/** Switches between the light and dark look; the choice is remembered. */
export function ThemeToggle({ light }: { light: boolean }) {
  const [pending, start] = useTransition();
  const next = light ? "dark" : "light";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => setThemeAction(next))}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      title={light ? "Dark theme" : "Light theme"}
      className="theme-toggle flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-[#DFE5EB] hover:bg-white/10 disabled:opacity-60"
    >
      {light ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
      )}
    </button>
  );
}
