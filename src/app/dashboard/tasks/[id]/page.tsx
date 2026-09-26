import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, isManagerOf } from "@/lib/auth";
import {
  Card,
  ProgressBar,
  StatusBadge,
  AttachmentList,
  formatDate,
  isOverdue,
} from "@/components/ui";
import ProgressForm from "./ProgressForm";
import MilestoneWeightForm from "./MilestoneWeightForm";
import { QuickStatusToggle } from "./QuickStatusToggle";
import { UploadAttachmentForm } from "./UploadAttachmentForm";
import {
  AddDailyTaskForm,
  DeleteTaskButton,
  EditTaskForm,
  ReassignTaskForm,
} from "./ManageTaskForms";

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: { include: { user: true } },
      assignedBy: { include: { user: true } },
      parentTask: true,
      project: { select: { id: true, name: true, number: true } },
      subtasks: {
        include: { assignedTo: { include: { user: true } } },
        orderBy: { createdAt: "asc" },
      },
      comments: {
        include: { author: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        include: { uploadedBy: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!task || task.companyId !== membership.companyId) notFound();

  const isOwner = task.assignedToId === membership.id;
  const isRam = membership.user.email === "ram@flaretechnical.com";
  const useQuickToggle = !!task.parentTask || (!!task.projectId && task.stageOrder != null);
  const canManage =
    membership.isDirector ||
    task.assignedById === membership.id ||
    (await isManagerOf(membership.id, task.assignedToId));
  if (!isOwner && !canManage) {
    redirect("/dashboard/tasks");
  }

  const [employees, projects] = await Promise.all([
    canManage || isOwner
      ? prisma.membership.findMany({
          where: { companyId: membership.companyId, isDirector: false },
          include: { user: true },
          orderBy: { title: "asc" },
        })
      : Promise.resolve([]),
    canManage
      ? prisma.project.findMany({
          where: { companyId: membership.companyId },
          select: { id: true, name: true, number: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const deadlineValue = task.deadline ? task.deadline.toISOString().slice(0, 10) : "";

  return (
    <div className="space-y-6">
      <div>
        {task.parentTask && (
          <Link
            href={`/dashboard/tasks/${task.parentTask.id}`}
            className="text-[17px] text-brand-600 hover:underline"
          >
            ← Part of {task.parentTask.title}
          </Link>
        )}
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-[23px] font-semibold text-slate-900">{task.title}</h1>
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
        {task.description && (
          <p className="mt-1 text-[19px] text-slate-600">{task.description}</p>
        )}
        <div className="mt-2 text-[17px] text-slate-500">
          Assigned to {task.assignedTo.user.name} by {task.assignedBy.user.name} ·{" "}
          <span className={isOverdue(task.deadline, task.status) ? "font-medium text-red-600" : ""}>
            Due {formatDate(task.deadline)}
          </span>
        </div>
      </div>

      {canManage && (
        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Manage</h2>
          <div className="flex flex-wrap gap-4">
            <EditTaskForm
              taskId={task.id}
              initialTitle={task.title}
              initialDescription={task.description ?? ""}
              initialDeadline={deadlineValue}
              initialProjectId={task.projectId ?? ""}
              projects={projects}
            />
            <ReassignTaskForm
              taskId={task.id}
              currentAssigneeId={task.assignedToId}
              employees={employees.map((e) => ({
                id: e.id,
                name: e.user.name,
                title: e.title,
              }))}
            />
            <DeleteTaskButton taskId={task.id} />
          </div>
        </Card>
      )}

      {!canManage && isOwner && (
        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">
            Reassign / reallocate
          </h2>
          <p className="mb-3 text-[17px] text-slate-500">
            Not the right person for this? Hand it off to someone else.
          </p>
          <ReassignTaskForm
            taskId={task.id}
            currentAssigneeId={task.assignedToId}
            employees={employees.map((e) => ({
              id: e.id,
              name: e.user.name,
              title: e.title,
            }))}
          />
        </Card>
      )}

      <Card>
        <div className="mb-2 flex items-center justify-between text-[19px]">
          <span className="text-[21px] font-medium text-slate-900">Overall progress</span>
          <span className="text-slate-500">{task.progress}%</span>
        </div>
        <ProgressBar value={task.progress} />
        {task.subtasks.length > 0 && (
          <p className="mt-2 text-[17px] text-slate-500">
            Auto-calculated from {task.subtasks.length} daily task
            {task.subtasks.length === 1 ? "" : "s"}.
          </p>
        )}
      </Card>

      {task.projectId && task.stageOrder != null && (
        <Card>
          <h2 className="mb-1 text-[21px] font-semibold text-slate-900">
            Milestone weight
          </h2>
          <p className="mb-3 text-[17px] text-slate-500">
            {task.milestoneWeight != null
              ? `This stage contributes ${task.milestoneWeight}% to the project's overall completion.`
              : "Not yet weighted by the Projects Manager."}
          </p>
          {isRam ? (
            <MilestoneWeightForm taskId={task.id} initialWeight={task.milestoneWeight} />
          ) : (
            <p className="text-[17px] text-slate-500">
              Only the Projects Manager can set this.
            </p>
          )}
        </Card>
      )}

      {!task.parentTask && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[21px] font-semibold text-slate-900">Daily tasks</h2>
          </div>
          <div className="space-y-3">
            {task.subtasks.map((sub) => (
              <Link key={sub.id} href={`/dashboard/tasks/${sub.id}`}>
                <div className="rounded-lg border border-slate-100 p-3 transition hover:border-brand-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[19px] font-medium text-slate-900">
                      {sub.title}
                    </span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={sub.progress} />
                  </div>
                  <div className="mt-1 text-[17px] text-slate-500">
                    {sub.assignedTo.user.name} · Due {formatDate(sub.deadline)}
                  </div>
                </div>
              </Link>
            ))}
            {task.subtasks.length === 0 && (
              <p className="text-[19px] text-slate-500">No daily tasks yet.</p>
            )}
          </div>
          {canManage && (
            <div className="mt-4 border-t border-brand-100 pt-4">
              <AddDailyTaskForm parentTaskId={task.id} />
            </div>
          )}
        </Card>
      )}

      {isOwner && task.subtasks.length === 0 && useQuickToggle && (
        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">
            {task.parentTask ? "Mark today’s status" : "Mark status"}
          </h2>
          <QuickStatusToggle
            taskId={task.id}
            initialStatus={task.status}
            initialCompletedAt={task.completedAt ? task.completedAt.toISOString() : null}
          />
        </Card>
      )}

      {isOwner && task.subtasks.length === 0 && !useQuickToggle && (
        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Log an update</h2>
          <ProgressForm taskId={task.id} initialProgress={task.progress} />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">
          Attachments — quotations, drawings, site maps, letters
        </h2>
        <AttachmentList attachments={task.attachments} />
        <div className="mt-3 border-t border-brand-100 pt-3">
          <UploadAttachmentForm taskId={task.id} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Timeline</h2>
        <div className="space-y-4">
          {task.comments.map((c) => (
            <div key={c.id} className="border-l-2 border-brand-200 pl-3">
              <div className="flex items-center gap-2 text-[17px] text-slate-500">
                <span className="font-medium text-slate-700">
                  {c.author.user.name}
                </span>
                <span>{formatDate(c.createdAt)}</span>
                <span>· set progress to {c.progressAt}%</span>
              </div>
              <p className="mt-1 text-[19px] text-slate-800">{c.body}</p>
            </div>
          ))}
          {task.comments.length === 0 && (
            <p className="text-[19px] text-slate-500">No updates logged yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
