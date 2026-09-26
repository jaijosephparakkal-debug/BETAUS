import { prisma } from "@/lib/db";

export type ActivityEvent = {
  at: Date;
  kind: string;
  label: string;
};

/**
 * Compiles one person's full activity trail: every task assignment, every
 * progress update (with timestamp), completions, and every approval request
 * they sent or were asked to decide (sent/opened/decided times). This is the
 * shared source for both the employee's own downloadable PDF and whatever
 * gets emailed to the director.
 */
export async function getActivityReport(membershipId: string) {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { user: true, company: true },
  });
  if (!membership) return null;

  const kpis = await prisma.kpi.findMany({
    where: { membershipId },
    orderBy: { createdAt: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: { assignedToId: membershipId },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      parentTask: { select: { title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const approvalsRequested = await prisma.approvalRequest.findMany({
    where: { requestedById: membershipId },
    include: { approver: { include: { user: true } } },
  });
  const approvalsToDecide = await prisma.approvalRequest.findMany({
    where: { approverId: membershipId },
    include: { requestedBy: { include: { user: true } } },
  });

  const events: ActivityEvent[] = [];

  for (const t of tasks) {
    const scope = t.parentTask ? `${t.parentTask.title} → ${t.title}` : t.title;
    events.push({ at: t.createdAt, kind: "assigned", label: `Task assigned: ${scope}` });

    let startLogged = false;
    for (const c of t.comments) {
      events.push({
        at: c.createdAt,
        kind: startLogged ? "update" : "started",
        label: `${startLogged ? "Update" : "Started"} on "${scope}" (progress ${c.progressAt}%): "${c.body}"`,
      });
      startLogged = true;
      if (c.progressAt >= 100) {
        events.push({ at: c.createdAt, kind: "completed", label: `Completed: ${scope}` });
      }
    }
  }

  for (const a of approvalsRequested) {
    events.push({
      at: a.createdAt,
      kind: "approval_sent",
      label: `Sent "${a.title}" for approval to ${a.approver.user.name}`,
    });
    if (a.viewedAt) {
      events.push({
        at: a.viewedAt,
        kind: "approval_received",
        label: `${a.approver.user.name} opened "${a.title}"`,
      });
    }
    if (a.decidedAt) {
      events.push({
        at: a.decidedAt,
        kind: "approval_decided",
        label: `${a.status === "APPROVED" ? "Approved" : "Rejected"} by ${a.approver.user.name}: "${a.title}"`,
      });
    }
  }

  for (const a of approvalsToDecide) {
    events.push({
      at: a.createdAt,
      kind: "approval_incoming",
      label: `Received "${a.title}" for approval from ${a.requestedBy.user.name}`,
    });
    if (a.viewedAt) {
      events.push({ at: a.viewedAt, kind: "approval_opened", label: `Opened "${a.title}"` });
    }
    if (a.decidedAt) {
      events.push({
        at: a.decidedAt,
        kind: "approval_decision_made",
        label: `${a.status === "APPROVED" ? "Approved" : "Rejected"} "${a.title}"`,
      });
    }
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime());

  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const avgProgress = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
    : 0;

  return { membership, kpis, tasks, events, completedTasks, avgProgress };
}

export type ActivityReport = NonNullable<Awaited<ReturnType<typeof getActivityReport>>>;
