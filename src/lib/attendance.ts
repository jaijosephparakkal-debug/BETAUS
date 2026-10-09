import { prisma } from "@/lib/db";

export const SIGN_OUT_REASONS = {
  OFFICE_USE: "Going out for office use",
  SICKNESS: "Leaving due to sickness",
  SHIFT_ENDED: "Shift ended",
} as const;

export type SignOutReason = keyof typeof SIGN_OUT_REASONS;

/** Opens a new attendance entry unless one is already open for this membership. */
export async function clockInIfNeeded(membershipId: string) {
  const open = await prisma.attendanceEntry.findFirst({
    where: { membershipId, clockOut: null },
  });
  if (open) return open;
  return prisma.attendanceEntry.create({ data: { membershipId } });
}

/** Closes the currently-open attendance entry for this membership, if any. */
export async function clockOut(membershipId: string, reason: SignOutReason) {
  const open = await prisma.attendanceEntry.findFirst({
    where: { membershipId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (!open) return;
  await prisma.attendanceEntry.update({
    where: { id: open.id },
    data: { clockOut: new Date(), reason },
  });
}

export function getOpenEntry(membershipId: string) {
  return prisma.attendanceEntry.findFirst({
    where: { membershipId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
}

// Dubai has no DST, fixed UTC+4.
export const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

export function dubaiDayRange(dateStr?: string) {
  let y: number, m: number, d: number;
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    [y, m, d] = dateStr.split("-").map(Number);
    m -= 1;
  } else {
    const dubaiNow = new Date(Date.now() + DUBAI_OFFSET_MS);
    y = dubaiNow.getUTCFullYear();
    m = dubaiNow.getUTCMonth();
    d = dubaiNow.getUTCDate();
  }
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0) - DUBAI_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const label = new Date(Date.UTC(y, m, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const isoValue = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { start, end, label, isoValue };
}

export function formatDubaiTime(date: Date) {
  const shifted = new Date(date.getTime() + DUBAI_OFFSET_MS);
  const h = shifted.getUTCHours();
  const min = String(shifted.getUTCMinutes()).padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${period}`;
}

// Office hours used to flag "late in" / "left late" on the director's staff
// profile (Dubai time). Change here if the office timing changes.
export const OFFICE_START = { hour: 9, minute: 0 };
export const OFFICE_END = { hour: 18, minute: 0 };

/** "YYYY-MM-DD" of the Dubai calendar day this moment falls on. */
export function dubaiDateKey(date: Date) {
  const s = new Date(date.getTime() + DUBAI_OFFSET_MS);
  return `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, "0")}-${String(s.getUTCDate()).padStart(2, "0")}`;
}

/** Minutes past Dubai midnight for this moment. */
export function dubaiMinutesOfDay(date: Date) {
  const s = new Date(date.getTime() + DUBAI_OFFSET_MS);
  return s.getUTCHours() * 60 + s.getUTCMinutes();
}
