import { prisma } from "@/lib/db";
import { staffWhere } from "@/lib/visibleStaff";
import { DUBAI_OFFSET_MS, dubaiDateKey } from "@/lib/attendance";

export const LATE_AFTER_MIN = 8 * 60 + 15;

export type CalDay = { first: string; last: string; late: boolean; corrected: boolean; auto: boolean };
export type CalPerson = {
  userId: string;
  name: string;
  title: string;
  companySlug: string;
  companyName: string;
  joined: string; // Dubai date the person was added
  days: Map<string, CalDay>;
  leave: Set<string>; // dates marked as annual leave
};

export const keyOf = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
export const monthKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
const dow = (key: string) => new Date(`${key}T00:00:00Z`).getUTCDay();

/** "2026-10" → { year, month }, falling back to the current Dubai month. */
export function parseMonth(raw?: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(raw || "");
  if (m && +m[2] >= 1 && +m[2] <= 12) return { year: +m[1], month: +m[2] };
  const now = dubaiDateKey(new Date());
  return { year: +now.slice(0, 4), month: +now.slice(5, 7) };
}
export function shiftMonth(year: number, month: number, by: number) {
  const d = new Date(Date.UTC(year, month - 1 + by, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export function monthLabel(y: number, m: number) {
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

// Holidays: every Sunday, plus every other Saturday (3 Oct 2026 is the anchor, so 17 and 31 Oct, 19 Sep, ...).
const OFF_SATURDAY_ANCHOR = Date.UTC(2026, 9, 3);
export function isOffSaturday(key: string) {
  if (dow(key) !== 6) return false;
  const days = Math.round((new Date(`${key}T00:00:00Z`).getTime() - OFF_SATURDAY_ANCHOR) / 86400000);
  return days % 14 === 0;
}
export const isHoliday = (key: string) => dow(key) === 0 || isOffSaturday(key);
/** Monday–Friday, plus the working Saturdays (9 AM–3 PM) — every Saturday except the alternate off ones (3, 17, 31 Oct…). */
export const isWorkingDay = (key: string) => dow(key) >= 1 && dow(key) <= 6 && !isHoliday(key);

function minutesOfDay(d: Date) {
  const s = new Date(d.getTime() + DUBAI_OFFSET_MS);
  return s.getUTCHours() * 60 + s.getUTCMinutes();
}
function hhmm(d: Date) {
  const s = new Date(d.getTime() + DUBAI_OFFSET_MS);
  return `${String(s.getUTCHours()).padStart(2, "0")}:${String(s.getUTCMinutes()).padStart(2, "0")}`;
}

/** Every person's attendance for a month (everyone but the Managing Director). With `userId`, just that person. */
export async function getMonthCalendar(year: number, month: number, userId?: string): Promise<CalPerson[]> {
  const startKey = keyOf(year, month, 1);
  const nextKey = month === 12 ? keyOf(year + 1, 1, 1) : keyOf(year, month + 1, 1);
  const start = new Date(new Date(`${startKey}T00:00:00Z`).getTime() - DUBAI_OFFSET_MS);
  const end = new Date(new Date(`${nextKey}T00:00:00Z`).getTime() - DUBAI_OFFSET_MS);

  const memberships = await prisma.membership.findMany({
    where: userId ? { userId } : staffWhere,
    include: { user: true, company: true },
    orderBy: { createdAt: "asc" },
  });
  // A person's attendance counts whichever of their memberships they clocked in under.
  const allMemberships = await prisma.membership.findMany({
    where: { userId: { in: memberships.map((m) => m.userId) } },
    select: { id: true, userId: true },
  });
  const entries = await prisma.attendanceEntry.findMany({
    where: { membershipId: { in: allMemberships.map((m) => m.id) }, clockIn: { gte: start, lt: end } },
    orderBy: { clockIn: "asc" },
  });

  const todayKey = dubaiDateKey(new Date());
  const people = new Map<string, CalPerson>();
  const owner = new Map<string, string>(); // membershipId -> userId
  for (const m of allMemberships) owner.set(m.id, m.userId);
  for (const m of memberships) {
    const existing = people.get(m.userId);
    if (!existing) {
      people.set(m.userId, {
        userId: m.userId, name: m.user.name, title: m.title, companySlug: m.company.slug, companyName: m.company.name,
        joined: dubaiDateKey(m.createdAt), days: new Map(), leave: new Set(),
      });
    } else if (m.company.slug === "gasneeds") {
      existing.title = m.title; existing.companySlug = m.company.slug; existing.companyName = m.company.name;
    }
  }

  const leaveRows = await prisma.leaveDay.findMany({
    where: { userId: { in: [...people.keys()] }, date: { gte: startKey, lt: nextKey } },
  });
  for (const l of leaveRows) people.get(l.userId)?.leave.add(l.date);

  const byPersonDay = new Map<string, typeof entries>();
  for (const e of entries) {
    const uid = owner.get(e.membershipId);
    if (!uid) continue;
    const k = `${uid}|${dubaiDateKey(e.clockIn)}`;
    byPersonDay.set(k, [...(byPersonDay.get(k) ?? []), e]);
  }
  for (const [k, list] of byPersonDay) {
    const [uid, day] = k.split("|");
    const first = list.reduce((a, b) => (a.clockIn <= b.clockIn ? a : b));
    const outs = list.filter((e) => e.clockOut && dubaiDateKey(e.clockOut) === day).map((e) => e.clockOut!.getTime());
    const open = list.some((e) => !e.clockOut);
    people.get(uid)!.days.set(day, {
      first: hhmm(first.clockIn),
      last: outs.length ? hhmm(new Date(Math.max(...outs))) : open && day === todayKey ? "still in" : "not recorded",
      late: minutesOfDay(first.clockIn) > LATE_AFTER_MIN,
      corrected: list.some((e) => e.isManual),
      auto: list.some((e) => e.reason === "AUTO_6PM" || e.reason === "AUTO_EOD"),
    });
  }
  return [...people.values()].sort((a, b) => a.companyName.localeCompare(b.companyName) || a.name.localeCompare(b.name));
}

export function summarize(p: CalPerson, year: number, month: number) {
  const todayKey = dubaiDateKey(new Date());
  let present = 0, absent = 0, late = 0, corrected = 0, auto = 0, leave = 0;
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    const k = keyOf(year, month, d);
    const rec = p.days.get(k);
    if (rec) {
      if (isWorkingDay(k)) present++;
      if (rec.late) late++;
      if (rec.corrected) corrected++;
      if (rec.auto) auto++;
    } else if (p.leave.has(k)) {
      if (isWorkingDay(k)) leave++;
    } else if (isWorkingDay(k) && k >= p.joined && k < todayKey) absent++;
    if (rec && p.leave.has(k) && isWorkingDay(k)) leave++;
  }
  return { present, absent, late, corrected, auto, leave };
}
