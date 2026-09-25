import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getKpisFor, kpiScore } from "@/lib/queries";
import { Card, DonutChart } from "@/components/ui";

export default async function MyKpisPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const kpis = await getKpisFor(membership.id);

  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">My KPIs</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {kpis.map((kpi) => {
          const score = kpiScore(kpi);
          return (
            <Card key={kpi.id} className="flex items-center gap-4">
              <DonutChart value={score} size={72} strokeWidth={8} />
              <div>
                <h2 className="font-medium text-slate-900">{kpi.name}</h2>
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
    </div>
  );
}
