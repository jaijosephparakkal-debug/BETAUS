import { NextRequest, NextResponse } from "next/server";
import { runScheduledReports } from "@/lib/reports";

// Triggered by Vercel Cron on the 1st and 16th of each month — see vercel.json.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runScheduledReports("semimonthly");
  return NextResponse.json({ ok: true, results });
}
