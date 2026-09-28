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
import { Card, SegmentedDonut, StatusBadge, ProgressBar, formatDate, isOverdue } from "@/components/ui";
import { OrgChart } from "@/components/OrgChart";
import { getCompanyTheme } from "@/lib/theme";

const STATUS_COLORS = { COMPLETED: "#10b981", IN_PROGRESS: "#f59e0b", NOT_STARTED: "#94a3b8" };

type Rollup = Awaited<ReturnType<typeof getCompanyRollup>>;
type OrgTree = Awaited<ReturnType<typeof getOrgTree>>;
type AtRisk = Awaited<ReturnType<typeof getAtRiskTasks>>;

function StatBox({ value, label, color = "text-slate-900" }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className={`text-[23px] font-semibold ${color}`}>{value}</div>
      <div className="text-[15px] text-slate-500">{label}</div>
    </div>
  );
}

function CompanyBoardSection({
  company,
  rollup,
  orgTree,
  atRiskTasks,
  pendingApprovalCount,
}: {
  company: { id: string; slug: string; name: string };
  rollup: Rollup;
  orgTree: OrgTree;
  atRiskTasks: AtRisk;
  pendingApprovalCount: number;
}) {
  const theme = getCompanyTheme(company.slug);
  const completionPct = rollup.totalTasks ? Math.round((rollup.completedTasks / rollup.totalTasks) * 100) : 0;

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-1">
            <Image src={theme.logo} alt={theme.displayName} width={theme.logoWidth} height={theme.logoHeight} className="h-8 w-auto" />
          </div>
          <h2 className="text-[21px] font-semibold text-slate-900">{company.name}</h2>
        </div>
        <div className="flex flex-wrap gap-3 text-[17px]">
          <Link href="/director/kpi-percentage" className="text-brand-600 hover:underline">
            KPI Percentage
          </Link>
          <Link href="/director/attendance" className="text-brand-600 hover:underline">
            Attendance
          </Link>
          <Link href="/director/approvals" className="text-brand-600 hover:underline">
            Approvals{pendingApprovalCount > 0 ? ` (${pendingApprovalCount})` : ""}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox value={rollup.headcount} label="Employees" />
        <StatBox value={`${rollup.completedTasks}/${rollup.totalTasks}`} label="Tasks completed" />
        <StatBox value={rollup.overdueTasks} label="Overdue" color="text-red-600" />
        <StatBox value={`${rollup.avgKpiScore}%`} label="Avg. KPI" />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <SegmentedDonut
          size={90}
          strokeWidth={10}
          centerLabel={`${completionPct}%`}
          segments={[
            { label: "Completed", value: rollup.completedTasks, color: STATUS_COLORS.COMPLETED },
            { label: "In progress", value: rollup.inProgressTasks, color: STATUS_COLORS.IN_PROGRESS },
            { label: "Not started", value: rollup.notStartedTasks, color: STATUS_COLORS.NOT_STARTED },
          ]}
        />
        <div className="min-w-[200px] flex-1">
          <div className="text-[15px] font-medium text-slate-700">
            {atRiskTasks.length} overdue task{atRiskTasks.length === 1 ? "" : "s"}
          </div>
          {atRiskTasks.length === 0 ? (
            <p className="mt-1 text-[15px] text-slate-500">Nothing overdue right now.</p>
          ) : (
            <div className="mt-1 space-y-1">
              {atRiskTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="text-[15px] text-slate-500">
                  {t.title} — {t.assigneeName} ({t.daysOverdue}d)
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-[17px] font-medium text-slate-700">Org chart</h3>
        <OrgChart orgTree={orgTree} linkable={false} />
      </div>
    </Card>
  );
}

export default async function DirectorPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  // Only ever two companies system-wide — a director sees both together on
  // one page, regardless of which single company they actually signed in
  // through. No company-switching involved anywhere on this page.
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  // Sequential rather than Promise.all — see dashboard/layout.tsx for why.
  const boards: {
    company: { id: string; slug: string; name: string };
    rollup: Rollup;
    orgTree: OrgTree;
    atRiskTasks: AtRisk;
    pendingApprovalCount: number;
  }[] = [];
  for (const c of companies) {
    const rollup = await getCompanyRollup(c.id);
    const orgTree = await getOrgTree(c.id);
    const atRiskTasks = await getAtRiskTasks(c.id);
    const pendingApprovalCount = await prisma.approvalRequest.count({
      where: { companyId: c.id, status: "PENDING" },
    });
    boards.push({ company: { id: c.id, slug: c.slug, name: c.name }, rollup, orgTree, atRiskTasks, pendingApprovalCount });
  }

  const overall = {
    headcount: boards.reduce((s, b) => s + b.rollup.headcount, 0),
    totalTasks: boards.reduce((s, b) => s + b.rollup.totalTasks, 0),
    completedTasks: boards.reduce((s, b) => s + b.rollup.completedTasks, 0),
    inProgressTasks: boards.reduce((s, b) => s + b.rollup.inProgressTasks, 0),
    notStartedTasks: boards.reduce((s, b) => s + b.rollup.notStartedTasks, 0),
    overdueTasks: boards.reduce((s, b) => s + b.rollup.overdueTasks, 0),
  };
  const overallCompletionPct = overall.totalTasks
    ? Math.round((overall.completedTasks / overall.totalTasks) * 100)
    : 0;
  const totalKpiCount = boards.reduce((s, b) => s + b.rollup.kpiCount, 0);
  const overallAvgKpi = totalKpiCount
    ? Math.round(boards.reduce((s, b) => s + b.rollup.avgKpiScore * b.rollup.kpiCount, 0) / totalKpiCount)
    : 0;

  // "My Tasks" / "My KPIs" are personal — based on whichever membership(s)
  // this specific person actually holds (usually just one).
  const memberships = await prisma.membership.findMany({
    where: { userId: membership.userId },
    include: { company: true },
  });
  const myTasksByCompany: { company: { id: string; name: string }; tasks: Awaited<ReturnType<typeof getTasksFor>> }[] = [];
  const myKpisByCompany: { company: { id: string; name: string }; kpis: Awaited<ReturnType<typeof getKpisFor>> }[] = [];
  for (const m of memberships) {
    const tasks = await getTasksFor(m.id);
    const kpis = await getKpisFor(m.id);
    myTasksByCompany.push({ company: { id: m.company.id, name: m.company.name }, tasks });
    myKpisByCompany.push({ company: { id: m.company.id, name: m.company.name }, kpis });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">Overall Performance — Both Companies</h1>
        <p className="text-[17px] text-slate-500">
          {membership.user.name} · {boards.map((b) => b.company.name).join(" + ")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatBox value={overall.headcount} label="Total employees" />
        <StatBox value={`${overall.completedTasks}/${overall.totalTasks}`} label="Tasks completed" />
        <StatBox value={overall.inProgressTasks} label="In progress" />
        <StatBox value={overall.overdueTasks} label="Overdue" color="text-red-600" />
        <StatBox value={`${overallAvgKpi}%`} label="Avg. KPI" />
      </div>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Combined task status</h2>
        <div className="flex flex-wrap items-center gap-8">
          <SegmentedDonut
            size={110}
            strokeWidth={13}
            centerLabel={`${overallCompletionPct}%`}
            segments={[
              { label: "Completed", value: overall.completedTasks, color: STATUS_COLORS.COMPLETED },
              { label: "In progress", value: overall.inProgressTasks, color: STATUS_COLORS.IN_PROGRESS },
              { label: "Not started", value: overall.notStartedTasks, color: STATUS_COLORS.NOT_STARTED },
            ]}
          />
          <div className="space-y-1 text-[17px] text-slate-600">
            {boards.map((b) => (
              <div key={b.company.id}>
                {b.company.name}: {b.rollup.completedTasks}/{b.rollup.totalTasks} completed,{" "}
                {b.rollup.avgKpiScore}% avg KPI
              </div>
            ))}
          </div>
        </div>
      </Card>

      {myTasksByCompany.length > 0 && (
        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">My tasks</h2>
          <div className="space-y-5">
            {myTasksByCompany.map(({ company, tasks }) => (
              <div key={company.id}>
                {myTasksByCompany.length > 1 && (
                  <div className="mb-2 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
                    {company.name}
                  </div>
                )}
                {tasks.length === 0 ? (
                  <p className="text-[17px] text-slate-500">No tasks.</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="rounded-lg border border-slate-100 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[17px] font-medium text-slate-900">{task.title}</span>
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
              </div>
            ))}
          </div>
        </Card>
      )}

      {myKpisByCompany.length > 0 && (
        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">My KPIs</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {myKpisByCompany.map(({ company, kpis }) => (
              <div key={company.id}>
                {myKpisByCompany.length > 1 && (
                  <div className="mb-2 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
                    {company.name}
                  </div>
                )}
                {kpis.length === 0 ? (
                  <p className="text-[17px] text-slate-500">No KPIs set.</p>
                ) : (
                  <div className="space-y-3">
                    {kpis.map((k) => (
                      <div key={k.id}>
                        <div className="flex items-center justify-between text-[17px]">
                          <span className="font-medium text-slate-900">{k.name}</span>
                          <span className="text-slate-500">{kpiScore(k)}%</span>
                        </div>
                        <ProgressBar value={kpiScore(k)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {boards.map((b) => (
        <CompanyBoardSection key={b.company.id} {...b} />
      ))}
    </div>
  );
}
