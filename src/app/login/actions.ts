"use server";

import { redirect } from "next/navigation";
import { requestSignInCode, verifySignInCode } from "@/lib/otp";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clockInIfNeeded } from "@/lib/attendance";

export async function requestCodeAction(
  _prev: { error?: string; sent?: boolean; email?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; sent?: boolean; email?: string }> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Enter your work email." };

  const sent = await requestSignInCode(email);
  if (!sent) {
    return { error: "No account found for that email." };
  }

  return { sent: true, email };
}

export async function verifyCodeAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const code = String(formData.get("code") || "").trim();
  if (!email || !code) return { error: "Enter the 6-digit code." };

  const userId = await verifySignInCode(email, code);
  if (!userId) return { error: "That code is invalid or has expired." };

  await createSession(userId);

  const memberships = await prisma.membership.findMany({ where: { userId } });
  if (memberships.length === 1) {
    await clockInIfNeeded(memberships[0].id);
  }
  redirect(memberships.length > 1 ? "/select-company" : "/dashboard");
}
