"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { notifyNewTask } from "@/lib/notifications";
import { TASK_FOR_OPTIONS, ADD_OTHER } from "@/lib/taskFor";

/**
 * Assigns a plain ad-hoc task from the signed-in employee to any colleague at
 * their company (including themselves, for self-assigned tasks) — no
 * reporting-line restriction, unlike daily/weekly/monthly tasks which stay
 * manager-only. The creator still keeps edit/reassign/delete rights on it
 * afterwards (see canManageTask in dashboard/tasks/[id]/actions.ts).
 */
export async function assignTaskToColleagueAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const assigneeId = String(formData.get("assigneeId") || "");
  if (!assigneeId) {
    return { error: "Choose who this task is for." };
  }

  const assignee = await prisma.membership.findUnique({ where: { id: assigneeId } });
  if (!assignee || assignee.companyId !== membership.companyId) {
    return { error: "Choose a valid person at your company." };
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const deadlineRaw = String(formData.get("deadline") || "");
  const projectId = String(formData.get("projectId") || "");
  const workedForCompany = String(formData.get("workedForCompany") || "").trim();
  const contactType = String(formData.get("contactType") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const followUpTopic = String(formData.get("followUpTopic") || "").trim();
  if (!title) return { error: "Give the task a title." };

  // "Task for": a project, an AMC/DLP site, another department + person, or
  // — via any dropdown's "+ Add other…" — typed text (forDepartment/forPerson).
  const rawTaskFor = String(formData.get("taskFor") || "");
  const forDepartment = String(formData.get("forDepartment") || "").trim();
  const forPerson = String(formData.get("forPerson") || "").trim();
  const taskFor = rawTaskFor === ADD_OTHER ? "CUSTOM" : rawTaskFor;
  if (taskFor !== "CUSTOM" && !(taskFor in TASK_FOR_OPTIONS)) {
    return { error: "Choose who/what this task is for." };
  }
  let linkedProjectId: string | null = null;
  if ((taskFor === "PROJECT" || taskFor === "MAINTENANCE") && projectId && projectId !== ADD_OTHER) {
    const target = await prisma.project.findUnique({ where: { id: projectId } });
    const typeOk =
      taskFor === "PROJECT" ? target?.type === "PROJECT" : target?.type === "AMC" || target?.type === "DLP";
    if (!target || target.companyId !== membership.companyId || !typeOk) {
      return { error: taskFor === "PROJECT" ? "Choose a project." : "Choose an AMC or DLP site." };
    }
    linkedProjectId = target.id;
  }
  if (taskFor === "CUSTOM" && !forPerson) return { error: "Write what this task is for." };
  if (taskFor === "PROJECT" && !linkedProjectId && !forPerson) return { error: "Choose or type a project." };
  if (taskFor === "MAINTENANCE") {
    if (!forDepartment) return { error: "Choose AMC or DLP, or type the maintenance type." };
    if (!linkedProjectId && !forPerson) return { error: "Choose or type a site." };
  }
  if (taskFor === "OTHERS") {
    if (!forDepartment) return { error: "Choose or type a department." };
    if (!forPerson) return { error: "Write who this task is for." };
  }
  // "+ Add other…" on "Who was it with?" means a typed name.
  const contactTypeValue = contactType === ADD_OTHER ? "Others" : contactType;

  const task = await prisma.task.create({
    data: {
      companyId: membership.companyId,
      title,
      description: description || null,
      assignedToId: assigneeId,
      assignedById: membership.id,
      projectId: linkedProjectId,
      taskFor,
      forDepartment: taskFor === "MAINTENANCE" || taskFor === "OTHERS" ? forDepartment : null,
      forPerson: linkedProjectId ? null : forPerson || null,
      workedForCompany: workedForCompany || null,
      contactType: contactTypeValue || null,
      contactName: contactTypeValue === "Others" ? contactName || null : null,
      followUpTopic: followUpTopic || null,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });
  await notifyNewTask(assigneeId, task.id, title);

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/team/${assigneeId}`);
  revalidatePath("/dashboard");
  return {};
}

/** Adds a new quick-pick task title to the signed-in person's own dropdown, for next time. */
export async function addTaskTitlePresetAction(
  title: string
): Promise<{ error?: string; title?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const trimmed = title.trim();
  if (!trimmed) return { error: "Enter a title first." };

  await prisma.taskTitlePreset.upsert({
    where: { membershipId_title: { membershipId: membership.id, title: trimmed } },
    update: {},
    create: { membershipId: membership.id, title: trimmed },
  });

  revalidatePath("/dashboard/tasks");
  return { title: trimmed };
}
