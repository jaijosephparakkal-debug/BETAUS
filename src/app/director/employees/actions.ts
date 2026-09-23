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
