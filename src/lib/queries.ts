import { prisma } from "@/lib/db";

export function getLatestDirectorMessage(companyId: string) {
  return prisma.directorMessage.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { author: { include: { user: true } } },
  });
}

/** Top-level tasks only — daily subtasks are reached via their parent's detail page. */
export function getTasksFor(membershipId: string) {
  return prisma.task.findMany({
    where: { assignedToId: membershipId, parentTaskId: null },
    orderBy: [{ status: "asc" }, { deadline: "asc" }],
    include: {
      assignedBy: { include: { user: true } },
      subtasks: { select: { status: true } },
    },
  });
}

export function getKpisFor(membershipId: string) {
  return prisma.kpi.findMany({
    where: { membershipId },
    orderBy: { createdAt: "asc" },
  });
}

/** A combined, time-ordered feed of everything logged against this membership: comments and KPI updates. */
export async function getTimelineFor(membershipId: string) {
  const comments = await prisma.taskComment.findMany({
    where: { authorId: membershipId },
    include: { task: true },
    orderBy: { createdAt: "desc" },
  });

  return comments.map((c) => ({
    id: c.id,
    at: c.createdAt,
    kind: "comment" as const,
    taskTitle: c.task.title,
    taskId: c.taskId,
    body: c.body,
    progressAt: c.progressAt,
  }));
}

export function kpiScore(kpi: { target: number; current: number }) {
  if (kpi.target <= 0) return 0;
  return Math.min(100, Math.round((kpi.current / kpi.target) * 100));
}

export async function getCompanyRollup(companyId: string) {
  const [tasks, kpis, memberships] = await Promise.all([
    prisma.task.findMany({ where: { companyId, parentTaskId: null } }),
    prisma.kpi.findMany({ where: { membership: { companyId } } }),
    prisma.membership.findMany({
      where: { companyId },
      include: { user: true, manager: true },
    }),
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const notStartedTasks = tasks.filter((t) => t.status === "NOT_STARTED").length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== "COMPLETED" && t.deadline && t.deadline.getTime() < Date.now()
  ).length;
  const avgTaskProgress = totalTasks
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / totalTasks)
    : 0;

  const avgKpiScore = kpis.length
    ? Math.round(
        kpis.reduce((s, k) => s + kpiScore(k), 0) / kpis.length
      )
    : 0;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    overdueTasks,
    avgTaskProgress,
    avgKpiScore,
    kpiCount: kpis.length,
    headcount: memberships.length,
    memberships,
  };
}

/** Overdue, not-yet-completed tasks for a company, most overdue first — the director's "at risk" list. */
export async function getAtRiskTasks(companyId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      companyId,
      parentTaskId: null,
      status: { not: "COMPLETED" },
      deadline: { lt: new Date() },
    },
    include: { assignedTo: { include: { user: true } } },
    orderBy: { deadline: "asc" },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    progress: t.progress,
    assigneeId: t.assignedToId,
    assigneeName: t.assignedTo.user.name,
    daysOverdue: Math.floor(
      (Date.now() - t.deadline!.getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

export function getMyApprovalRequests(membershipId: string) {
  return prisma.approvalRequest.findMany({
    where: { requestedById: membershipId },
    include: {
      approver: { include: { user: true } },
      _count: { select: { attachments: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getPendingApprovalsFor(membershipId: string) {
  return prisma.approvalRequest.findMany({
    where: { approverId: membershipId, status: "PENDING" },
    include: {
      requestedBy: { include: { user: true } },
      _count: { select: { attachments: true, comments: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function getApprovalRequestDetail(id: string) {
  return prisma.approvalRequest.findUnique({
    where: { id },
    include: {
      requestedBy: { include: { user: true } },
      approver: { include: { user: true } },
      attachments: {
        include: { uploadedBy: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: { author: { include: { user: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/** Every approval request company-wide — audit view for the director, not just requests addressed to them. */
export function getCompanyApprovals(companyId: string) {
  return prisma.approvalRequest.findMany({
    where: { companyId },
    include: {
      requestedBy: { include: { user: true } },
      approver: { include: { user: true } },
      _count: { select: { attachments: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function getDirectReports(managerId: string) {
  return prisma.membership.findMany({
    where: { managerId },
    include: { user: true },
    orderBy: { title: "asc" },
  });
}

export async function getMembershipSummary(membershipId: string) {
  const [tasks, kpis] = await Promise.all([
    getTasksFor(membershipId),
    getKpisFor(membershipId),
  ]);

  const avgTaskProgress = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
    : 0;
  const avgKpiScore = kpis.length
    ? Math.round(kpis.reduce((s, k) => s + kpiScore(k), 0) / kpis.length)
    : 0;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;

  return {
    taskCount: tasks.length,
    completedTasks,
    avgTaskProgress,
    avgKpiScore,
  };
}

export type OrgNode = {
  id: string;
  name: string;
  title: string;
  department: string | null;
  isDirector: boolean;
  children: OrgNode[];
};

export async function getOrgTree(companyId: string): Promise<OrgNode | null> {
  const memberships = await prisma.membership.findMany({
    where: { companyId },
    include: { user: true },
  });

  const byId = new Map(memberships.map((m) => [m.id, m]));
  const childrenOf = new Map<string, string[]>();
  let rootId: string | null = null;

  for (const m of memberships) {
    if (m.managerId) {
      childrenOf.set(m.managerId, [...(childrenOf.get(m.managerId) ?? []), m.id]);
    } else if (m.isDirector) {
      rootId = m.id;
    }
  }
  if (!rootId) return null;

  function build(id: string): OrgNode {
    const m = byId.get(id)!;
    return {
      id: m.id,
      name: m.user.name,
      title: m.title,
      department: m.department,
      isDirector: m.isDirector,
      children: (childrenOf.get(id) ?? []).map(build),
    };
  }

  return build(rootId);
}
