"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership, isManagerOf } from "@/lib/auth";

async function assertCanManage(membershipId: string) {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." as const };
  const canManage =
    membership.isDirector || (await isManagerOf(membership.id, membershipId));
  if (!canManage) return { error: "You don't manage this person." as const };
  return { membership };
}

export async function assignTaskAction(
  membershipId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const access = await assertCanManage(membershipId);
  if ("error" in access) return { error: access.error };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const deadlineRaw = String(formData.get("deadline") || "");
  const projectId = String(formData.get("projectId") || "");
  if (!title) return { error: "Give the task a title." };

  const target = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!target) return { error: "Person not found." };

  await prisma.task.create({
    data: {
      companyId: target.companyId,
      title,
      description: description || null,
      assignedToId: membershipId,
      assignedById: access.membership.id,
      projectId: projectId || null,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });

  revalidatePath(`/dashboard/team/${membershipId}`);
  revalidatePath("/dashboard/team");
  return {};
}

export async function setKpiAction(
  membershipId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const access = await assertCanManage(membershipId);
  if ("error" in access) return { error: access.error };

  const name = String(formData.get("name") || "").trim();
  const target = Number(formData.get("target"));
  const current = Number(formData.get("current") || 0);
  const unit = String(formData.get("unit") || "").trim();
  if (!name) return { error: "Give the KPI a name." };
  if (!target || target <= 0) return { error: "Set a target greater than 0." };

  await prisma.kpi.create({
    data: {
      membershipId,
      name,
      target,
      current,
      unit: unit || null,
    },
  });

  revalidatePath(`/dashboard/team/${membershipId}`);
  revalidatePath("/dashboard/team");
  return {};
}
