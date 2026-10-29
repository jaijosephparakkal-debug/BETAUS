import { prisma } from "@/lib/db";
import { ensureClockOutReminder, cancelClockOutReminder } from "@/lib/clockOutReminder";

export const SIGN_OUT_REASONS = {
  OFFICE_USE: "Going out for office use",
  SICKNESS: "Leaving due to sickness",
  SHIFT_ENDED: "Shift ended",
} as const;

export type SignOutReason = keyof typeof SIGN_OUT_REASONS;

// Staff are clocked out automatically at 6 PM Dubai time (OFFICE_END). If they
// want to work later they log in again, and that session is closed at the end
// of the day. This applies to everyone, directors included. The closed entry
// is flagged with an AUTO_* reason so reports show it was automatic.
export const AUTO_REASONS = {
  AUTO_6PM: "Auto clocked out — login once more to continue work",
  AUTO_EOD: "Auto clocked out (midnight)",
} as const;

/** When an entry that started at `clockIn` is automatically closed, and why. */
export function autoCutoffFor(clockIn: Date) {
  const [y, m, d] = dubaiDateKey(clockIn).split("-").map(Number);
  const sixPm = new Date(Date.UTC(y, m - 1, d, OFFICE_END.hour, OFFICE_END.minute) - DUBAI_OFFSET_MS);
  if (clockIn < sixPm) return { at: sixPm, reason: "AUTO_6PM" as const };
  return { at: new Date(Date.UTC(y, m - 1, d, 23, 59, 59) - DUBAI_OFFSET_MS), reason: "AUTO_EOD" as const };
}

/** Sweeps every open entry whose automatic cut-off has passed. Used by the daily cron. */
export async function autoClockOutAllOverdue() {
  const now = new Date();
  const open = await prisma.attendanceEntry.findMany({
    where: { clockOut: null },
  });
  let closed = 0;
  for (const e of open) {
    const { at, reason } = autoCutoffFor(e.clockIn);
    if (at > now) continue;
    const r = await prisma.attendanceEntry.updateMany({
      where: { id: e.id, clockOut: null },
      data: { clockOut: at, reason },
    });
    closed += r.count;
  }
  return closed;
}

/**
 * Opens a new attendance entry unless one is already open for this
 * membership, and makes sure today's clock-out reminder is scheduled. An
 * entry past its automatic cut-off is closed first. After 6 PM a page load
 * does NOT start a new entry (returns null) — staff choose to continue
 * working; signing in (explicit) always does.
 */
export async function clockInIfNeeded(membershipId: string, opts: { explicit?: boolean } = {}) {
  const now = new Date();
  let open = await prisma.attendanceEntry.findFirst({
    where: { membershipId, clockOut: null },
  });
  if (open) {
    const { at, reason } = autoCutoffFor(open.clockIn);
    if (at <= now) {
      await prisma.attendanceEntry.updateMany({ where: { id: open.id, clockOut: null }, data: { clockOut: at, reason } });
      open = null;
    }
  }
  if (!open && !opts.explicit && dubaiMinutesOfDay(now) >= OFFICE_END.hour * 60 + OFFICE_END.minute) return null;
  const entry = open ?? (await prisma.attendanceEntry.create({ data: { membershipId } }));
  await ensureClockOutReminder(entry);
  return entry;
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
  await cancelClockOutReminder(open);
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
export const OFFICE_END = { hour: 17, minute: 0 };

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
