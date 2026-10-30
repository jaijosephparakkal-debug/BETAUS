import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// TEMPORARY: until a company domain is verified with Resend, their sandbox
// sender can only deliver to the Resend account's own verified email. Set
// this to that address so every code still reaches someone real instead of
// silently failing — remove this env var once domain verification is done,
// and codes will go straight to each person's real address again.
const REDIRECT_TO = process.env.EMAIL_REDIRECT_TO;

const SENDER_NAME = "OWN IT";

// Always send under the product name; only the address comes from EMAIL_FROM,
// so a stale display name in that setting can't leak into inboxes.
function fromAddress() {
  const raw = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const match = raw.match(/<([^>]+)>/);
  return `${SENDER_NAME} <${(match ? match[1] : raw).trim()}>`;
}

/** Sends a sign-in code by email, or logs it to the console when no email service is configured. */
export async function sendCodeEmail(email: string, code: string) {
  if (!resend) {
    console.log(`\n[team-portal] Sign-in code for ${email}: ${code}\n`);
    return;
  }

  const to = REDIRECT_TO || email;
  const subject = REDIRECT_TO
    ? `[${email}] sign-in code: ${code}`
    : `Your sign-in code: ${code}`;
  const text = REDIRECT_TO
    ? `Sign-in code for ${email}: ${code}. It expires in 10 minutes.\n\n(Redirected to you because ${email}'s domain isn't verified with Resend yet.)`
    : `Your OWN IT sign-in code is ${code}. It expires in 10 minutes.`;

  const result = await resend.emails.send({
    from: fromAddress(),
    to,
    subject,
    text,
  });

  if (result.error) {
    // Fall back to the console so a bad Resend config never silently drops a code.
    console.error(`[team-portal] Resend error for ${email}:`, result.error);
    console.log(`\n[team-portal] Sign-in code for ${email}: ${code}\n`);
  }
}

/** Sends the scheduled 15-day/monthly KPI report to a director. Returns whether it sent successfully. */
export async function sendReportEmail(
  to: string,
  subject: string,
  html: string,
  attachment?: { filename: string; content: Buffer }
): Promise<boolean> {
  if (!resend) {
    console.log(`\n[team-portal] Report email skipped (no Resend configured): ${subject}\n`);
    return false;
  }

  const result = await resend.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
    ...(attachment ? { attachments: [{ filename: attachment.filename, content: attachment.content }] } : {}),
  });

  if (result.error) {
    console.error(`[team-portal] Resend error sending report to ${to}:`, result.error);
    return false;
  }
  return true;
}

/** Sends one email to a group (a normal "to everyone" message). Returns whether it sent successfully. */
export async function sendGroupEmail(to: string[], subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.log(`\n[team-portal] Group email skipped (no Resend configured): ${subject}\n`);
    return false;
  }
  const result = await resend.emails.send({ from: fromAddress(), to, subject, html });
  if (result.error) {
    console.error(`[team-portal] Resend error sending group email:`, result.error);
    return false;
  }
  return true;
}

/** Schedules an email for a later time (Resend holds it). Returns its id, or null if it couldn't be scheduled. */
export async function scheduleEmail(to: string, subject: string, html: string, at: Date): Promise<string | null> {
  if (!resend) {
    console.log(`\n[team-portal] Scheduled email skipped (no Resend configured): ${subject} @ ${at.toISOString()}\n`);
    return null;
  }
  const result = await resend.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
    scheduledAt: at.toISOString(),
  });
  if (result.error || !result.data) {
    console.error(`[team-portal] Resend error scheduling email to ${to}:`, result.error);
    return null;
  }
  return result.data.id;
}

/** Cancels an email scheduled with scheduleEmail. Never throws. */
export async function cancelScheduledEmail(id: string) {
  if (!resend) return;
  try {
    const result = await resend.emails.cancel(id);
    if (result.error) console.error(`[team-portal] Resend error cancelling ${id}:`, result.error);
  } catch (e) {
    console.error(`[team-portal] Resend error cancelling ${id}:`, e);
  }
}
