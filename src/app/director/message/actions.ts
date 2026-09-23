"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";

export async function postMessageAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) return { error: "Only the director can post." };

  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Write a message first." };

  await prisma.directorMessage.create({
    data: {
      companyId: membership.companyId,
      authorId: membership.id,
      body,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/director/message");
  return {};
}
