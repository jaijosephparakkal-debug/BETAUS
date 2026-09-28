import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import {
  getCompanyRollup,
  getOrgTree,
  getAtRiskTasks,
  getTasksFor,
  getKpisFor,
  kpiScore,
} from "@/lib/queries";
import { Card, SegmentedDonut, StatusBadge, ProgressBar, CompanyTag, formatDate, isOverdue } from "@/components/ui";
import { MergedOrgChart } from "@/components/OrgChart";
import { getCompanyTheme } from "@/lib/theme";

const STATUS_COLORS = { COMPLETED: "#10b981", IN_PROGRESS: "#f59e0b", NOT_STARTED: "#94a3b8" };

function StatBox({ value, label, color = "text-slate-900" }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className={`text-[23px] font-semibold ${color}`}>{value}</div>
      <div className="text-[15px] text-slate-500">{label}</div>
    </div>
  );
}

export default async function DirectorPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  // Only ever two companies system-wide — a director sees both merged into
  // one page, regardless of which single company they actually signed in
  // through. No company-switching involved anywhere on this page.
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  // Sequential rather than Promise.all — see dashboard/layout.tsx for why.
  const perCompany: {
    company: { id: string; slug: string; name: string };
    rollup: Awaited<ReturnType<typeof getCompanyRollup>>;
    orgTree: Awaited<ReturnType<typeof getOrgTree>>;
    atRiskTasks: Awaited<ReturnType<typeof getAtRiskTasks>>;
    pendingApprovalCount: number;
  }[] = [];
  for (const c of companies) {
    const rollup = await getCompanyRollup(c.id);
    const orgTree = await getOrgTree(c.id);
    const atRiskTasks = await getAtRiskTasks(c.id);
    const pendingApprovalCount = await prisma.approvalRequest.count({
      where: { companyId: c.id, status: "PENDING" },
    });
    perCompany.push({ company: { id: c.id, slug: c.slug, name: c.name }, rollup, orgTree, atRiskTasks, pendingApprovalCount });
  }

  const overall = {
    headcount: perCompany.reduce((s, b) => s + b.rollup.headcount, 0),
    totalTasks: perCompany.reduce((s, b) => s + b.rollup.totalTasks, 0),
    completedTasks: perCompany.reduce((s, b) => s + b.rollup.completedTasks, 0),
    inProgressTasks: perCompany.reduce((s, b) => s + b.rollup.inProgressTasks, 0),
    notStartedTasks: perCompany.reduce((s, b) => s + b.rollup.notStartedTasks, 0),
    overdueTasks: perCompany.reduce((s, b) => s + b.rollup.overdueTasks, 0),
    pendingApprovals: perCompany.reduce((s, b) => s + b.pendingApprovalCount, 0),
  };
  const overallCompletionPct = overall.totalTasks
    ? Math.round((overall.completedTasks / overall.totalTasks) * 100)
    : 0;
  const totalKpiCount = perCompany.reduce((s, b) => s + b.rollup.kpiCount, 0);
  const overallAvgKpi = totalKpiCount
    ? Math.round(perCompany.reduce((s, b) => s + b.rollup.avgKpiScore * b.rollup.kpiCount, 0) / totalKpiCount)
    : 0;

  // One merged at-risk list across both companies, most overdue first.
  const mergedAtRisk = perCompany
    .flatMap((b) => b.atRiskTasks.map((t) => ({ ...t, companySlug: b.company.slug })))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // "My Tasks" / "My KPIs" are personal — based on whichever membership(s)
  // this specific person actually holds (usually just one) — merged into a
  // single tagged list rather than grouped per company.
  const memberships = await prisma.membership.findMany({
    where: { userId: membership.userId },
    include: { company: true },
  });
  const myTasks: (Awaited<ReturnType<typeof getTasksFor>>[number] & { companySlug: string })[] = [];
  const myKpis: (Awaited<ReturnType<typeof getKpisFor>>[number] & { companySlug: string })[] = [];
  for (const m of memberships) {
    const tasks = await getTasksFor(m.id);
    const kpis = await getKpisFor(m.id);
    myTasks.push(...tasks.map((t) => ({ ...t, companySlug: m.company.slug })));
    myKpis.push(...kpis.map((k) => ({ ...k, companySlug: m.company.slug })));
  }
  const showTags = memberships.length > 1;

  const directorName = perCompany[0]?.orgTree?.name ?? membership.user.name;
  const directorTitle = perCompany[0]?.orgTree?.title ?? membership.title;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {perCompany.map((b, i) => {
              const theme = getCompanyTheme(b.company.slug);
              return (
                <div
                  key={b.company.id}
                  className={`rounded-lg border-2 border-white bg-brand-50 p-1 shadow-sm ${i > 0 ? "-ml-2.5" : ""}`}
                  style={{ zIndex: perCompany.length - i }}
                >
                  <Image src={theme.logo} alt={theme.displayName} width={theme.logoWidth} height={theme.logoHeight} className="h-7 w-auto" />
                </div>
              );
            })}
          </div>
          <div>
            <h1 className="text-[23px] font-semibold text-slate-900">Overview</h1>
            <p className="text-[17px] text-slate-500">
              {membership.user.name} · {perCompany.map((b) => b.company.name).join(" & ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-[17px]">
          <Link href="/director/kpi-percentage" className="text-brand-600 hover:underline">
            KPI Percentage
          </Link>
          <Link href="/director/attendance" className="text-brand-600 hover:underline">
            Attendance
          </Link>
          <Link href="/director/approvals" className="text-brand-600 hover:underline">
            Approvals{overall.pendingApprovals > 0 ? ` (${overall.pendingApprovals})` : ""}
          </Link>
        </div>
      </div>

      <Card>
        <h2 className="mb-1 text-[21px] font-semibold text-slate-900">Combined performance</h2>
        <p className="mb-3 text-[15px] text-slate-500">Every number below is both firms added together.</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatBox value={overall.headcount} label="Employees" />
          <StatBox value={`${overall.completedTasks}/${overall.totalTasks}`} label="Tasks completed" />
          <StatBox value={overall.inProgressTasks} label="In progress" />
          <StatBox value={overall.overdueTasks} label="Overdue" color="text-red-600" />
          <StatBox value={`${overallAvgKpi}%`} label="Avg. KPI" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-8 border-t border-brand-100 pt-4">
          <SegmentedDonut
            size={100}
            strokeWidth={12}
            centerLabel={`${overallCompletionPct}%`}
            segments={[
              { label: "Completed", value: overall.completedTasks, color: STATUS_COLORS.COMPLETED },
              { label: "In progress", value: overall.inProgressTasks, color: STATUS_COLORS.IN_PROGRESS },
              { label: "Not started", value: overall.notStartedTasks, color: STATUS_COLORS.NOT_STARTED },
            ]}
          />
          <div className="space-y-1.5 text-[15px] text-slate-500">
            {perCompany.map((b) => (
              <div key={b.company.id} className="flex items-center gap-2">
                <CompanyTag slug={b.company.slug} />
                {b.rollup.completedTasks}/{b.rollup.totalTasks} completed, {b.rollup.avgKpiScore}% avg KPI
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">My tasks</h2>
        {myTasks.length === 0 ? (
          <p className="text-[17px] text-slate-500">No tasks.</p>
        ) : (
          <div className="space-y-2">
            {myTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="rounded-lg border border-slate-100 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    {showTags && <CompanyTag slug={task.companySlug} />}
                    <span className="truncate text-[17px] font-medium text-slate-900">{task.title}</span>
                  </span>
                  <StatusBadge status={task.status} />
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={task.progress} />
                </div>
                <div className="mt-1 text-[15px] text-slate-500">
                  <span className={isOverdue(task.deadline, task.status) ? "font-medium text-red-600" : ""}>
                    Due {formatDate(task.deadline)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">My KPIs</h2>
        {myKpis.length === 0 ? (
          <p className="text-[17px] text-slate-500">No KPIs set.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myKpis.map((k) => (
              <div key={k.id}>
                <div className="flex items-center justify-between text-[17px]">
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    {showTags && <CompanyTag slug={k.companySlug} />}
                    {k.name}
                  </span>
                  <span className="text-slate-500">{kpiScore(k)}%</span>
                </div>
                <ProgressBar value={kpiScore(k)} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">
          At risk — {mergedAtRisk.length} overdue task{mergedAtRisk.length === 1 ? "" : "s"}
        </h2>
        {mergedAtRisk.length === 0 ? (
          <p className="text-[19px] text-slate-500">Nothing overdue right now.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {mergedAtRisk.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <CompanyTag slug={t.companySlug} />
                  <div className="min-w-0">
                    <div className="truncate text-[19px] font-medium text-slate-900">{t.title}</div>
                    <div className="text-[17px] text-slate-500">{t.assigneeName} · {t.progress}% done</div>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[17px] font-medium text-red-400">
                  {t.daysOverdue}d overdue
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Org chart</h2>
        <MergedOrgChart
          directorName={directorName}
          directorTitle={directorTitle}
          branches={perCompany.map((b) => ({
            label: b.company.name,
            color: b.company.slug === "gasneeds" ? "#d30a0a" : "#007ec8",
            tree: b.orgTree,
          }))}
        />
      </Card>
    </div>
  );
}
