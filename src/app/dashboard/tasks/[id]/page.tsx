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
import { UploadAttachmentForm } from "./UploadAttachmentForm";

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
  const canManage =
    membership.isDirector || (await isManagerOf(membership.id, task.assignedToId));
  if (!isOwner && !canManage) {
    redirect("/dashboard/tasks");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-900">{task.title}</h1>
          <StatusBadge status={task.status} />
        </div>
        {task.description && (
          <p className="mt-1 text-sm text-slate-600">{task.description}</p>
        )}
        <div className="mt-2 text-xs text-slate-500">
          Assigned to {task.assignedTo.user.name} by {task.assignedBy.user.name} ·{" "}
          <span className={isOverdue(task.deadline, task.status) ? "font-medium text-red-600" : ""}>
            Due {formatDate(task.deadline)}
          </span>
        </div>
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-900">Overall progress</span>
          <span className="text-slate-500">{task.progress}%</span>
        </div>
        <ProgressBar value={task.progress} />
      </Card>

      {isOwner && (
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Log an update</h2>
          <ProgressForm taskId={task.id} initialProgress={task.progress} />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">
          Attachments — quotations, drawings, site maps, letters
        </h2>
        <AttachmentList attachments={task.attachments} />
        <div className="mt-3 border-t border-brand-100 pt-3">
          <UploadAttachmentForm taskId={task.id} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Timeline</h2>
        <div className="space-y-4">
          {task.comments.map((c) => (
            <div key={c.id} className="border-l-2 border-brand-200 pl-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {c.author.user.name}
                </span>
                <span>{formatDate(c.createdAt)}</span>
                <span>· set progress to {c.progressAt}%</span>
              </div>
              <p className="mt-1 text-sm text-slate-800">{c.body}</p>
            </div>
          ))}
          {task.comments.length === 0 && (
            <p className="text-sm text-slate-500">No updates logged yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
