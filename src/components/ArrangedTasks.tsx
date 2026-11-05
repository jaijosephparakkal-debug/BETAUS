import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { TASK_GROUPS, arrangeTasks } from "@/lib/taskOrder";

/** A category's tasks in groups: Pending, In progress, Completed, each newest first. */
export function ArrangedTasks({
  tasks,
}: {
  tasks: { id: string; title: string; status: string; createdAt: Date | string }[];
}) {
  const arranged = arrangeTasks(tasks);
  return (
    <div className="space-y-3">
      {TASK_GROUPS.map((group) => {
        const rows = arranged.filter((t) =>
          group.status === "NOT_STARTED"
            ? t.status !== "IN_PROGRESS" && t.status !== "COMPLETED"
            : t.status === group.status
        );
        if (rows.length === 0) return null;
        return (
          <div key={group.status}>
            <div className="mb-1 text-[15px] font-semibold uppercase tracking-wide text-slate-500">
              {group.label} ({rows.length})
            </div>
            <div className="space-y-1">
              {rows.map((t) => (
                <Link
                  key={t.id}
                  href={`/dashboard/tasks/${t.id}`}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[19px] hover:bg-brand-50/40"
                >
                  <span className="min-w-0 text-slate-800">{t.title}</span>
                  <StatusBadge status={t.status} />
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
