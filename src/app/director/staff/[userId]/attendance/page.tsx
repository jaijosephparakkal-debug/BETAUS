import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import {
  DUBAI_OFFSET_MS,
  OFFICE_START,
  OFFICE_END,
  dubaiDateKey,
  dubaiMinutesOfDay,
  formatDubaiTime,
} from "@/lib/attendance";
import { Card, CompanyTag } from "@/components/ui";

const REASON_LABELS: Record<string, string> = {
  OFFICE_USE: "Office use",
  SICKNESS: "Sickness",
  SHIFT_ENDED: "Shift ended",
};

function formatHours(ms: number) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

/** "YYYY-MM" for the Dubai month containing this moment. */
function monthKey(date: Date) {
  return dubaiDateKey(date).slice(0, 7);
}

/** One person's attendance for a whole month (Dubai time), every day listed — what tapping a name in Attendance opens. */
export default async function StaffMonthAttendancePage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams: { month?: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  const memberships = await prisma.membership.findMany({
    where: { userId: params.userId },
    include: { user: true, company: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) notFound();
  const person = memberships[0].user;
  const slugOf = new Map(memberships.map((m) => [m.id, m.company.slug]));

  const now = new Date();
  const month = searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month) ? searchParams.month : monthKey(now);
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - DUBAI_OFFSET_MS);
  const end = new Date(Date.UTC(y, m, 1) - DUBAI_OFFSET_MS);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const prevMonth = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
  const nextMonth = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;
  const isCurrentMonth = month === monthKey(now);
  const todayKey = dubaiDateKey(now);

  const entries = await prisma.attendanceEntry.findMany({
    where: { membershipId: { in: memberships.map((x) => x.id) }, clockIn: { gte: start, lt: end } },
    orderBy: { clockIn: "asc" },
  });

  type Day = {
    key: string;
    slugs: Set<string>;
    firstIn: Date;
    lastOut: Date | null;
    stillIn: boolean;
    workedMs: number;
    reasons: Set<string>;
  };
  const byDay = new Map<string, Day>();
  for (const e of entries) {
    const key = dubaiDateKey(e.clockIn);
    let d = byDay.get(key);
    if (!d) {
      d = { key, slugs: new Set(), firstIn: e.clockIn, lastOut: null, stillIn: false, workedMs: 0, reasons: new Set() };
      byDay.set(key, d);
    }
    d.slugs.add(slugOf.get(e.membershipId) ?? "");
    if (e.clockOut) {
      if (!d.lastOut || e.clockOut > d.lastOut) d.lastOut = e.clockOut;
    } else {
      d.stillIn = true;
    }
    if (e.reason) d.reasons.add(REASON_LABELS[e.reason] ?? e.reason);
    d.workedMs += (e.clockOut ?? now).getTime() - e.clockIn.getTime();
  }

  const startLimit = OFFICE_START.hour * 60 + OFFICE_START.minute;
  const endLimit = OFFICE_END.hour * 60 + OFFICE_END.minute;
  const rows = Array.from({ length: daysInMonth }, (_, i) => {
    const key = `${month}-${String(i + 1).padStart(2, "0")}`;
    const d = byDay.get(key) ?? null;
    const date = new Date(Date.UTC(y, m - 1, i + 1));
    return {
      key,
      label: date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
      isFuture: key > todayKey,
      d,
      lateIn: !!d && dubaiMinutesOfDay(d.firstIn) > startLimit,
      leftLate: !!d && !d.stillIn && !!d.lastOut && dubaiMinutesOfDay(d.lastOut) > endLimit,
    };
  }).filter((r) => !r.isFuture);

  const present = rows.filter((r) => r.d).length;
  const lateIn = rows.filter((r) => r.lateIn).length;
  const leftLate = rows.filter((r) => r.leftLate).length;
  const totalMs = rows.reduce((s, r) => s + (r.d?.workedMs ?? 0), 0);
  const monthLabel = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const officeStartLabel = formatDubaiTime(new Date(Date.UTC(2000, 0, 1, OFFICE_START.hour - 4, OFFICE_START.minute)));
  const officeEndLabel = formatDubaiTime(new Date(Date.UTC(2000, 0, 1, OFFICE_END.hour - 4, OFFICE_END.minute)));
  const base = `/director/staff/${params.userId}/attendance`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-[17px]">
        <Link href="/director/attendance" className="text-brand-600 hover:underline">
          ← Attendance sheet
        </Link>
        {/* Staff profiles exist only for non-directors. */}
        {memberships.some((x) => !x.isDirector) && (
          <Link href={`/director/staff/${params.userId}`} className="text-brand-600 hover:underline">
            {person.name}&rsquo;s profile →
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-[23px] font-semibold text-slate-900">
            {memberships.map((x) => (
              <CompanyTag key={x.id} slug={x.company.slug} />
            ))}
            {person.name} — attendance
          </h1>
          <p className="text-[19px] text-slate-500">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-[17px]">
          <Link href={`${base}?month=${prevMonth}`} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">
            ← Previous month
          </Link>
          {!isCurrentMonth && (
            <>
              <Link href={`${base}?month=${nextMonth}`} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">
                Next month →
              </Link>
              <Link href={base} className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">
                This month
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-surface p-3 shadow-sm">
          <div className="text-[23px] font-semibold text-slate-900">
            {present}/{rows.length}
          </div>
          <div className="text-[15px] text-slate-500">Days in</div>
        </div>
        <div className="rounded-lg bg-surface p-3 shadow-sm">
          <div className="text-[23px] font-semibold text-amber-600">{lateIn}</div>
          <div className="text-[15px] text-slate-500">Late in (after {officeStartLabel})</div>
        </div>
        <div className="rounded-lg bg-surface p-3 shadow-sm">
          <div className="text-[23px] font-semibold text-violet-600">{leftLate}</div>
          <div className="text-[15px] text-slate-500">Left late (after {officeEndLabel})</div>
        </div>
        <div className="rounded-lg bg-surface p-3 shadow-sm">
          <div className="text-[23px] font-semibold text-slate-900">{formatHours(totalMs)}</div>
          <div className="text-[15px] text-slate-500">Total hours</div>
        </div>
      </div>

      <Card className="!p-0">
        <div className="divide-y divide-brand-100">
          {[...rows].reverse().map((r) => (
            <Link
              key={r.key}
              href={`/director/attendance?date=${r.key}`}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 hover:bg-brand-50/40"
            >
              <div className="flex items-center gap-2">
                <span className="w-28 text-[17px] font-medium text-slate-900">{r.label}</span>
                {r.d && memberships.length > 1 && Array.from(r.d.slugs).map((s) => <CompanyTag key={s} slug={s} />)}
              </div>
              {r.d ? (
                <div className="flex flex-wrap items-center gap-3 text-[15px] text-slate-600">
                  <span className={r.lateIn ? "font-medium text-amber-600" : ""}>In {formatDubaiTime(r.d.firstIn)}</span>
                  <span className={r.leftLate ? "font-medium text-violet-600" : ""}>
                    {r.d.stillIn ? "Still in" : r.d.lastOut ? `Out ${formatDubaiTime(r.d.lastOut)}` : "—"}
                  </span>
                  <span>{formatHours(r.d.workedMs)}</span>
                  {r.d.reasons.size > 0 && <span className="text-slate-400">{Array.from(r.d.reasons).join(", ")}</span>}
                  {r.lateIn && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-700">Late in</span>}
                  {r.leftLate && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-medium text-violet-700">Left late</span>}
                </div>
              ) : (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[15px] text-red-500">No attendance</span>
              )}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
