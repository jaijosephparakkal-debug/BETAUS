import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { Card } from "@/components/ui";
import { DUBAI_OFFSET_MS, dubaiDateKey, formatDubaiTime } from "@/lib/attendance";
import { isReconcileOpen, reconcileEndLabel, RECONCILE_FROM, RECONCILE_WINDOW } from "@/lib/reconcile";
import { EntryForm, AddForm, RemoveButton } from "./ReconcileForms";

function hhmm(d: Date) {
  const s = new Date(d.getTime() + DUBAI_OFFSET_MS);
  return `${String(s.getUTCHours()).padStart(2, "0")}:${String(s.getUTCMinutes()).padStart(2, "0")}`;
}

export default async function ReconcilePage() {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");

  const mine = await prisma.membership.findMany({ where: { userId: me.userId }, include: { company: true } });
  const ids = mine.map((m) => m.id);
  const since = new Date(new Date(`${RECONCILE_FROM}T00:00:00Z`).getTime() - DUBAI_OFFSET_MS);
  const entries = await prisma.attendanceEntry.findMany({
    where: { membershipId: { in: ids }, clockIn: { gte: since } },
    orderBy: { clockIn: "asc" },
  });

  const open = isReconcileOpen(me.user.email);
  const now = new Date();
  const today = dubaiDateKey(now);
  const days: string[] = [];
  for (let d = new Date(`${today}T00:00:00Z`); d.toISOString().slice(0, 10) >= RECONCILE_FROM; d.setUTCDate(d.getUTCDate() - 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  const byDay = new Map<string, typeof entries>();
  for (const e of entries) {
    const k = dubaiDateKey(e.clockIn);
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }
  const options = mine.map((m) => ({ id: m.id, label: `${m.company.name} — ${m.title}` }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">Reconcile my attendance</h1>
        <p className="text-[19px] text-slate-500">
          {open
            ? `The window is open until ${reconcileEndLabel(me.user.email)}. Correct a login/logout time or add a missed shift, with a reason. Every change is flagged as a manual change and shows that way in attendance reports.`
            : `Reconciliation window: ${RECONCILE_WINDOW.label} on 22 Oct 2026. It is closed right now, so these records are read-only.`}
        </p>
      </div>
      {days.map((day) => {
        const list = byDay.get(day) ?? [];
        return (
          <Card key={day}>
            <div className="mb-2 text-[19px] font-semibold text-slate-900">
              {new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
            </div>
            <div className="space-y-2">
              {list.map((e) => {
                const stillOpenToday = !e.clockOut && day === today;
                return (
                  <div key={e.id} className="space-y-1">
                    <EntryForm
                      entryId={e.id}
                      inTime={hhmm(e.clockIn)}
                      outTime={e.clockOut ? hhmm(e.clockOut) : ""}
                      canEditOut={!stillOpenToday}
                      note={e.manualNote ?? ""}
                      disabled={!open}
                    />
                    {e.isManual && (
                      <div className="flex flex-wrap items-center gap-3 text-[15px] text-amber-700">
                        <span>Manual change{e.origClockIn ? ` — was ${formatDubaiTime(e.origClockIn)}${e.origClockOut ? ` to ${formatDubaiTime(e.origClockOut)}` : ""}` : " — added by hand"}</span>
                        {open && !e.origClockIn && <RemoveButton entryId={e.id} />}
                      </div>
                    )}
                  </div>
                );
              })}
              {list.length === 0 && <div className="text-[17px] text-slate-500">No login recorded.</div>}
              <AddForm date={day} memberships={options} disabled={!open} openEnded={day === today} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
