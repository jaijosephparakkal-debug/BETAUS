import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { Card, CompanyTag } from "@/components/ui";
import { dubaiDateKey } from "@/lib/attendance";
import { daysInMonth, getMonthCalendar, isHoliday, isWorkingDay, keyOf, monthKey, monthLabel, parseMonth, shiftMonth, summarize } from "@/lib/attendanceCalendar";

const WD = ["S", "M", "T", "W", "T", "F", "S"];

export default async function AttendanceCalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!me.isDirector) redirect("/dashboard");

  const { year, month } = parseMonth(searchParams.month);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const todayKey = dubaiDateKey(new Date());
  const isCurrent = monthKey(year, month) === todayKey.slice(0, 7);
  const people = await getMonthCalendar(year, month);
  const n = daysInMonth(year, month);
  const days = Array.from({ length: n }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-semibold text-slate-900">Attendance calendar — {monthLabel(year, month)}</h1>
          <p className="text-[19px] text-slate-500">Everyone's first login and last logout, day by day. Tap a name for their month.</p>
        </div>
        <div className="flex items-center gap-2 text-[19px]">
          <Link href={`/director/calendar?month=${monthKey(prev.year, prev.month)}`} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">← Prev</Link>
          {!isCurrent && (
            <Link href="/director/calendar" className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">This month</Link>
          )}
          {!isCurrent && (
            <Link href={`/director/calendar?month=${monthKey(next.year, next.month)}`} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">Next →</Link>
          )}
          <Link href="/director/attendance" className="rounded-md border border-brand-200 px-3 py-1.5 text-slate-600 hover:bg-brand-50">Daily sheet</Link>
        </div>
      </div>

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0 text-[12px] leading-tight">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[170px] bg-white px-3 py-2 text-left text-[15px] text-slate-500">Staff</th>
                {days.map((d) => {
                  const k = keyOf(year, month, d);
                  const wd = new Date(`${k}T00:00:00Z`).getUTCDay();
                  return (
                    <th key={d} className={`min-w-[44px] px-1 py-1 text-center font-medium ${k === todayKey ? "bg-brand-100 text-brand-800" : wd === 0 || wd === 6 ? "bg-slate-100 text-slate-500" : "text-slate-600"}`}>
                      <div>{d}</div>
                      <div className="text-[10px] opacity-70">{WD[wd]}</div>
                    </th>
                  );
                })}
                <th className="min-w-[44px] px-1 text-center text-slate-500">Present</th>
                <th className="min-w-[44px] px-1 text-center text-slate-500">Absent</th>
                <th className="min-w-[44px] px-1 text-center text-slate-500">Leave</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => {
                const s = summarize(p, year, month);
                return (
                  <tr key={p.userId}>
                    <td className="sticky left-0 z-10 border-t border-slate-100 bg-white px-3 py-1.5">
                      <Link href={`/director/staff/${p.userId}/calendar?month=${monthKey(year, month)}`} className="flex items-center gap-2 hover:underline">
                        <CompanyTag slug={p.companySlug} />
                        <span>
                          <span className="block text-[16px] font-medium text-slate-900">{p.name}</span>
                          <span className="block text-[12px] text-slate-500">{p.title}</span>
                        </span>
                      </Link>
                    </td>
                    {days.map((d) => {
                      const k = keyOf(year, month, d);
                      const rec = p.days.get(k);
                      let cls = "bg-white";
                      let body: React.ReactNode = null;
                      if (rec) {
                        cls = rec.late ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800";
                        body = (
                          <>
                            <div>{rec.first}</div>
                            <div>{rec.last === "still in" ? "in" : rec.last === "not recorded" ? "—" : rec.last}</div>
                          </>
                        );
                      } else if (p.leave.has(k)) { cls = "bg-sky-100 text-sky-700"; body = <span className="font-semibold">AL</span>; }
                      else if (isHoliday(k)) { cls = "bg-slate-100 text-slate-400"; body = "H"; }
                      else if (isWorkingDay(k) && k >= p.joined && k < todayKey) { cls = "bg-red-500 text-white"; body = <span className="font-semibold">A</span>; }
                      else if (k > todayKey || k < p.joined) cls = "bg-white";
                      else cls = "bg-slate-50";
                      return (
                        <td key={d} className={`border-t border-white px-1 py-1 text-center ${cls} ${k === todayKey ? "ring-1 ring-inset ring-brand-400" : ""}`}>{body}</td>
                      );
                    })}
                    <td className="border-t border-slate-100 px-1 text-center text-[15px] font-semibold text-slate-900">{s.present}</td>
                    <td className={`border-t border-slate-100 px-1 text-center text-[15px] font-semibold ${s.absent ? "text-red-600" : "text-slate-400"}`}>{s.absent}</td>
                    <td className={`border-t border-slate-100 px-1 text-center text-[15px] font-semibold ${s.leave ? "text-sky-700" : "text-slate-400"}`}>{s.leave}</td>
                  </tr>
                );
              })}
              {people.length === 0 && (
                <tr><td colSpan={n + 4} className="px-4 py-6 text-center text-[19px] text-slate-500">No staff to show.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[15px] text-slate-500">
        Top time is the first login, bottom time the last logout. “in” = still logged in, “—” = no logout recorded. Amber = logged in after 8:15 AM. A = no login on a working day, AL = annual leave, H = holiday (Sundays and alternate Saturdays).
      </p>
    </div>
  );
}
