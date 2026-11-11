import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReportEmail } from "@/lib/mailer";

// Every morning (7 AM Dubai): each person with follow-ups due today or overdue gets one email listing them.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const endOfToday = new Date(Math.floor((Date.now() + 4 * 3600 * 1000) / 86400000) * 86400000 + 86400000 - 4 * 3600 * 1000);
  const startOfToday = new Date(endOfToday.getTime() - 86400000);
  const due = await prisma.task.findMany({
    where: { followUpAt: { not: null, lt: endOfToday }, status: { not: "COMPLETED" } },
    include: { assignedTo: { include: { user: true } }, quotation: { select: { number: true } } },
    orderBy: { followUpAt: "asc" },
  });
  const byPerson = new Map<string, { name: string; email: string; rows: string[] }>();
  for (const t of due) {
    const key = t.assignedTo.user.email;
    const entry = byPerson.get(key) ?? { name: t.assignedTo.user.name, email: key, rows: [] };
    const when = t.followUpAt!.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
    entry.rows.push(`<li>${t.followUpAt! < startOfToday ? "<strong>Overdue</strong>" : "Today"} · ${t.quotation?.number ? `${t.quotation.number} · ` : ""}${t.title} · ${when}</li>`);
    byPerson.set(key, entry);
  }
  let sent = 0;
  for (const p of byPerson.values()) {
    const ok = await sendReportEmail(
      p.email,
      `Follow-ups due — ${p.rows.length}`,
      `<p>Hi ${p.name.split(" ")[0]},</p><p>These follow-ups are due today or overdue:</p><ul>${p.rows.join("")}</ul><p>Open My Tasks in the app to update them.</p><p>— OWN IT</p>`
    );
    if (ok) sent++;
    await new Promise((r) => setTimeout(r, 600));
  }
  return NextResponse.json({ people: byPerson.size, sent });
}
