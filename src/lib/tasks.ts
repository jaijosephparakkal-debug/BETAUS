import { prisma } from "@/lib/db";

/** Recomputes a parent task's progress/status as the average of its daily subtasks. No-op if it has none. */
export async function recomputeTaskProgress(taskId: string) {
  const subtasks = await prisma.task.findMany({
    where: { parentTaskId: taskId },
    select: { progress: true, status: true },
  });
  if (subtasks.length === 0) return;

  const progress = Math.round(
    subtasks.reduce((sum, t) => sum + t.progress, 0) / subtasks.length
  );
  const status = subtasks.every((t) => t.status === "COMPLETED")
    ? "COMPLETED"
    : subtasks.some((t) => t.status !== "NOT_STARTED")
      ? "IN_PROGRESS"
      : "NOT_STARTED";

  await prisma.task.update({ where: { id: taskId }, data: { progress, status } });
}
