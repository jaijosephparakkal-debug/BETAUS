import { dubaiDateKey, dubaiMinutesOfDay } from "@/lib/attendance";

// One-off window in which staff may correct their own attendance. Every
// change made in it is flagged as manual and shows that way in reports.
export const RECONCILE_WINDOW = { date: "2026-10-22", startMin: 12 * 60, endMin: 13 * 60, label: "12:00 – 1:00 PM", endLabel: "1:00 PM" };
export const RECONCILE_FROM = "2026-09-26";

export function isReconcileOpen(now = new Date()) {
  const m = dubaiMinutesOfDay(now);
  return dubaiDateKey(now) === RECONCILE_WINDOW.date && m >= RECONCILE_WINDOW.startMin && m < RECONCILE_WINDOW.endMin;
}
