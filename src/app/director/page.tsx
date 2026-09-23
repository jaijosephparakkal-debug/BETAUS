import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import {
  getCompanyRollup,
  getOrgTree,
  getAtRiskTasks,
  type OrgNode,
} from "@/lib/queries";
import { Card, DonutChart, BarChart } from "@/components/ui";

function OrgNodeCard({ node }: { node: OrgNode }) {
  return (
    <div
      className={`w-40 rounded-xl border px-3 py-2.5 text-center shadow-sm transition ${
        node.isDirector
          ? "border-brand-500 bg-brand-50"
          : "border-brand-200 bg-surface hover:border-brand-200"
      }`}
    >
      <div className="truncate text-sm font-semibold text-slate-900">
        {node.name}
      </div>
      <div className="truncate text-xs text-slate-500">{node.title}</div>
      {node.department && (
        <div className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700">
          {node.department}
        </div>
      )}
    </div>
  );
}

function OrgTreeNode({ node }: { node: OrgNode }) {
  return (
    <li>
      {node.isDirector ? (
        <OrgNodeCard node={node} />
      ) : (
        <Link href={`/dashboard/team/${node.id}`} className="block hover:opacity-80">
          <OrgNodeCard node={node} />
        </Link>
      )}
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <OrgTreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

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
        <h1 className="text-lg font-semibold text-slate-900">
          {membership.company.name} — Company Dashboard
        </h1>
        <div className="flex gap-3 text-sm">
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
          <div className="text-2xl font-semibold">{rollup.headcount}</div>
          <div className="text-sm text-slate-500">Employees</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold">
            {rollup.completedTasks}/{rollup.totalTasks}
          </div>
          <div className="text-sm text-slate-500">Tasks completed</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold text-red-600">
            {rollup.overdueTasks}
          </div>
          <div className="text-sm text-slate-500">Overdue tasks</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold">{rollup.avgKpiScore}%</div>
          <div className="text-sm text-slate-500">Avg. company KPI</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center">
          <h2 className="mb-3 self-start font-semibold text-slate-900">
            Overall task progress
          </h2>
          <DonutChart value={rollup.avgTaskProgress} />
          <div className="mt-2 text-sm text-slate-500">
            average across {rollup.totalTasks} tasks
          </div>
        </Card>
        <Card className="flex flex-col items-center text-center">
          <h2 className="mb-3 self-start font-semibold text-slate-900">
            Overall KPI achievement
          </h2>
          <DonutChart value={rollup.avgKpiScore} />
          <div className="mt-2 text-sm text-slate-500">
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
          <p className="text-sm text-slate-500">Nothing overdue right now.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {atRiskTasks.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/team/${t.assigneeId}`}
                className="flex items-center justify-between gap-3 py-2.5 hover:bg-brand-50/40"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {t.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t.assigneeName} · {t.progress}% done
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {t.daysOverdue}d overdue
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Org chart</h2>
        {orgTree ? (
          <div className="overflow-x-auto pb-2">
            <ul className="org-tree min-w-max px-4">
              <OrgTreeNode node={orgTree} />
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No org chart yet.</p>
        )}
      </Card>
    </div>
  );
}
