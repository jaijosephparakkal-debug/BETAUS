import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMembership, hasCompanyAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STANDARD_SITE_TASKS, SITE_TASK_COMPANY_SLUG, canEditSiteTasks, siteTaskSummary } from "@/lib/siteTasks";
import { getProjectDetail } from "@/lib/queries";
import { buildCompletionRollup } from "@/lib/completions";
import { Card, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { CompletionRollup } from "@/components/CompletionRollup";
import { UpdateProjectStatusForm } from "./StatusForm";
import { SiteTasks } from "./SiteTasks";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const project = await getProjectDetail(params.id);
  // By person, not active company — the director holds memberships at both.
  if (!project || !(await hasCompanyAccess(membership, project.companyId))) notFound();

  const company = await prisma.company.findUnique({ where: { id: project.companyId } });
  const hasSiteTasks = company?.slug === SITE_TASK_COMPANY_SLUG;
  const siteTasks = hasSiteTasks
    ? await prisma.projectSiteTask.findMany({
        where: { projectId: project.id },
        orderBy: { sortOrder: "asc" },
        select: { id: true, title: true, weight: true, progress: true },
      })
    : [];
  const missingStandard = STANDARD_SITE_TASKS.filter((t) => !siteTasks.some((s) => s.title === t));

  const completionMonths = buildCompletionRollup(
    project.tasks
      .filter((t) => t.completedAt)
      .map((t) => ({
        id: t.id,
        title: t.title,
        completedAt: t.completedAt!,
        assigneeName: t.assignedTo.user.name,
      }))
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/projects" className="text-[19px] text-brand-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[23px] font-semibold text-slate-900">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        {project.number && (
          <div className="mt-1 text-[17px] text-slate-500">{project.number}</div>
        )}
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between text-[19px]">
          <span className="text-[21px] font-medium text-slate-900">Overall progress</span>
          <span className="text-slate-500">
            {project.hasWeights ? project.weightedProgress : project.avgProgress}%
          </span>
        </div>
        <ProgressBar value={project.hasWeights ? project.weightedProgress : project.avgProgress} />
        <div className="mt-2 text-[17px] text-slate-500">
          {project.hasWeights ? (
            <>
              Weighted by each stage&rsquo;s milestone share — {project.totalWeightAssigned}% of
              the 100% milestone weight has been assigned so far.
            </>
          ) : (
            <>
              {project.completedTasks}/{project.tasks.length} task
              {project.tasks.length === 1 ? "" : "s"} completed — average across every
              task linked to this project.
            </>
          )}
        </div>
        <div className="mt-4 border-t border-brand-100 pt-3">
          <UpdateProjectStatusForm projectId={project.id} currentStatus={project.status} />
        </div>
      </Card>

      {hasSiteTasks && (
        <Card>
          <h2 className="mb-1 text-[21px] font-semibold text-slate-900">Required site tasks</h2>
          <p className="mb-3 text-[15px] text-slate-500">
            Give each task a weight (% of the site work) and update its progress. Tap ✕ to remove a
            task this project doesn&rsquo;t need.
          </p>
          <SiteTasks
            projectId={project.id}
            tasks={siteTasks}
            missingStandard={[...missingStandard]}
            canEdit={canEditSiteTasks(membership.user)}
            summary={siteTaskSummary(siteTasks)}
          />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">
          Tasks on this project — what's been done so far
        </h2>
        <div className="divide-y divide-brand-100">
          {project.tasks.map((task) => (
            <Link
              key={task.id}
              href={`/dashboard/tasks/${task.id}`}
              className="block py-3 first:pt-0 last:pb-0 hover:bg-brand-50/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[19px] font-medium text-slate-900">{task.title}</span>
                <StatusBadge status={task.status} />
              </div>
              <div className="mt-2">
                <ProgressBar value={task.progress} />
              </div>
              <div className="mt-1 flex items-center justify-between text-[17px] text-slate-500">
                <span>
                  {task.assignedTo.user.name}
                  {task.subtasks.length > 0 &&
                    ` · ${task.subtasks.filter((s) => s.status === "COMPLETED").length}/${task.subtasks.length} daily tasks done`}
                  {task.stageOrder != null &&
                    ` · ${task.milestoneWeight != null ? `${task.milestoneWeight}% weight` : "not yet weighted"}`}
                </span>
                <span>Due {formatDate(task.deadline)}</span>
              </div>
            </Link>
          ))}
          {project.tasks.length === 0 && (
            <p className="text-[19px] text-slate-500">
              No tasks linked to this project yet — link one when assigning a task.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">
          Completed stages — by week, by month
        </h2>
        <CompletionRollup months={completionMonths} showAssignee />
      </Card>
    </div>
  );
}
