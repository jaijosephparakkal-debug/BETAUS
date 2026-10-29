"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroySession, getCurrentMembership } from "@/lib/auth";
import { clockOut, clockInIfNeeded, type SignOutReason } from "@/lib/attendance";

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

/** After the automatic 6 PM clock-out: the person chooses to keep working, which starts a new attendance entry. */
export async function continueWorkingAction(): Promise<void> {
  const membership = await getCurrentMembership();
  if (!membership) return;
  await clockInIfNeeded(membership.id, { explicit: true });
  revalidatePath("/", "layout");
}
