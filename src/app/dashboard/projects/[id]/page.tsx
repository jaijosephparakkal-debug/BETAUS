import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getProjectDetail } from "@/lib/queries";
import { Card, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { UpdateProjectStatusForm } from "./StatusForm";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const project = await getProjectDetail(params.id);
  if (!project || project.companyId !== membership.companyId) notFound();

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
          <span className="font-medium text-slate-900">Overall progress</span>
          <span className="text-slate-500">{project.avgProgress}%</span>
        </div>
        <ProgressBar value={project.avgProgress} />
        <div className="mt-2 text-[17px] text-slate-500">
          {project.completedTasks}/{project.tasks.length} task
          {project.tasks.length === 1 ? "" : "s"} completed — average across every
          task linked to this project.
        </div>
        <div className="mt-4 border-t border-brand-100 pt-3">
          <UpdateProjectStatusForm projectId={project.id} currentStatus={project.status} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">
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
    </div>
  );
}
