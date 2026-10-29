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

  // The director's own days, with the times they gave. Today has a login only; the logout is recorded when they sign out.
  const rows = [
    { date: "2026-10-23", in: "07:42", out: "18:00" },
    { date: "2026-10-24", in: "07:47", out: "18:00" },
    { date: "2026-10-26", in: "07:49", out: "17:45" },
    { date: "2026-10-27", in: "07:39", out: "17:32" },
    { date: "2026-10-28", in: "07:30", out: "17:50" },
    { date: "2026-10-29", in: "07:48", out: "" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">Add my days — manual entries</h1>
      <p className="text-[19px] text-slate-500">These shifts are saved as manual entries, flagged as “Corrected manually”. Today has a login only; the logout is recorded when you sign out. Your existing recorded entries are left as they are.</p>
      <Card>
        <table className="mb-4 w-full text-[19px]">
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 text-slate-900">{new Date(`${r.date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</td>
                <td className="py-1.5 text-slate-600">{r.in} → {r.out || "still in"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <BulkSave rows={rows} disabled={!isReconcileOpen(me.user.email)} />
      </Card>
    </div>
  );
}
