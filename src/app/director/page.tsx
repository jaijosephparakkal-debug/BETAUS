import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getCompanyRollup, getOrgTree, getAtRiskTasks } from "@/lib/queries";
import { Card, DonutChart, BarChart } from "@/components/ui";
import { OrgChart } from "@/components/OrgChart";

export default async function DirectorPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  const [rollup, orgTree, atRiskTasks] = await Promise.all([
    getCompanyRollup(membership.companyId),
    getOrgTree(membership.companyId),
    getAtRiskTasks(membership.companyId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[23px] font-semibold text-slate-900">
          {membership.company.name} — Company Dashboard
        </h1>
        <div className="flex gap-3 text-[19px]">
          <Link href="/director/approvals" className="text-brand-600 hover:underline">
            Company approvals
          </Link>
          <Link href="/director/message" className="text-brand-600 hover:underline">
            Post message
          </Link>
          <Link href="/director/employees" className="text-brand-600 hover:underline">
            Manage employees
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <div className="text-[29px] font-semibold">{rollup.headcount}</div>
          <div className="text-[19px] text-slate-500">Employees</div>
        </Card>
        <Card>
          <div className="text-[29px] font-semibold">
            {rollup.completedTasks}/{rollup.totalTasks}
          </div>
          <div className="text-[19px] text-slate-500">Tasks completed</div>
        </Card>
        <Card>
          <div className="text-[29px] font-semibold text-red-600">
            {rollup.overdueTasks}
          </div>
          <div className="text-[19px] text-slate-500">Overdue tasks</div>
        </Card>
        <Card>
          <div className="text-[29px] font-semibold">{rollup.avgKpiScore}%</div>
          <div className="text-[19px] text-slate-500">Avg. company KPI</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center">
          <h2 className="mb-3 self-start font-semibold text-slate-900">
            Overall task progress
          </h2>
          <DonutChart value={rollup.avgTaskProgress} />
          <div className="mt-2 text-[19px] text-slate-500">
            average across {rollup.totalTasks} tasks
          </div>
        </Card>
        <Card className="flex flex-col items-center text-center">
          <h2 className="mb-3 self-start font-semibold text-slate-900">
            Overall KPI achievement
          </h2>
          <DonutChart value={rollup.avgKpiScore} />
          <div className="mt-2 text-[19px] text-slate-500">
            average across {rollup.kpiCount} KPIs
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">
            Task status breakdown
          </h2>
          <BarChart
            data={[
              {
                label: "Not started",
                value: rollup.notStartedTasks,
                colorClass: "bg-slate-400",
              },
              {
                label: "In progress",
                value: rollup.inProgressTasks,
                colorClass: "bg-amber-500",
              },
              {
                label: "Completed",
                value: rollup.completedTasks,
                colorClass: "bg-emerald-500",
              },
            ]}
          />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">
          At risk — {atRiskTasks.length} overdue task
          {atRiskTasks.length === 1 ? "" : "s"}
        </h2>
        {atRiskTasks.length === 0 ? (
          <p className="text-[19px] text-slate-500">Nothing overdue right now.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {atRiskTasks.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/team/${t.assigneeId}`}
                className="flex items-center justify-between gap-3 py-2.5 hover:bg-brand-50/40"
              >
                <div>
                  <div className="text-[19px] font-medium text-slate-900">
                    {t.title}
                  </div>
                  <div className="text-[17px] text-slate-500">
                    {t.assigneeName} · {t.progress}% done
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[17px] font-medium text-red-400">
                  {t.daysOverdue}d overdue
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Org chart</h2>
        <OrgChart orgTree={orgTree} linkable />
      </Card>
    </div>
  );
}
