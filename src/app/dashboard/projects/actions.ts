"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership, hasCompanyAccess } from "@/lib/auth";
import {
  STANDARD_SITE_TASKS,
  SITE_TASK_COMPANY_SLUG,
  canEditSiteTasks,
  canSetSiteTaskWeights,
  canUpdateSiteTaskProgress,
} from "@/lib/siteTasks";

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

  const project = await prisma.project.create({
    data: { companyId: access.membership.companyId, number: number || null, name },
  });
  // New Flaretech projects start with the full required site-task checklist.
  if (access.membership.company.slug === SITE_TASK_COMPANY_SLUG) {
    await prisma.projectSiteTask.createMany({
      data: STANDARD_SITE_TASKS.map((title, i) => ({ projectId: project.id, title, sortOrder: i + 1 })),
    });
  }

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

// ---- Required site tasks (ProjectSiteTask) --------------------------------

async function assertCanEditSiteTasks(
  projectId: string,
  need: "weights" | "progress" | "edit" = "edit"
) {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." as const };
  if (need === "weights" && !canSetSiteTaskWeights(membership.user)) {
    return { error: "Only Abraham or Saroj can set weights." as const };
  }
  if (need === "progress" && !canUpdateSiteTaskProgress(membership.user)) {
    return { error: "Only Ram, Abraham, Saroj or Jiyad can update progress." as const };
  }
  if (need === "edit" && !canEditSiteTasks(membership.user)) {
    return { error: "Only Ram, Abraham or Saroj can remove or add site tasks." as const };
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || !(await hasCompanyAccess(membership, project.companyId))) {
    return { error: "Project not found." as const };
  }
  return { project };
}

async function siteTaskInProject(projectId: string, siteTaskId: string) {
  const task = await prisma.projectSiteTask.findUnique({ where: { id: siteTaskId } });
  return task && task.projectId === projectId ? task : null;
}

export async function setSiteTaskWeightAction(projectId: string, siteTaskId: string, raw: string) {
  const access = await assertCanEditSiteTasks(projectId, "weights");
  if ("error" in access) return { error: access.error };
  if (!(await siteTaskInProject(projectId, siteTaskId))) return { error: "Task not found." };

  const trimmed = raw.trim();
  const weight = trimmed === "" ? null : Number(trimmed);
  if (weight !== null && (!Number.isFinite(weight) || weight < 0 || weight > 100 || !Number.isInteger(weight))) {
    return { error: "Weight must be a whole number from 0 to 100." };
  }
  await prisma.projectSiteTask.update({ where: { id: siteTaskId }, data: { weight } });
  revalidateProject(projectId);
  return {};
}

export async function setSiteTaskProgressAction(projectId: string, siteTaskId: string, progress: number) {
  const access = await assertCanEditSiteTasks(projectId, "progress");
  if ("error" in access) return { error: access.error };
  if (!(await siteTaskInProject(projectId, siteTaskId))) return { error: "Task not found." };
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    return { error: "Progress must be a whole number from 0 to 100." };
  }

  await prisma.projectSiteTask.update({ where: { id: siteTaskId }, data: { progress } });
  revalidateProject(projectId);
  return {};
}

export async function deleteSiteTaskAction(projectId: string, siteTaskId: string) {
  const access = await assertCanEditSiteTasks(projectId);
  if ("error" in access) return { error: access.error };
  if (!(await siteTaskInProject(projectId, siteTaskId))) return { error: "Task not found." };

  await prisma.projectSiteTask.delete({ where: { id: siteTaskId } });
  revalidateProject(projectId);
  return {};
}

/** Adds back a standard site task that was deleted from this project. */
export async function addSiteTaskAction(projectId: string, title: string) {
  const access = await assertCanEditSiteTasks(projectId);
  if ("error" in access) return { error: access.error };
  const index = STANDARD_SITE_TASKS.indexOf(title as (typeof STANDARD_SITE_TASKS)[number]);
  if (index === -1) return { error: "Unknown task." };

  await prisma.projectSiteTask.upsert({
    where: { projectId_title: { projectId, title } },
    update: {},
    create: { projectId, title, sortOrder: index + 1 },
  });
  revalidateProject(projectId);
  return {};
}

function revalidateProject(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
}
