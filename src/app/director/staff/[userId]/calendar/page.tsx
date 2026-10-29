import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { Card, CompanyTag } from "@/components/ui";
import { dubaiDateKey } from "@/lib/attendance";
import { addLeaveAction, removeLeaveAction } from "@/app/director/leave/actions";
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

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Days present", s.present, "text-emerald-700"],
          ["Absent", s.absent, s.absent ? "text-red-600" : "text-slate-400"],
          ["Annual leave", s.leave, s.leave ? "text-sky-700" : "text-slate-400"],
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
            const onLeave = person.leave.has(k);
            const absent = !rec && !onLeave && isWorkingDay(k) && k >= person.joined && k < todayKey;
            const cls = rec ? (rec.late ? "bg-amber-50" : "bg-emerald-50") : onLeave ? "bg-sky-50" : absent ? "bg-red-50" : isHoliday(k) ? "bg-slate-100" : "bg-slate-50";
            return (
              <Link
                key={i}
                href={`/director/attendance?date=${k}`}
                className={`min-h-[92px] border border-white p-2 hover:brightness-95 ${cls} ${k === todayKey ? "ring-2 ring-inset ring-brand-400" : ""}`}
              >
                <div className="text-[15px] text-slate-500">{d}</div>
                {rec ? (
                  <div className="mt-1 text-[17px] leading-snug">
                    <div className={rec.late ? "text-amber-800" : "text-emerald-800"}>In {rec.first}</div>
                    <div className="text-emerald-800">Out {rec.last}</div>
                    {onLeave && <div className="mt-0.5 text-[12px] font-medium text-sky-700">Annual leave</div>}
                  </div>
                ) : onLeave ? (
                  <div className="mt-3 text-center text-[17px] font-medium text-sky-700">Annual leave</div>
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
        Green = logged in (first login and last logout). Amber = logged in after 8:15 AM. Blue = annual leave. Red = no login on a working day. Grey = holiday (every Sunday and alternate Saturdays). Tap a day for that day's full sheet.
      </p>

      <Card>
        <h2 className="mb-2 text-[21px] font-semibold text-slate-900">Annual leave</h2>
        <form action={addLeaveAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="userId" value={person.userId} />
          <label className="text-[17px] text-slate-600">
            From
            <input type="date" name="from" required className="mt-1 block rounded-md border border-brand-300 px-2 py-1.5 text-[19px]" />
          </label>
          <label className="text-[17px] text-slate-600">
            To
            <input type="date" name="to" className="mt-1 block rounded-md border border-brand-300 px-2 py-1.5 text-[19px]" />
          </label>
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700">Mark annual leave</button>
        </form>
        <p className="mt-1 text-[15px] text-slate-500">Leave one date for a single day. Sundays and alternate Saturdays are skipped.</p>
        {person.leave.size > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[...person.leave].sort().map((d) => (
              <form key={d} action={removeLeaveAction} className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[17px] text-sky-800">
                <input type="hidden" name="userId" value={person.userId} />
                <input type="hidden" name="date" value={d} />
                {new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                <button type="submit" className="text-[15px] text-slate-500 hover:text-red-600" title="Remove this leave day">✕</button>
              </form>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
