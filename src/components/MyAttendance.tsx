import Link from "next/link";
import { Card } from "@/components/ui";
import { dubaiDateKey } from "@/lib/attendance";
import { daysInMonth, getMonthCalendar, isHoliday, isWorkingDay, keyOf, monthKey, monthLabel, parseMonth, shiftMonth, summarize } from "@/lib/attendanceCalendar";

/** Read-only attendance calendar for the signed-in person: their own days only. */
export async function MyAttendance({ userId, monthParam, base = "/dashboard" }: { userId: string; monthParam?: string; base?: string }) {
  const { year, month } = parseMonth(monthParam);
  const [person] = await getMonthCalendar(year, month, userId);
  if (!person) return null;
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const todayKey = dubaiDateKey(new Date());
  const isCurrent = monthKey(year, month) === todayKey.slice(0, 7);
  const s = summarize(person, year, month);
  const n = daysInMonth(year, month);
  const firstDow = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[21px] font-semibold text-white">My attendance — {monthLabel(year, month)}</h2>
          <p className="text-[16px] text-[#c9d2da]">
            <span className="text-emerald-300">{s.present} present</span>
            {" · "}
            <span className={s.absent ? "text-highlight" : ""}>{s.absent} absent</span>
            {" · "}
            <span className="text-sky-300">{s.leave} annual leave</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-[17px]">
          <Link href={`${base}?month=${monthKey(prev.year, prev.month)}#attendance`} className="rounded-full border border-white/30 px-3 py-1 text-white hover:bg-white/10">← Prev</Link>
          {!isCurrent && <Link href={`${base}#attendance`} className="rounded-full border border-white/30 px-3 py-1 text-white hover:bg-white/10">This month</Link>}
          {!isCurrent && <Link href={`${base}?month=${monthKey(next.year, next.month)}#attendance`} className="rounded-full border border-white/30 px-3 py-1 text-white hover:bg-white/10">Next →</Link>}
        </div>
      </div>
      <div id="attendance" className="mt-3 grid grid-cols-7 gap-1 text-center text-[14px] text-[#9fb0bc]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const k = keyOf(year, month, d);
          const rec = person.days.get(k);
          const onLeave = person.leave.has(k);
          const absent = !rec && !onLeave && isWorkingDay(k) && k >= person.joined && k < todayKey;
          const cls = rec ? (rec.late ? "bg-amber-400/20" : "bg-emerald-400/20") : onLeave ? "bg-sky-400/20" : absent ? "bg-red-500/25" : isHoliday(k) ? "bg-white/5" : "bg-white/[0.03]";
          return (
            <div key={i} className={`min-h-[64px] rounded-lg p-1.5 text-left ${cls} ${k === todayKey ? "ring-2 ring-inset ring-accent" : ""}`}>
              <div className="text-[13px] text-[#c9d2da]">{d}</div>
              {rec ? (
                <div className="text-[12px] leading-tight text-white">
                  <div>{rec.first}</div>
                  <div className="text-[#c9d2da]">{rec.last}</div>
                </div>
              ) : onLeave ? (
                <div className="text-[12px] text-sky-300">Leave</div>
              ) : absent ? (
                <div className="text-[12px] text-highlight">Absent</div>
              ) : isHoliday(k) ? (
                <div className="text-[12px] text-[#9fb0bc]">Off</div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[14px] text-[#9fb0bc]">
        Green = logged in (first login and last logout). Amber = a late first login. Blue = annual leave. Red = no login on a working day. Only you can see this.
      </p>
    </Card>
  );
}
