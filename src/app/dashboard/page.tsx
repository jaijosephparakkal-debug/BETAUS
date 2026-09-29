import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import {
  getTasksFor,
  getKpisFor,
  getLatestDirectorMessage,
  getOrgTree,
  kpiScore,
} from "@/lib/queries";
import { Card, ProgressBar, StatusBadge, CompanyTag, formatDate, isOverdue } from "@/components/ui";
import { OrgChart } from "@/components/OrgChart";

export default async function DashboardOverviewPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  // Anyone holding more than one company membership (e.g. Abraham, Jai) sees
  // their own tasks/KPIs merged across every company they belong to, tagged
  // by company — one profile, not split by whichever company is active.
  // Message board and org chart stay scoped to the active company, since
  // those are company-wide/structural rather than personal.
  const allMemberships = await prisma.membership.findMany({
    where: { userId: membership.userId },
    include: { company: true },
  });
  const showCompanyTag = allMemberships.length > 1;

  const tasks: (Awaited<ReturnType<typeof getTasksFor>>[number] & { companySlug: string })[] = [];
  const kpis: (Awaited<ReturnType<typeof getKpisFor>>[number] & { companySlug: string })[] = [];
  for (const m of allMemberships) {
    const mTasks = await getTasksFor(m.id);
    const mKpis = await getKpisFor(m.id);
    tasks.push(...mTasks.map((t) => ({ ...t, companySlug: m.company.slug })));
    kpis.push(...mKpis.map((k) => ({ ...k, companySlug: m.company.slug })));
  }
  tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const message = await getLatestDirectorMessage(membership.companyId);
  const orgTree = await getOrgTree(membership.companyId);

  const activeTasks = tasks.filter((t) => t.status !== "COMPLETED");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const avgProgress = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
    : 0;

  return (
    <div className="space-y-6">
      {message && (
        <Card className="border-brand-200 bg-brand-50">
          <div className="text-[17px] font-semibold uppercase tracking-wide text-brand-700">
            Message from {message.author.user.name}
          </div>
          <p className="mt-1 text-[19px] text-slate-800">{message.body}</p>
          <div className="mt-2 text-[17px] text-slate-500">
            {formatDate(message.createdAt)}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <div className="text-[29px] font-semibold">{tasks.length}</div>
          <div className="text-[19px] text-slate-500">Total tasks</div>
        </Card>
        <Card>
          <div className="text-[29px] font-semibold">{inProgressTasks.length}</div>
          <div className="text-[19px] text-slate-500">In progress</div>
        </Card>
        <Card>
          <div className="text-[29px] font-semibold">{completedTasks.length}</div>
          <div className="text-[19px] text-slate-500">Completed</div>
        </Card>
        <Card>
          <div className="text-[29px] font-semibold">{avgProgress}%</div>
          <div className="text-[19px] text-slate-500">Avg. progress</div>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[21px] font-semibold text-slate-900">My tasks</h2>
            <Link href="/dashboard/tasks" className="text-[19px] text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {activeTasks.slice(0, 4).map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks/${task.id}`}
                className="block rounded-lg border border-slate-100 p-3 hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    {showCompanyTag && <CompanyTag slug={task.companySlug} />}
                    <span className="truncate text-[19px] font-medium text-slate-900">{task.title}</span>
                  </span>
                  <StatusBadge status={task.status} />
                </div>
                <div className="mt-2">
                  <ProgressBar value={task.progress} />
                </div>
                <div className="mt-1 text-[17px] text-slate-500">
                  <span className={isOverdue(task.deadline, task.status) ? "font-medium text-red-600" : ""}>
                    Due {formatDate(task.deadline)}
                  </span>
                </div>
              </Link>
            ))}
            {activeTasks.length === 0 && (
              <p className="text-[19px] text-slate-500">No tasks assigned yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[21px] font-semibold text-slate-900">My KPIs</h2>
            <Link href="/dashboard/kpis" className="text-[19px] text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {kpis.map((kpi) => (
              <div key={kpi.id}>
                <div className="flex items-center justify-between text-[19px]">
                  <span className="flex items-center gap-2 text-[21px] font-medium text-slate-900">
                    {showCompanyTag && <CompanyTag slug={kpi.companySlug} />}
                    {kpi.name}
                  </span>
                  <span className="text-slate-500">
                    {kpi.current}
                    {kpi.unit ?? ""} / {kpi.target}
                    {kpi.unit ?? ""}
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={kpiScore(kpi)} />
                </div>
              </div>
            ))}
            {kpis.length === 0 && (
              <p className="text-[19px] text-slate-500">No KPIs set yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Organisational structure</h2>
        <OrgChart orgTree={orgTree} />
      </Card>
    </div>
  );
}
