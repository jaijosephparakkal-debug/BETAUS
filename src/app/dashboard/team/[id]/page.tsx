import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, isManagerOf } from "@/lib/auth";
import {
  getTasksFor,
  getKpisFor,
  getTimelineFor,
  getCompletionsFor,
  kpiScore,
} from "@/lib/queries";
import { buildCompletionRollup } from "@/lib/completions";
import { Card, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { CompletionRollup } from "@/components/CompletionRollup";
import { AssignTaskForm, SetKpiForm } from "./ManageForms";

export default async function TeamMemberPage({
  params,
}: {
  params: { id: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const target = await prisma.membership.findUnique({
    where: { id: params.id },
    include: { user: true, company: true, reports: { include: { user: true } } },
  });
  if (!target || target.companyId !== membership.companyId) notFound();

  const canManage =
    membership.isDirector || (await isManagerOf(membership.id, target.id));
  if (!canManage) redirect("/dashboard/team");

  const [tasks, kpis, timeline, completions, projects] = await Promise.all([
    getTasksFor(target.id),
    getKpisFor(target.id),
    getTimelineFor(target.id),
    getCompletionsFor(target.id),
    prisma.project.findMany({
      where: { companyId: membership.companyId },
      select: { id: true, name: true, number: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const completionMonths = buildCompletionRollup(
    completions.map((c) => ({ id: c.id, title: c.title, completedAt: c.completedAt! }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[23px] font-semibold text-slate-900">{target.user.name}</h1>
          <div className="text-[19px] text-slate-500">{target.title}</div>
        </div>
        <a
          href={`/api/reports/my-kpi?membershipId=${target.id}`}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-[17px] font-medium text-white hover:bg-brand-700"
        >
          Download report (PDF)
        </a>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[21px] font-semibold text-slate-900">Tasks</h2>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[19px] font-medium text-slate-900">
                    {task.title}
                  </span>
                  <StatusBadge status={task.status} />
                </div>
                {task.project && (
                  <Link
                    href={`/dashboard/projects/${task.project.id}`}
                    className="mt-1 inline-block text-[17px] text-brand-600 hover:underline"
                  >
                    {task.project.number
                      ? `${task.project.number} — ${task.project.name}`
                      : task.project.name}
                  </Link>
                )}
                <div className="mt-2">
                  <ProgressBar value={task.progress} />
                </div>
                <div className="mt-1 text-[17px] text-slate-500">
                  Due {formatDate(task.deadline)}
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-[19px] text-slate-500">No tasks assigned yet.</p>
            )}
          </div>
          <div className="mt-4 border-t border-brand-100 pt-4">
            <AssignTaskForm membershipId={target.id} projects={projects} />
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">KPIs</h2>
          <div className="space-y-3">
            {kpis.map((kpi) => (
              <div key={kpi.id}>
                <div className="flex items-center justify-between text-[19px]">
                  <span className="text-[21px] font-medium text-slate-900">{kpi.name}</span>
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
          <div className="mt-4 border-t border-brand-100 pt-4">
            <SetKpiForm membershipId={target.id} />
          </div>
        </Card>
      </div>

      {target.reports.length > 0 && (
        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Direct reports</h2>
          <div className="space-y-2">
            {target.reports.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/team/${r.id}`}
                className="block rounded-lg border border-slate-100 p-3 hover:border-brand-200 hover:bg-brand-50/40"
              >
                <span className="text-[19px] font-medium text-slate-900">
                  {r.user.name}
                </span>
                <span className="ml-2 text-[17px] text-slate-500">{r.title}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">
          Completed tasks — by week, by month
        </h2>
        <CompletionRollup months={completionMonths} />
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Timeline</h2>
        <div className="space-y-4">
          {timeline.map((entry) => (
            <div key={entry.id} className="border-l-2 border-brand-200 pl-3">
              <div className="flex items-center gap-2 text-[17px] text-slate-500">
                <Link
                  href={`/dashboard/tasks/${entry.taskId}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {entry.taskTitle}
                </Link>
                <span>{formatDate(entry.at)}</span>
                <span>· set progress to {entry.progressAt}%</span>
              </div>
              <p className="mt-1 text-[19px] text-slate-800">{entry.body}</p>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="text-[19px] text-slate-500">No updates logged yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
