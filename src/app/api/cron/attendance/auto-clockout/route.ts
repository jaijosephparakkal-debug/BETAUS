import { NextRequest, NextResponse } from "next/server";
import { autoClockOutAllOverdue } from "@/lib/attendance";

// Daily sweep at 18:00 Dubai time (14:00 UTC) — see vercel.json. Staff who open
// the app are also clocked out on the spot (clockInIfNeeded), so this mainly
// catches people who aren't browsing. Closed entries get the exact 6 PM time.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const closed = await autoClockOutAllOverdue();
  return NextResponse.json({ ok: true, closed });
}
