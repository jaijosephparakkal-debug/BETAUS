import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership, canManageAllStaff } from "@/lib/auth";
import { getKpiOverview } from "@/lib/queries";
import { getCompanyTheme } from "@/lib/theme";
import { Card, CompanyTag, ProgressBar } from "@/components/ui";

function scoreColor(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}
const pct = (score: number | null) => (score === null ? "—" : `${score}%`);

const SORTS = { low: "Lowest first", high: "Highest first", name: "A–Z" } as const;
type Sort = keyof typeof SORTS;

/** The director's KPI page: overall (both firms), GN and FT, then every staff member's KPIs. */
export default async function DirectorKpiPage({
  searchParams,
}: {
  searchParams: { company?: string; sort?: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  const { overall, perCompany, people } = await getKpiOverview();
  const company = perCompany.find((c) => c.slug === searchParams.company) ?? null;
  const sort: Sort = SORTS[searchParams.sort as Sort] ? (searchParams.sort as Sort) : "low";
  const staffLinks = canManageAllStaff(membership);

  const list = people
    .filter((p) => !company || p.companySlugs.includes(company.slug))
    .map((p) => {
      const kpis = company ? p.kpis.filter((k) => k.companySlug === company.slug) : p.kpis;
      const avgScore = kpis.length ? Math.round(kpis.reduce((s, k) => s + k.score, 0) / kpis.length) : null;
      return { ...p, kpis, avgScore };
    })
    .sort((a, b) => {
      // People with no KPIs set always go last.
      if (a.avgScore === null || b.avgScore === null) {
        return a.avgScore === b.avgScore ? a.name.localeCompare(b.name) : a.avgScore === null ? 1 : -1;
      }
      if (sort === "name") return a.name.localeCompare(b.name);
      return sort === "low" ? a.avgScore - b.avgScore : b.avgScore - a.avgScore;
    });

  const href = (next: { company?: string | null; sort?: string }) => {
    const params = new URLSearchParams();
    const c = next.company === undefined ? company?.slug : next.company;
    const s = next.sort ?? sort;
    if (c) params.set("company", c);
    if (s !== "low") params.set("sort", s);
    const qs = params.toString();
    return `/director/kpi${qs ? `?${qs}` : ""}#staff`;
  };
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-[15px] ${active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-brand-50"}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">KPI</h1>
        <p className="text-[17px] text-slate-500">
          KPI achievement (current vs target) across Flare Technical &amp; Gas Needs.
        </p>
      </div>

      {/* Overall + per company */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={href({ company: null })} className="block">
          <Card className={`h-full hover:border-brand-300 ${!company ? "ring-2 ring-brand-300" : ""}`}>
            <div className="text-[17px] text-slate-500">Overall — both firms</div>
            <div className={`text-[40px] font-semibold leading-tight ${scoreColor(overall.avgScore)}`}>
              {pct(overall.avgScore)}
            </div>
            <ProgressBar value={overall.avgScore ?? 0} />
            <div className="mt-2 text-[15px] text-slate-500">
              {overall.kpiCount} KPIs across {people.filter((p) => p.kpis.length > 0).length} people
            </div>
          </Card>
        </Link>
        {[...perCompany]
          .sort((a, b) => (a.slug === "gasneeds" ? -1 : b.slug === "gasneeds" ? 1 : 0))
          .map((c) => {
            const theme = getCompanyTheme(c.slug);
            return (
              <Link key={c.id} href={href({ company: c.slug })} className="block">
                <Card className={`h-full hover:border-brand-300 ${company?.slug === c.slug ? "ring-2 ring-brand-300" : ""}`}>
                  <div style={theme.vars} className="flex items-center gap-3">
                    <div className="rounded-lg border border-brand-200 bg-brand-50 p-1">
                      <Image src={theme.logo} alt={theme.displayName} width={theme.logoWidth} height={theme.logoHeight} className="h-9 w-auto" />
                    </div>
                    <div className="text-[17px] text-slate-500">{c.name}</div>
                  </div>
                  <div className={`mt-1 text-[40px] font-semibold leading-tight ${scoreColor(c.avgScore)}`}>
                    {pct(c.avgScore)}
                  </div>
                  <ProgressBar value={c.avgScore ?? 0} />
                  <div className="mt-2 text-[15px] text-slate-500">
                    {c.kpiCount} KPIs across {c.peopleWithKpis} people
                  </div>
                </Card>
              </Link>
            );
          })}
      </div>

      {/* Staff KPIs */}
      <Card>
        <div id="staff" className="mb-3 flex flex-wrap items-center justify-between gap-2 scroll-mt-4">
          <h2 className="text-[21px] font-semibold text-slate-900">
            Staff KPIs{company ? ` — ${company.name}` : ""} ({list.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <Link href={href({ company: null })} className={chip(!company)}>
              Both
            </Link>
            {perCompany.map((c) => (
              <Link key={c.id} href={href({ company: c.slug })} className={chip(company?.slug === c.slug)}>
                {c.name}
              </Link>
            ))}
            <span className="mx-1 h-5 w-px self-center bg-slate-200" />
            {(Object.keys(SORTS) as Sort[]).map((s) => (
              <Link key={s} href={href({ sort: s })} className={chip(sort === s)}>
                {SORTS[s]}
              </Link>
            ))}
          </div>
        </div>

        <div className="divide-y divide-brand-100">
          {list.map((p) => {
            const header = (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {p.companySlugs.map((s) => (
                    <CompanyTag key={s} slug={s} />
                  ))}
                  <div className="min-w-0">
                    <div className="text-[19px] font-medium text-slate-900">{p.name}</div>
                    <div className="text-[15px] text-slate-500">{p.titles.join(" / ")}</div>
                  </div>
                </div>
                <div className={`text-[23px] font-semibold ${scoreColor(p.avgScore)}`}>{pct(p.avgScore)}</div>
              </div>
            );
            return (
              <div key={p.userId} className="py-3">
                {staffLinks ? (
                  <Link href={`/director/staff/${p.userId}`} className="block rounded-md hover:bg-brand-50/40">
                    {header}
                  </Link>
                ) : (
                  header
                )}
                {p.kpis.length === 0 ? (
                  <p className="mt-1 text-[15px] text-slate-400">No KPIs set.</p>
                ) : (
                  <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {p.kpis.map((k) => (
                      <div key={k.id}>
                        <div className="flex items-center justify-between gap-2 text-[15px]">
                          <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
                            {p.companySlugs.length > 1 && <CompanyTag slug={k.companySlug} />}
                            <span className="break-words">{k.name}</span>
                          </span>
                          <span className="shrink-0 text-slate-500">
                            {k.current}
                            {k.unit ?? ""} / {k.target}
                            {k.unit ?? ""} · <span className={scoreColor(k.score)}>{k.score}%</span>
                          </span>
                        </div>
                        <ProgressBar value={k.score} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && <p className="py-4 text-[17px] text-slate-500">No staff here.</p>}
        </div>
      </Card>
    </div>
  );
}
