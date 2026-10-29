import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { Card, CompanyTag } from "@/components/ui";
import { dubaiDateKey } from "@/lib/attendance";
import { daysInMonth, getMonthCalendar, isHoliday, isWorkingDay, keyOf, monthKey, monthLabel, parseMonth, shiftMonth, summarize } from "@/lib/attendanceCalendar";

export default async function StaffCalendarPage({ params, searchParams }: { params: { userId: string }; searchParams: { month?: string } }) {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!me.isDirector) redirect("/dashboard");

  const { year, month } = parseMonth(searchParams.month);
  const [person] = await getMonthCalendar(year, month, params.userId);
  if (!person) notFound();
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const todayKey = dubaiDateKey(new Date());
  const isCurrent = monthKey(year, month) === todayKey.slice(0, 7);
  const s = summarize(person, year, month);
  const n = daysInMonth(year, month);
  const firstDow = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const base = `/director/staff/${person.userId}/calendar`;
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/director/calendar?month=${monthKey(year, month)}`} className="text-[17px] text-brand-600 hover:underline">← Full calendar</Link>
          <h1 className="mt-1 flex items-center gap-2 text-[23px] font-semibold text-slate-900">
            <CompanyTag slug={person.companySlug} /> {person.name}
          </h1>
          <p className="text-[19px] text-slate-500">{person.title} · attendance for {monthLabel(year, month)}</p>
        </div>
        <div className="flex items-center gap-2 text-[19px]">
          <Link href={`${base}?month=${monthKey(prev.year, prev.month)}`} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">← Prev</Link>
          {!isCurrent && <Link href={base} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">This month</Link>}
          {!isCurrent && <Link href={`${base}?month=${monthKey(next.year, next.month)}`} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">Next →</Link>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Days present", s.present, "text-emerald-700"],
          ["Absent", s.absent, s.absent ? "text-red-600" : "text-slate-400"],
          ["First login after 8:15", s.late, s.late ? "text-amber-700" : "text-slate-400"],
          ["Corrected or auto clocked out", s.corrected + s.auto, "text-slate-600"],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-lg bg-slate-50 p-3">
            <div className={`text-[23px] font-semibold ${color}`}>{value}</div>
            <div className="text-[15px] text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <Card className="!p-0">
        <div className="grid grid-cols-7 text-center text-[15px] font-medium text-white">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-brand-600 py-1.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="min-h-[92px] border border-white bg-white" />;
            const k = keyOf(year, month, d);
            const rec = person.days.get(k);
            const absent = !rec && isWorkingDay(k) && k >= person.joined && k < todayKey;
            const cls = rec ? "bg-emerald-50" : absent ? "bg-red-50" : isHoliday(k) ? "bg-slate-100" : "bg-slate-50";
            return (
              <Link
                key={i}
                href={`/director/attendance?date=${k}`}
                className={`min-h-[92px] border border-white p-2 hover:brightness-95 ${cls} ${k === todayKey ? "ring-2 ring-inset ring-brand-400" : ""}`}
              >
                <div className="text-[15px] text-slate-500">{d}</div>
                {rec ? (
                  <div className="mt-1 text-[17px] leading-snug">
                    <div className={rec.late ? "font-medium text-amber-700" : "text-emerald-800"}>In {rec.first}</div>
                    <div className="text-emerald-800">Out {rec.last}</div>
                    {rec.corrected && <div className="mt-0.5 text-[12px] text-slate-500">Corrected manually</div>}
                    {rec.auto && <div className="mt-0.5 text-[12px] text-slate-500">Auto clocked out</div>}
                  </div>
                ) : absent ? (
                  <div className="mt-3 text-center text-[17px] font-medium text-red-600">Absent</div>
                ) : isHoliday(k) ? (
                  <div className="mt-3 text-center text-[15px] text-slate-400">Holiday</div>
                ) : null}
              </Link>
            );
          })}
        </div>
      </Card>
      <p className="text-[15px] text-slate-500">
        Green = logged in (first login and last logout). Amber login = after 8:15. Red = no login on a working day. Grey = holiday (every Sunday and alternate Saturdays). Tap a day for that day's full sheet.
      </p>
    </div>
  );
}
