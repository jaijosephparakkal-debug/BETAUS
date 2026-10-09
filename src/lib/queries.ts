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
    orderBy: { createdAt: "desc" },
    include: {
      assignedBy: { include: { user: true } },
      project: { select: { id: true, name: true, number: true, type: true } },
      subtasks: {
        select: { id: true, title: true, status: true, progress: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/** Top-level tasks this membership assigned to someone else — feeds the assigner's "Assigned" tab. */
export function getAssignedTasksFor(membershipId: string) {
  return prisma.task.findMany({
    where: { assignedById: membershipId, assignedToId: { not: membershipId }, parentTaskId: null },
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { include: { user: true } },
      project: { select: { id: true, name: true, number: true, type: true } },
      subtasks: {
        select: { id: true, title: true, status: true, progress: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/** Every project at a company, with a computed progress rollup from its linked top-level tasks. */
export async function getProjectsFor(companyId: string) {
  const projects = await prisma.project.findMany({
    where: { companyId, type: "PROJECT" },
    include: {
      tasks: {
        where: { parentTaskId: null },
        select: { status: true, progress: true },
      },
      siteTasks: { select: { weight: true, progress: true } },
    },
    orderBy: { number: "asc" },
  });

  return projects.map((p) => ({
    id: p.id,
    number: p.number,
    name: p.name,
    status: p.status,
    taskCount: p.tasks.length,
    completedTasks: p.tasks.filter((t) => t.status === "COMPLETED").length,
    avgProgress: p.tasks.length
      ? Math.round(p.tasks.reduce((s, t) => s + t.progress, 0) / p.tasks.length)
      : 0,
    siteTaskCount: p.siteTasks.length,
    siteWeightFulfilled: Math.round(
      p.siteTasks.reduce((s, t) => s + ((t.weight ?? 0) * t.progress) / 100, 0)
    ),
  }));
}

export async function getProjectDetail(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        where: { parentTaskId: null },
        include: {
          assignedTo: { include: { user: true } },
          assignedBy: { include: { user: true } },
          subtasks: { select: { id: true, status: true } },
        },
        orderBy: [{ stageOrder: "asc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!project) return null;

  const avgProgress = project.tasks.length
    ? Math.round(project.tasks.reduce((s, t) => s + t.progress, 0) / project.tasks.length)
    : 0;
  const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;

  // Once the Projects Manager has assigned milestone weights to a project's
  // stages, overall completion is the weighted sum (each stage's progress ×
  // its weight) rather than a flat average across tasks.
  const weightedTasks = project.tasks.filter((t) => t.milestoneWeight != null);
  const totalWeightAssigned = weightedTasks.reduce((s, t) => s + (t.milestoneWeight ?? 0), 0);
  const weightedProgress = weightedTasks.length
    ? Math.round(
        project.tasks.reduce((s, t) => s + (t.progress / 100) * (t.milestoneWeight ?? 0), 0)
      )
    : avgProgress;

  return {
    ...project,
    avgProgress,
    completedTasks,
    weightedProgress,
    totalWeightAssigned,
    hasWeights: weightedTasks.length > 0,
  };
}

/** Every task this person has ever finished, most recent first — feeds the weekly/monthly completion rollup. */
export function getCompletionsFor(membershipId: string) {
  return prisma.task.findMany({
    where: { assignedToId: membershipId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    select: { id: true, title: true, completedAt: true },
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
  userId: string;
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
      userId: m.userId,
      name: m.user.name,
      title: m.title,
      department: m.department,
      isDirector: m.isDirector,
      children: (childrenOf.get(id) ?? []).map(build),
    };
  }

  return build(rootId);
}

/**
 * KPI picture for the director: every non-director's KPIs at both
 * companies — overall average, per-company average, and per person (people
 * at both companies merged, each KPI tagged with its company). Averages are
 * over KPIs (each KPI counts once), matching getCompanyRollup.
 */
export async function getKpiOverview() {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  const memberships = await prisma.membership.findMany({
    where: { isDirector: false },
    include: { user: true, company: true, kpis: { orderBy: { createdAt: "asc" } } },
    orderBy: { user: { name: "asc" } },
  });

  const avg = (scores: number[]) =>
    scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null;

  type PersonKpis = {
    userId: string;
    name: string;
    titles: string[];
    companySlugs: string[];
    kpis: { id: string; name: string; current: number; target: number; unit: string | null; period: string | null; score: number; companySlug: string }[];
    avgScore: number | null;
  };
  const people = new Map<string, PersonKpis>();
  for (const m of memberships) {
    let p = people.get(m.userId);
    if (!p) {
      p = { userId: m.userId, name: m.user.name, titles: [], companySlugs: [], kpis: [], avgScore: null };
      people.set(m.userId, p);
    }
    if (!p.titles.includes(m.title)) p.titles.push(m.title);
    if (!p.companySlugs.includes(m.company.slug)) p.companySlugs.push(m.company.slug);
    p.kpis.push(
      ...m.kpis.map((k) => ({
        id: k.id,
        name: k.name,
        current: k.current,
        target: k.target,
        unit: k.unit,
        period: k.period,
        score: kpiScore(k),
        companySlug: m.company.slug,
      }))
    );
  }
  for (const p of people.values()) p.avgScore = avg(p.kpis.map((k) => k.score));

  const allKpis = Array.from(people.values()).flatMap((p) => p.kpis);
  return {
    overall: { avgScore: avg(allKpis.map((k) => k.score)), kpiCount: allKpis.length, peopleCount: people.size },
    perCompany: companies.map((c) => {
      const kpis = allKpis.filter((k) => k.companySlug === c.slug);
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        avgScore: avg(kpis.map((k) => k.score)),
        kpiCount: kpis.length,
        peopleWithKpis: Array.from(people.values()).filter((p) => p.kpis.some((k) => k.companySlug === c.slug)).length,
      };
    }),
    people: Array.from(people.values()),
  };
}

/**
 * Choices for a task's "Project / site" dropdown: projects first (by
 * number), then Maintenance sites labelled "AMC — ..." / "DLP — ...".
 */
export async function getProjectOptions(companyId: string) {
  const rows = await prisma.project.findMany({
    where: { companyId },
    select: { id: true, name: true, number: true, type: true },
    orderBy: [{ number: "asc" }, { name: "asc" }],
  });
  const rank = (t: string) => (t === "PROJECT" ? 0 : t === "AMC" ? 1 : 2);
  return rows
    .sort((a, b) => rank(a.type) - rank(b.type))
    .map((r) => ({
      id: r.id,
      number: r.number,
      name: r.type === "PROJECT" ? r.name : `${r.type} — ${r.name}`,
    }));
}

/** AMC and DLP sites for the Maintenance page. */
export async function getMaintenanceSites(companyId: string) {
  const sites = await prisma.project.findMany({
    where: { companyId, type: { in: ["AMC", "DLP"] } },
    include: { tasks: { where: { parentTaskId: null }, select: { status: true } } },
    orderBy: { name: "asc" },
  });
  return sites.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type as "AMC" | "DLP",
    status: s.status,
    taskCount: s.tasks.length,
    openTasks: s.tasks.filter((t) => t.status !== "COMPLETED").length,
  }));
}

/** Choices for My Tasks' "Task for" picker: projects, AMC sites and DLP sites at this company. */
export async function getTaskForChoices(companyId: string) {
  const rows = await prisma.project.findMany({
    where: { companyId },
    select: { id: true, name: true, number: true, type: true },
    orderBy: [{ number: "asc" }, { name: "asc" }],
  });
  const pick = (type: string) =>
    rows.filter((r) => r.type === type).map((r) => ({ id: r.id, name: r.name, number: r.number }));
  return { projects: pick("PROJECT"), amc: pick("AMC"), dlp: pick("DLP") };
}
