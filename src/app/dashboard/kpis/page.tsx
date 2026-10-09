import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, isManagingDirector } from "@/lib/auth";
import { getKpisFor, getCompletionsFor, kpiScore } from "@/lib/queries";
import { buildCompletionRollup } from "@/lib/completions";
import { Card, DonutChart, CompanyTag } from "@/components/ui";
import { CompletionRollup } from "@/components/CompletionRollup";

export default async function MyKpisPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (isManagingDirector(membership)) redirect("/director/kpi");

  // Anyone holding more than one company membership (e.g. Abraham, Jai) sees
  // their KPIs and completions merged across every company they belong to,
  // tagged by company — one profile, not split by whichever is active.
  const allMemberships = await prisma.membership.findMany({
    where: { userId: membership.userId },
    include: { company: true },
  });
  const showCompanyTag = allMemberships.length > 1;

  const kpis: (Awaited<ReturnType<typeof getKpisFor>>[number] & { companySlug: string })[] = [];
  const completions: Awaited<ReturnType<typeof getCompletionsFor>> = [];
  for (const m of allMemberships) {
    const [mKpis, mCompletions] = await Promise.all([getKpisFor(m.id), getCompletionsFor(m.id)]);
    kpis.push(...mKpis.map((k) => ({ ...k, companySlug: m.company.slug })));
    completions.push(...mCompletions);
  }

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
                <h2 className="flex items-center gap-2 text-[21px] font-medium text-slate-900">
                  {showCompanyTag && <CompanyTag slug={kpi.companySlug} />}
                  {kpi.name}
                </h2>
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
