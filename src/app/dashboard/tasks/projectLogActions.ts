"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { dubaiInputToDate } from "@/lib/quotations";
import { PROJECT_PROFILES, stageOf, NEW_ESTIMATE } from "@/lib/projectLogOptions";
import { nextEstimateNumber } from "@/lib/projectEstimates";
import { canUpdateSiteTaskProgress } from "@/lib/siteTasks";

export type ProjectLogState = { error?: string; ok?: string };

const BACKDATE_DAYS = 7;

/** Saves one Flaretech project-team entry: project, site task, what was done (all picked), and an optional follow-up. */
export async function createProjectLogAction(_prev: ProjectLogState | undefined, fd: FormData): Promise<ProjectLogState> {
  const m = await getCurrentMembership();
  if (!m) return { error: "Not signed in." };
  if (m.viewingAs) return { error: "Read-only while viewing as someone else." };
  const profile = PROJECT_PROFILES[m.user.email.toLowerCase()];
  if (!profile) return { error: "This form is not set up for you." };
  const s = (k: string) => String(fd.get(k) || "").trim();

  const kind = profile.kinds.find((k) => k.v === s("kind"));
  if (!kind) return { error: "Choose what you did." };

  const company = await prisma.company.findUnique({ where: { slug: "flaretechnical" } });
  if (!company) return { error: "Flaretech was not found." };

  // Project (or, for an optional-project kind, a client or tender that is not a project yet).
  let project: { id: string; name: string; number: string | null } | null = null;
  let clientName = "";
  let potential = "";
  const pid = s("projectId");
  if (pid === "__newpot__" || pid.startsWith("pot:")) {
    // A tender being estimated that is not a project yet: picked from the list, or added by name once.
    potential = (pid === "__newpot__" ? s("newPotential") : pid.slice(4)).replace(/\s+/g, " ").trim().slice(0, 120);
    if (!potential) return { error: "Type the name of the potential project." };
  } else if (pid && pid !== "none") {
    project = await prisma.project.findFirst({ where: { id: pid, companyId: company.id }, select: { id: true, name: true, number: true } });
    if (!project) return { error: "Choose the project." };
  } else if ((kind.project ?? "required") === "required") {
    return { error: "Choose the project." };
  } else {
    const cid = s("customerId");
    if (cid === "__new__") {
      const name = s("newCustomer");
      if (!name) return { error: "Type the client or tender name." };
      clientName = (await prisma.customer.upsert({ where: { companyId_name: { companyId: company.id, name } }, update: {}, create: { companyId: company.id, name } })).name;
    } else if (cid) {
      const c = await prisma.customer.findFirst({ where: { id: cid, companyId: company.id } });
      if (!c) return { error: "Choose the client." };
      clientName = c.name;
    }
  }

  // Site task: one of this project's own checklist items.
  let site: { id: string; title: string; progress: number } | null = null;
  const sid = s("siteTaskId");
  if (kind.site !== "none" && project && sid) {
    site = await prisma.projectSiteTask.findFirst({ where: { id: sid, projectId: project.id }, select: { id: true, title: true, progress: true } });
    if (!site) return { error: "Choose the site task." };
  }
  if (kind.site === "required" && !site && !potential) return { error: "Choose the site task." };

  // When it happened (Dubai time).
  const eventAt = dubaiInputToDate(s("eventAt"));
  const now = new Date();
  if (isNaN(eventAt.getTime())) return { error: "Choose when it happened." };
  if (eventAt.getTime() > now.getTime() + 10 * 60 * 1000) return { error: "That time is in the future." };
  const lag = now.getTime() - eventAt.getTime();
  let backdateReason: string | null = null;
  if (lag > BACKDATE_DAYS * 86400000) {
    backdateReason = s("reason");
    if (!backdateReason) return { error: `That is more than ${BACKDATE_DAYS} days ago. Choose why it is being entered late.` };
  }

  // The picked fields. Lists only accept their own values; numbers must be numbers.
  const values: Record<string, string | number | boolean | null> = {};
  const parts: string[] = [];
  let newProgress: number | null = null;
  for (const f of kind.fields) {
    if (f.showIf && !f.showIf.in.includes(s(`f_${f.showIf.k}`))) continue;
    const raw = s(`f_${f.k}`);
    if (f.type === "progress") {
      if (!site) continue;
      let p = Number(raw);
      if (s("f_work") === "Completed") p = 100;
      if (!Number.isInteger(p) || p < 0 || p > 100) return { error: "Set the progress." };
      newProgress = p;
      values.progressBefore = site.progress;
      values.progress = p;
      parts.push(`${site.progress}% → ${p}%`);
      continue;
    }
    if (f.type === "supplier") {
      const sup = s("supplierId");
      if (sup === "__new__") {
        const name = s("newSupplier");
        if (!name) return { error: "Type the new supplier’s name." };
        values.supplier = (await prisma.supplier.upsert({ where: { companyId_name: { companyId: company.id, name } }, update: {}, create: { companyId: company.id, name } })).name;
      } else if (sup) {
        const x = await prisma.supplier.findFirst({ where: { id: sup, companyId: company.id } });
        if (!x) return { error: "Choose the supplier." };
        values.supplier = x.name;
      } else if (!f.optional) return { error: "Choose the supplier." };
      if (values.supplier) parts.push(String(values.supplier));
      continue;
    }
    if (f.type === "estimate") {
      if (raw === NEW_ESTIMATE) {
        values.estimateNumber = await nextEstimateNumber(company.id, eventAt);
        values.newEstimate = true;
      } else {
        const known = await prisma.task.findFirst({ where: { companyId: company.id, details: { path: ["estimateNumber"], equals: raw } }, select: { id: true } });
        if (!known) return { error: "Choose the estimation number from the list." };
        values.estimateNumber = raw;
      }
      parts.unshift(String(values.estimateNumber));
      continue;
    }
    if (f.type === "who") {
      const name = s(`f_${f.k}Name`).slice(0, 80);
      if (!raw) {
        if (f.optional) continue;
        return { error: `Choose “${f.label}”.` };
      }
      if (!f.options!.includes(raw)) return { error: `Choose “${f.label}” from the list.` };
      if (!name && !f.nameOptional) return { error: `Pick or type the name for “${f.label}”.` };
      values[f.k] = raw;
      values[`${f.k}Name`] = name || null;
      parts.push(`${f.label}: ${raw}${name ? ` — ${name}` : ""}`);
      continue;
    }
    if (f.type === "staff") {
      if (!raw) return { error: `Choose “${f.label}”.` };
      const e = await prisma.employee.findFirst({ where: { name: raw }, select: { id: true } });
      if (!e) return { error: `Choose “${f.label}” from the staff directory.` };
      values[f.k] = raw;
      parts.push(`${f.label}: ${raw}`);
      continue;
    }
    if (!raw) {
      if (f.optional) continue;
      return { error: `Choose “${f.label}”.` };
    }
    if ((f.type === "chips" || f.type === "select") && !f.options!.includes(raw)) return { error: `Choose “${f.label}” from the list.` };
    if (f.type === "amount" || f.type === "number") {
      const n = Number(raw.replace(/,/g, ""));
      if (!Number.isFinite(n) || n < 0) return { error: `“${f.label}” must be a number.` };
      values[f.k] = n;
      // Amounts stay out of the description (shown in task lists); the task page shows them to the owner, Abraham and Jai only.
      if (f.type === "number") parts.push(`${f.label}: ${n}`);
      continue;
    }
    if (f.type === "date" && isNaN(new Date(raw).getTime())) return { error: `“${f.label}” is not a valid date.` };
    values[f.k] = raw.slice(0, 120);
    parts.push(f.type === "chips" ? raw.slice(0, 120) : `${f.label}: ${raw.slice(0, 120)}`);
  }
  const note = s("note").slice(0, 200);

  const title = ((kind.titleFrom && typeof values[kind.titleFrom] === "string" ? String(values[kind.titleFrom]) : kind.l) + (values.estimateNumber ? ` — ${values.estimateNumber}` : "") + (site ? ` — ${site.title}` : "")).slice(0, 200);
  const where = project ? `${project.name}${project.number ? ` (${project.number})` : ""}` : potential ? `${potential} (potential project)` : clientName || "No project";
  const summary = [where, site?.title, ...parts.filter((p) => p !== values[kind.titleFrom ?? ""]), note && `Note: ${note}`].filter(Boolean).join(" · ");

  // Category task to file it under (created the first time it is used).
  const parentTitle = kind.parentFrom && typeof values[kind.parentFrom] === "string" ? String(values[kind.parentFrom]) : kind.parent;
  let parent = await prisma.task.findFirst({ where: { assignedToId: m.id, parentTaskId: null, title: { equals: parentTitle, mode: "insensitive" } } });
  if (!parent) {
    parent = await prisma.task.create({
      data: { companyId: m.companyId, title: parentTitle, category: parentTitle, assignedToId: m.id, assignedById: m.managerId ?? m.id, status: "IN_PROGRESS" },
    });
  }

  // Optional follow-up for themselves.
  let dueAt: Date | null = null;
  if (s("nextStep") === "followup") {
    dueAt = dubaiInputToDate(s("dueAt"));
    if (isNaN(dueAt.getTime())) return { error: "Choose when to follow up." };
  }

  await prisma.task.create({
    data: {
      companyId: m.companyId,
      title,
      description: summary.slice(0, 1000),
      assignedToId: m.id,
      assignedById: m.id,
      parentTaskId: parent.id,
      category: parent.category ?? parent.title,
      status: "COMPLETED",
      progress: 100,
      completedAt: eventAt,
      projectId: project?.id ?? null,
      taskFor: project ? "PROJECT" : "OTHERS",
      forPerson: !project && (potential || clientName) ? (potential || clientName).slice(0, 200) : null,
      workedForCompany: "flaretechnical",
      logKind: kind.code,
      eventAt,
      enteredLater: lag > 15 * 60 * 1000,
      backdateReason,
      details: { ...values, kind: kind.l, siteTaskId: site?.id ?? null, siteTask: site?.title ?? null, stage: site ? stageOf(site.title) : null, client: clientName || null, potentialProject: potential || null, note: note || null },
    },
  });

  if (dueAt) {
    await prisma.task.create({
      data: {
        companyId: m.companyId,
        title: `Follow up — ${title}`.slice(0, 200),
        description: summary.slice(0, 500),
        assignedToId: m.id,
        assignedById: m.id,
        parentTaskId: parent.id,
        category: parent.category ?? parent.title,
        status: "NOT_STARTED",
        deadline: dueAt,
        followUpAt: dueAt,
        projectId: project?.id ?? null,
        taskFor: project ? "PROJECT" : "OTHERS",
        logKind: "FOLLOW_UP",
        workedForCompany: "flaretechnical",
        eventAt: new Date(),
      },
    });
  }

  // The site engineer's update moves the task's progress on the project page.
  if (site && newProgress !== null && newProgress !== site.progress && canUpdateSiteTaskProgress(m.user)) {
    await prisma.projectSiteTask.update({ where: { id: site.id }, data: { progress: newProgress } });
  }

  revalidatePath("/dashboard/tasks");
  if (project) revalidatePath(`/dashboard/projects/${project.id}`);
  revalidatePath("/dashboard/projects");
  return { ok: values.newEstimate ? `Saved — ${values.estimateNumber}` : site ? `Saved — ${site.title}` : "Saved" };
}

