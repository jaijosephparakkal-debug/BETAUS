import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getKpisFor, getCompletionsFor, kpiScore } from "@/lib/queries";
import { buildCompletionRollup } from "@/lib/completions";
import { Card, DonutChart } from "@/components/ui";
import { CompletionRollup } from "@/components/CompletionRollup";

export default async function MyKpisPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const [kpis, completions] = await Promise.all([
    getKpisFor(membership.id),
    getCompletionsFor(membership.id),
  ]);
  const months = buildCompletionRollup(
    completions.map((c) => ({ id: c.id, title: c.title, completedAt: c.completedAt! }))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[23px] font-semibold text-slate-900">My KPIs</h1>
        <a
          href="/api/reports/my-kpi"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-[17px] font-medium text-white hover:bg-brand-700"
        >
          Download my report (PDF)
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {kpis.map((kpi) => {
          const score = kpiScore(kpi);
          return (
            <Card key={kpi.id} className="flex items-center gap-4">
              <DonutChart value={score} size={72} strokeWidth={8} />
              <div>
                <h2 className="text-[21px] font-medium text-slate-900">{kpi.name}</h2>
                {kpi.period && (
                  <div className="text-[17px] text-slate-500">{kpi.period}</div>
                )}
                <div className="mt-1 text-[17px] text-slate-500">
                  Current: {kpi.current}
                  {kpi.unit ?? ""} · Target: {kpi.target}
                  {kpi.unit ?? ""}
                </div>
              </div>
            </Card>
          );
        })}
        {kpis.length === 0 && (
          <p className="text-[19px] text-slate-500">No KPIs set yet.</p>
        )}
      </div>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">
          Completed tasks — by week, by month
        </h2>
        <CompletionRollup months={months} />
      </Card>
    </div>
  );
}
