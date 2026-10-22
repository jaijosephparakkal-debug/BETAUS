import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { Card } from "@/components/ui";
import { isReconcileOpen, canBulkReconcile } from "@/lib/reconcile";
import BulkSave from "./BulkSave";

// Days that were holidays — no shift is proposed for these.
const HOLIDAYS = new Set(["2026-10-03", "2026-10-04", "2026-10-11", "2026-10-17", "2026-10-18"]);

// September hours: in 7:45–7:50, out 5:00–5:20 PM. October: in 7:55–8:10, out 5:45–6:00 PM.
const SEP_IN = ["07:45", "07:47", "07:46", "07:49", "07:48"];
const SEP_OUT = ["17:08", "17:15", "17:02", "17:19", "17:11"];
const OCT_IN = ["07:58", "08:04", "07:55", "08:07", "08:01", "07:57", "08:09", "08:03", "07:59", "08:10", "07:56", "08:05", "08:02", "08:06", "07:58", "08:00"];
const OCT_OUT = ["17:48", "17:55", "17:52", "18:00", "17:47", "17:58", "17:45", "17:56", "17:50", "17:53", "17:49", "17:57", "17:51", "17:46", "17:59", "17:54"];

export default async function BulkReconcilePage() {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!canBulkReconcile(me.user.email)) redirect("/dashboard/reconcile");

  const days: string[] = [];
  for (let d = new Date("2026-09-26T00:00:00Z"); d.toISOString().slice(0, 10) <= "2026-10-21"; d.setUTCDate(d.getUTCDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    if (!HOLIDAYS.has(k)) days.push(k);
  }
  let si = 0;
  let oi = 0;
  const rows = days.map((date) => {
    if (date < "2026-10-01") {
      const r = { date, in: SEP_IN[si % SEP_IN.length], out: SEP_OUT[si % SEP_OUT.length] };
      si++;
      return r;
    }
    const r = { date, in: OCT_IN[oi % OCT_IN.length], out: OCT_OUT[oi % OCT_OUT.length] };
    oi++;
    return r;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">Add my usual hours — manual entries</h1>
      <p className="text-[19px] text-slate-500">
        One shift per day from 26 Sep to 21 Oct, except the holidays (3, 4, 11, 17, 18 Oct). Every shift is saved as a manual entry with the note
        “worked but did not log in; usual hours entered manually”. Your existing recorded entries are left as they are.
      </p>
      <Card>
        <table className="mb-4 w-full text-[19px]">
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 text-slate-900">{new Date(`${r.date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</td>
                <td className="py-1.5 text-slate-600">{r.in} → {r.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <BulkSave rows={rows} disabled={!isReconcileOpen(me.user.email)} />
      </Card>
    </div>
  );
}
