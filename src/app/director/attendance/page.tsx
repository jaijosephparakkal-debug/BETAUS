import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { Card, CompanyTag } from "@/components/ui";

// Dubai has no DST, fixed UTC+4.
const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

function dubaiDayRange(dateStr?: string) {
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

function formatDubaiTime(date: Date) {
  const shifted = new Date(date.getTime() + DUBAI_OFFSET_MS);
  const h = shifted.getUTCHours();
  const min = String(shifted.getUTCMinutes()).padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${period}`;
}

function formatDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

const REASON_LABELS: Record<string, string> = {
  OFFICE_USE: "Office use",
  SICKNESS: "Sickness",
  SHIFT_ENDED: "Shift ended",
};

type Entry = {
  id: string;
  clockIn: Date;
  clockOut: Date | null;
  reason: string | null;
  membership: { title: string; user: { name: string }; company: { slug: string } };
};

function MergedAttendanceTable({ entries, now }: { entries: Entry[]; now: Date }) {
  return (
    <Card className="!p-0">
      <table className="w-full text-[19px]">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[17px] uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Clock in</th>
            <th className="px-4 py-3">Clock out</th>
            <th className="px-4 py-3">Hours</th>
            <th className="px-4 py-3">Reason</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isOpen = !entry.clockOut;
            const durationMs =
              (entry.clockOut ? entry.clockOut.getTime() : now.getTime()) - entry.clockIn.getTime();
            return (
              <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-[21px] font-medium text-slate-900">
                  {entry.membership.user.name}
                </td>
                <td className="px-4 py-3">
                  <CompanyTag slug={entry.membership.company.slug} />
                </td>
                <td className="px-4 py-3 text-slate-600">{entry.membership.title}</td>
                <td className="px-4 py-3 text-slate-600">{formatDubaiTime(entry.clockIn)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {entry.clockOut ? (
                    formatDubaiTime(entry.clockOut)
                  ) : (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[17px] font-medium text-emerald-600">
                      Still clocked in
                    </span>
                  )}
                </td>
                <td className={`px-4 py-3 ${isOpen ? "text-emerald-600" : "text-slate-600"}`}>
                  {formatDuration(durationMs)}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {entry.reason ? REASON_LABELS[entry.reason] ?? entry.reason : "—"}
                </td>
              </tr>
            );
          })}
          {entries.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-[19px] text-slate-500">
                No attendance entries for this day.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

export default async function AttendanceSheetPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  const { start, end, label, isoValue } = dubaiDayRange(searchParams.date);

  // Only ever two companies system-wide — merged into one table with a
  // Company column, one shared date navigator, no company switch involved.
  const entries = await prisma.attendanceEntry.findMany({
    where: { clockIn: { gte: start, lt: end } },
    include: { membership: { include: { user: true, company: true } } },
    orderBy: { clockIn: "asc" },
  });

  const now = new Date();
  const prevDate = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const nextDate = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const toIso = (d: Date) => {
    const s = new Date(d.getTime() + DUBAI_OFFSET_MS);
    return `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, "0")}-${String(
      s.getUTCDate()
    ).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-semibold text-slate-900">Attendance sheet — both companies</h1>
          <p className="text-[19px] text-slate-500">{label}</p>
        </div>
        <div className="flex items-center gap-2 text-[19px]">
          <a
            href={`/director/attendance?date=${toIso(prevDate)}`}
            className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50"
          >
            ← Previous day
          </a>
          <a
            href={`/director/attendance?date=${toIso(nextDate)}`}
            className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50"
          >
            Next day →
          </a>
          {isoValue !== toIso(now) && (
            <a
              href="/director/attendance"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
            >
              Today
            </a>
          )}
        </div>
      </div>

      <MergedAttendanceTable entries={entries} now={now} />
    </div>
  );
}
