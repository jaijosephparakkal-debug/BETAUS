import { dubaiDateKey, dubaiMinutesOfDay } from "@/lib/attendance";

// One-off window in which staff may correct their own attendance. Every
// change made in it is flagged as manual and shows that way in reports.
export const RECONCILE_WINDOW = { date: "2026-10-29", startMin: 0, endMin: 18 * 60, label: "today until 6:00 PM", endLabel: "6:00 PM" };
export const RECONCILE_FROM = "2026-09-26";

// People whose window runs later than everyone else's, by sign-in email (minutes after midnight, Dubai).
const EXTENDED: Record<string, { endMin: number; label: string }> = {};

// One-day windows for a single person (e.g. the director correcting their own days).
const SPECIAL: Record<string, { date: string; startMin: number; endMin: number; label: string }> = {
  "jai@gasneeds.com": { date: "2026-10-29", startMin: 0, endMin: 23 * 60, label: "11:00 PM" },
};

// Follow-up window for the people who still had days without a logout recorded.
const FOLLOW_UP = { date: "2026-10-30", startMin: 0, endMin: 11 * 60, label: "11:00 AM" };
export const OUTSTANDING_EMAILS = [
  "alerts@flaretechnical.com", // Flexie
  "accounts@flaretechnical.com", // Hashim
  "service@flaretechnical.com", // Jayaprakash
  "jiyad.m@flaretechnical.com",
  "jashim@flaretechnical.com",
  "saroj@flaretechnical.com",
  "finance@flaretechnical.com", // Shafeek
  "simi@flaretechnical.com",
];
for (const e of OUTSTANDING_EMAILS) SPECIAL[e] = FOLLOW_UP;
export const FOLLOW_UP_LABEL = FOLLOW_UP.label;

export function reconcileEndLabel(email: string) {
  const sp = SPECIAL[email.toLowerCase()];
  if (sp && dubaiDateKey(new Date()) === sp.date) return sp.label;
  return EXTENDED[email.toLowerCase()]?.label ?? RECONCILE_WINDOW.endLabel;
}

export function isReconcileOpen(email: string, now = new Date()) {
  const m = dubaiMinutesOfDay(now);
  const sp = SPECIAL[email.toLowerCase()];
  if (sp && dubaiDateKey(now) === sp.date && m >= sp.startMin && m < sp.endMin) return true;
  const endMin = EXTENDED[email.toLowerCase()]?.endMin ?? RECONCILE_WINDOW.endMin;
  return dubaiDateKey(now) === RECONCILE_WINDOW.date && m >= RECONCILE_WINDOW.startMin && m < endMin;
}

// The "usual hours" bulk page is for the director's own record only.
export function canBulkReconcile(email: string) {
  return email.toLowerCase() === "jai@gasneeds.com";
}
