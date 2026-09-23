import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/** Sends a sign-in code by email, or logs it to the console when no email service is configured. */
export async function sendCodeEmail(email: string, code: string) {
  if (!resend) {
    console.log(`\n[team-portal] Sign-in code for ${email}: ${code}\n`);
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Team Portal <onboarding@resend.dev>",
    to: email,
    subject: `Your sign-in code: ${code}`,
    text: `Your Team Portal sign-in code is ${code}. It expires in 10 minutes.`,
  });
}
