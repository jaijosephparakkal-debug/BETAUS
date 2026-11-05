// How task lists are arranged everywhere staff read them: what still needs
// doing comes first, and the most recent task is at the top of each group.
// Client-safe (no prisma import).

export const TASK_GROUPS = [
  { status: "NOT_STARTED", label: "Pending" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "COMPLETED", label: "Completed" },
] as const;

const rank = (status: string) => {
  const i = TASK_GROUPS.findIndex((g) => g.status === status);
  return i === -1 ? 0 : i;
};

const time = (d: Date | string) => new Date(d).getTime();

/** Pending, then in progress, then completed; newest first within each. Returns a new array. */
export function arrangeTasks<T extends { status: string; createdAt: Date | string }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => rank(a.status) - rank(b.status) || time(b.createdAt) - time(a.createdAt));
}
