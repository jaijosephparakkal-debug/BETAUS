"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";

export async function updateEmployeeEmailAction(
  userId: string,
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };
  if (!membership.isDirector) return { error: "Only the director can do this." };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid email." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    return { error: "Another account already uses that email." };
  }

  await prisma.user.update({ where: { id: userId }, data: { email } });

  revalidatePath("/director/employees");
  return { ok: true };
}

// Starting KPI for each new hire's role, at 0 progress (the seed's sample
// "current" values are demo data, not real results).
const STARTER_KPIS: Record<string, { name: string; target: number; unit: string }> = {
  "Design Engineer": { name: "Designs Delivered On Time", target: 90, unit: "%" },
};

const DEFAULT_TITLE_PRESETS = ["Calls in", "Calls out", "Emails Attended", "Updated Tasks on OWNIT", "Follow Up"];

export async function addEmployeeAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const me = await getCurrentMembership();
  if (!me) return { error: "Not signed in." };
  if (!me.isDirector) return { error: "Only the director can do this." };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const companyId = String(formData.get("companyId") || "");
  const managerId = String(formData.get("managerId") || "");

  if (!name) return { error: "Enter the employee's name." };
  if (!email || !email.includes("@")) return { error: "Enter a valid email." };
  if (!title) return { error: "Enter a job title." };

  const myAccess = await prisma.membership.findFirst({ where: { userId: me.userId, companyId } });
  if (!myAccess) return { error: "Choose one of your companies." };
  const manager = managerId
    ? await prisma.membership.findFirst({ where: { id: managerId, companyId } })
    : null;
  if (managerId && !manager) return { error: "Choose a manager from that company." };

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name },
  });
  const already = await prisma.membership.findUnique({
    where: { userId_companyId: { userId: user.id, companyId } },
  });
  if (already) return { error: "That person is already on this company's team." };

  const created = await prisma.membership.create({
    data: {
      userId: user.id,
      companyId,
      title,
      department: department || null,
      managerId: manager?.id ?? null,
    },
  });

  const kpi = STARTER_KPIS[title];
  if (kpi) {
    await prisma.kpi.create({
      data: { membershipId: created.id, name: kpi.name, target: kpi.target, current: 0, unit: kpi.unit },
    });
  }
  for (const preset of DEFAULT_TITLE_PRESETS) {
    await prisma.taskTitlePreset.create({ data: { membershipId: created.id, title: preset } });
  }

  revalidatePath("/director/employees");
  revalidatePath("/director/staff");
  revalidatePath("/director");
  return { ok: true };
}
