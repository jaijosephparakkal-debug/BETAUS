"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";

async function assertCanManageProjects() {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." as const };
  const reportCount = await prisma.membership.count({ where: { managerId: membership.id } });
  if (!membership.isDirector && reportCount === 0) {
    return { error: "Only managers or the director can add projects." as const };
  }
  return { membership };
}

export async function createProjectAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const access = await assertCanManageProjects();
  if ("error" in access) return { error: access.error };

  const number = String(formData.get("number") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Give the project a name." };

  await prisma.project.create({
    data: { companyId: access.membership.companyId, number: number || null, name },
  });

  revalidatePath("/dashboard/projects");
  return {};
}

export async function updateProjectStatusAction(
  projectId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const access = await assertCanManageProjects();
  if ("error" in access) return { error: access.error };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.companyId !== access.membership.companyId) {
    return { error: "Project not found." };
  }

  const status = String(formData.get("status") || "");
  if (!["ACTIVE", "ON_HOLD", "COMPLETED"].includes(status)) {
    return { error: "Invalid status." };
  }

  await prisma.project.update({ where: { id: projectId }, data: { status } });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return {};
}
