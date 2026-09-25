"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";

/**
 * Assigns a plain ad-hoc task from the signed-in employee to any colleague at
 * their company — no reporting-line restriction, unlike daily/weekly/monthly
 * tasks which stay manager-only. The creator still keeps edit/reassign/delete
 * rights on it afterwards (see canManageTask in dashboard/tasks/[id]/actions.ts).
 */
export async function assignTaskToColleagueAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const assigneeId = String(formData.get("assigneeId") || "");
  if (!assigneeId || assigneeId === membership.id) {
    return { error: "Choose a colleague to assign this to." };
  }

  const assignee = await prisma.membership.findUnique({ where: { id: assigneeId } });
  if (!assignee || assignee.companyId !== membership.companyId) {
    return { error: "Choose a valid colleague at your company." };
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const deadlineRaw = String(formData.get("deadline") || "");
  const projectId = String(formData.get("projectId") || "");
  if (!title) return { error: "Give the task a title." };

  await prisma.task.create({
    data: {
      companyId: membership.companyId,
      title,
      description: description || null,
      assignedToId: assigneeId,
      assignedById: membership.id,
      projectId: projectId || null,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/team/${assigneeId}`);
  revalidatePath("/dashboard");
  return {};
}
