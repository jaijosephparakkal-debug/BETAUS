import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getTasksFor } from "@/lib/queries";
import { Card, ProgressBar, StatusBadge, formatDate, isOverdue } from "@/components/ui";

export default async function MyTasksPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const tasks = await getTasksFor(membership.id);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">My Tasks</h1>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id}>
            <Link href={`/dashboard/tasks/${task.id}`} className="block hover:opacity-90">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900">{task.title}</span>
                <StatusBadge status={task.status} />
              </div>
              {task.description && (
                <p className="mt-1 text-sm text-slate-600">{task.description}</p>
              )}
              <div className="mt-3">
                <ProgressBar value={task.progress} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Assigned by {task.assignedBy.user.name}</span>
                <span className={isOverdue(task.deadline, task.status) ? "font-medium text-red-600" : ""}>
                  Due {formatDate(task.deadline)}
                </span>
              </div>
            </Link>
            {task.subtasks.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-brand-100 pt-3">
                <div className="text-xs font-medium text-slate-500">
                  Daily tasks —{" "}
                  {task.subtasks.filter((s) => s.status === "COMPLETED").length}/
                  {task.subtasks.length} done
                </div>
                {task.subtasks.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/dashboard/tasks/${sub.id}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-brand-50/40"
                  >
                    <span className="text-slate-800">{sub.title}</span>
                    <StatusBadge status={sub.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-slate-500">No tasks assigned yet.</p>
        )}
      </div>
    </div>
  );
}
