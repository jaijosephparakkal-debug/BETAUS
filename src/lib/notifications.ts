import { prisma } from "@/lib/db";

/** Creates a "you've been assigned a task" alert for the My Tasks badge — reassignment/daily-task cases, so no-op when notifying yourself (nothing to tell yourself about). */
export async function notifyTaskAssigned(
  actingMembershipId: string,
  assigneeMembershipId: string,
  taskId: string,
  taskTitle: string
) {
  if (actingMembershipId === assigneeMembershipId) return;
  await prisma.notification.create({
    data: {
      membershipId: assigneeMembershipId,
      taskId,
      message: `You were assigned: ${taskTitle}`,
    },
  });
}

/** Every new task adds to the creator's own badge count too, even self-created ones. */
export async function notifyNewTask(membershipId: string, taskId: string, taskTitle: string) {
  await prisma.notification.create({
    data: {
      membershipId,
      taskId,
      message: `New task created: ${taskTitle}`,
    },
  });
}

export function getUnreadTaskNotificationCount(membershipId: string) {
  return prisma.notification.count({ where: { membershipId, read: false } });
}

/**
 * Clears the badge — called when the person visits their task list.
 * Excludes anything created in the last few seconds: creating a task from
 * that same page triggers an immediate re-render (via revalidatePath), which
 * would otherwise wipe the badge for a notification the person never
 * actually saw.
 */
export function markTaskNotificationsRead(membershipId: string) {
  return prisma.notification.updateMany({
    where: { membershipId, read: false, createdAt: { lt: new Date(Date.now() - 5000) } },
    data: { read: true },
  });
}
