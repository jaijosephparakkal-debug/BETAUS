import { dubaiDateKey, dubaiMinutesOfDay } from "@/lib/attendance";

// One-off window in which staff may correct their own attendance. Every
// change made in it is flagged as manual and shows that way in reports.
export const RECONCILE_WINDOW = { date: "2026-10-22", startMin: 12 * 60, endMin: 22 * 60, label: "12:00 PM – 10:00 PM", endLabel: "10:00 PM" };
export const RECONCILE_FROM = "2026-09-26";

// People whose window runs later than everyone else's, by sign-in email (minutes after midnight, Dubai).
const EXTENDED: Record<string, { endMin: number; label: string }> = {
  "sales@gasneeds.com": { endMin: 22 * 60, label: "10:00 PM" }, // Antony
  "alerts@flaretechnical.com": { endMin: 22 * 60, label: "10:00 PM" }, // Flexie
  "jiyad.m@flaretechnical.com": { endMin: 22 * 60, label: "10:00 PM" }, // Jiyad
  "ram@flaretechnical.com": { endMin: 22 * 60, label: "10:00 PM" }, // Ram
};

export function reconcileEndLabel(email: string) {
  return EXTENDED[email.toLowerCase()]?.label ?? RECONCILE_WINDOW.endLabel;
}

export function isReconcileOpen(email: string, now = new Date()) {
  const m = dubaiMinutesOfDay(now);
  const endMin = EXTENDED[email.toLowerCase()]?.endMin ?? RECONCILE_WINDOW.endMin;
  return dubaiDateKey(now) === RECONCILE_WINDOW.date && m >= RECONCILE_WINDOW.startMin && m < endMin;
}

// The "usual hours" bulk page is for the director's own record only.
export function canBulkReconcile(email: string) {
  return email.toLowerCase() === "jai@gasneeds.com";
}
