import { NextRequest, NextResponse } from "next/server";
import { sendExtendedWindowNotice } from "@/lib/reconcileNotice";

// Fired by Vercel Cron on 22 Oct 2026 at 3 PM Dubai (11:00 UTC) — see vercel.json.
const RECIPIENTS = ["sales@gasneeds.com", "jiyad.m@flaretechnical.com", "ram@flaretechnical.com"];

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendExtendedWindowNotice(RECIPIENTS);
  return NextResponse.json(result);
}
