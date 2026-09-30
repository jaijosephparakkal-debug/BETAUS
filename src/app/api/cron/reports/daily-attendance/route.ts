import { NextRequest, NextResponse } from "next/server";
import { buildAttendanceExcel } from "@/lib/attendanceExcel";
import { sendReportEmail } from "@/lib/mailer";

// Triggered by Vercel Cron daily at 10:00 PM Dubai time (18:00 UTC) — see vercel.json.
// Sends Simi an Excel sheet of every office staff clock-in/out across both
// companies for that day.
const RECIPIENT_EMAIL = "simi@flaretechnical.com";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { buffer, label, count } = await buildAttendanceExcel();

  const sent = await sendReportEmail(
    RECIPIENT_EMAIL,
    `Daily Attendance — ${label}`,
    `<p>Attached is the attendance sheet for <strong>${label}</strong>, covering ${count} clock-in${count === 1 ? "" : "s"} across both companies.</p>`,
    { filename: `attendance-${new Date().toISOString().slice(0, 10)}.xlsx`, content: buffer }
  );

  return NextResponse.json({ ok: sent, label, count, recipient: RECIPIENT_EMAIL });
}
