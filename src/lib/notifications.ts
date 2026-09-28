import { prisma } from "@/lib/db";

/** Creates a "you've been assigned a task" alert for the My Tasks badge. No-op when notifying yourself. */
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

export function getUnreadTaskNotificationCount(membershipId: string) {
  return prisma.notification.count({ where: { membershipId, read: false } });
}

/** Clears the badge — called when the person visits their task list. */
export function markTaskNotificationsRead(membershipId: string) {
  return prisma.notification.updateMany({
    where: { membershipId, read: false },
    data: { read: true },
  });
}
