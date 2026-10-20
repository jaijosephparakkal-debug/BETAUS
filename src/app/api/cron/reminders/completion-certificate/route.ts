import { NextRequest, NextResponse } from "next/server";
import { sendReportEmail } from "@/lib/mailer";

// One-off reminders for Jiyad's task: collect the P1120-2026 Fatayer Ala Al Tayer
// Cafeteria completion certificate and submit an update to Abraham Sir by
// 21 Oct 2026, 4 PM Dubai. Fired by two dated Vercel Cron entries (see vercel.json):
// 12:00 PM Dubai (08:00 UTC) and 4:00 PM Dubai (12:00 UTC).
const RECIPIENTS = ["jiyad.m@flaretechnical.com", "abraham@flaretechnical.com"];

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hourUtc = new Date().getUTCHours();
  const isFinal = hourUtc >= 12;
  const when = isFinal ? "4:00 PM today is the deadline" : "due today by 4:00 PM";

  const subject = `Reminder${isFinal ? " (deadline now)" : ""}: Completion certificate — P1120-2026 Fatayer Ala Al Tayer Cafeteria`;
  const html = `
    <p><strong>Reminder:</strong> the completion certificate for <strong>P1120-2026 — Fatayer Ala Al Tayer Cafeteria</strong> is to be collected, and an update submitted to Abraham Sir — ${when}.</p>
    <p>Task owner: Jiyad.</p>
  `;

  const results = await Promise.all(RECIPIENTS.map((to) => sendReportEmail(to, subject, html)));
  return NextResponse.json({ ok: results.every(Boolean), recipients: RECIPIENTS, results });
}
