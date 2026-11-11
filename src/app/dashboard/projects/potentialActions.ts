"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { canAddProjects } from "@/lib/teams";

async function potentialEntries(name: string) {
  const ft = await prisma.company.findUnique({ where: { slug: "flaretechnical" } });
  if (!ft) return { ft: null, tasks: [] };
  const tasks = await prisma.task.findMany({
    where: { companyId: ft.id, projectId: null, details: { path: ["potentialProject"], equals: name } },
    select: { id: true, details: true },
  });
  return { ft, tasks };
}

/** The tender was won: every entry about it (estimates, quotations, visits, calls) moves onto the real project. */
export async function convertPotentialAction(formData: FormData) {
  const m = await getCurrentMembership();
  if (!m || m.viewingAs || !canAddProjects(m)) return;
  const name = String(formData.get("name") || "");
  const projectId = String(formData.get("projectId") || "");
  const { ft, tasks } = await potentialEntries(name);
  if (!ft || !tasks.length) return;
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId: ft.id, type: "PROJECT" } });
  if (!project) return;
  const on = new Date().toISOString().slice(0, 10);
  for (const t of tasks) {
    await prisma.task.update({
      where: { id: t.id },
      data: { projectId: project.id, taskFor: "PROJECT", details: { ...((t.details ?? {}) as object), becameProjectOn: on, becameProjectBy: m.user.name } },
    });
  }
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${project.id}`);
  revalidatePath("/dashboard/tasks");
}

/** The tender was not won (or is shelved): it leaves Saroj's list; the entries stay as history. */
export async function closePotentialAction(formData: FormData) {
  const m = await getCurrentMembership();
  if (!m || m.viewingAs || !canAddProjects(m)) return;
  const name = String(formData.get("name") || "");
  const outcome = String(formData.get("outcome") || "");
  if (!["Not awarded", "Cancelled by client", "Reopen"].includes(outcome)) return;
  const { tasks } = await potentialEntries(name);
  for (const t of tasks) {
    const d = { ...((t.details ?? {}) as Record<string, unknown>) };
    if (outcome === "Reopen") delete d.potentialClosed;
    else d.potentialClosed = outcome;
    await prisma.task.update({ where: { id: t.id }, data: { details: d as object } });
  }
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/tasks");
}
