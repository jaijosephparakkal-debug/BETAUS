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
    : `Your Team Portal sign-in code is ${code}. It expires in 10 minutes.`;

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Team Portal <onboarding@resend.dev>",
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
