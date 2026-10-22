import { prisma } from "@/lib/db";
import { sendReportEmail } from "@/lib/mailer";

/** Tells these people their reconciliation window is open until 10 PM tonight. Returns how many sent. */
export async function sendExtendedWindowNotice(emails: string[]) {
  const users = await prisma.user.findMany({ where: { email: { in: emails } } });
  let sent = 0;
  const failed: string[] = [];
  for (const u of users) {
    const html = `
      <p>Hi ${u.name.split(" ")[0]},</p>
      <p>The attendance reconciliation window is open for you until <strong>10:00 PM tonight</strong>.</p>
      <p>You can open the app, tap <strong>Reconcile my attendance</strong>, check the times recorded for you, and correct a login or logout time or add a missed shift, with a short reason. This is for your attendance only.</p>
      <p>Changes made in the window are recorded as manual corrections.</p>
      <p>— OWN IT</p>`;
    const ok = await sendReportEmail(u.email, "Attendance reconciliation is open for you until 10 PM today", html);
    if (ok) sent++;
    else failed.push(u.email);
    await new Promise((r) => setTimeout(r, 600));
  }
  return { sent, failed };
}
