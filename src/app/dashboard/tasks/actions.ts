"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { notifyNewTask } from "@/lib/notifications";

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

  const task = await prisma.task.create({
    data: {
      companyId: membership.companyId,
      title,
      description: description || null,
      assignedToId: assigneeId,
      assignedById: membership.id,
      projectId: projectId || null,
      workedForCompany: workedForCompany || null,
      contactType: contactType || null,
      contactName: contactType === "Others" ? contactName || null : null,
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
