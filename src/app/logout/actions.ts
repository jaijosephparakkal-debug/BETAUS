"use server";

import { redirect } from "next/navigation";
import { destroySession, getCurrentMembership } from "@/lib/auth";
import { clockOut, type SignOutReason } from "@/lib/attendance";

export async function signOutWithReasonAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const reason = String(formData.get("reason") || "") as SignOutReason;
  if (!["OFFICE_USE", "SICKNESS", "SHIFT_ENDED"].includes(reason)) {
    return { error: "Choose a reason before signing out." };
  }

  const membership = await getCurrentMembership();
  if (membership) {
    await clockOut(membership.id, reason);
  }

  await destroySession();
  redirect("/login");
}
