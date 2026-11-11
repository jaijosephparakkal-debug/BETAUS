"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canManageAllStaff, getCurrentMembership } from "@/lib/auth";
import { sendReportEmail } from "@/lib/mailer";
import { RECIPIENTS, buildEmail } from "@/lib/rolloutEmail";

const FLAG = "rollout-email-2026-11";

export async function sendRolloutAction(_prev: { message?: string; error?: string } | undefined): Promise<{ message?: string; error?: string }> {
  const m = await getCurrentMembership();
  if (!m || m.viewingAs || !canManageAllStaff(m)) return { error: "Only the director can send this." };
  const done = await prisma.numberCounter.findUnique({ where: { key: FLAG } });
  if (done) return { error: "This email has already been sent. Nothing was sent again." };
  const ok: string[] = [];
  const failed: string[] = [];
  for (const r of RECIPIENTS) {
    const { subject, html } = buildEmail(r);
    const sent = await sendReportEmail(r.email, subject, html);
    (sent ? ok : failed).push(r.name);
  }
  if (ok.length > 0) await prisma.numberCounter.create({ data: { key: FLAG, last: ok.length } });
  revalidatePath("/director/rollout");
  return failed.length
    ? { error: `Sent to ${ok.length}. Failed for: ${failed.join(", ")}. The page will not resend, so tell me and I will send those separately.`, message: ok.length ? `Sent to ${ok.join(", ")}.` : undefined }
    : { message: `Sent to all ${ok.length}: ${ok.join(", ")}.` };
}
