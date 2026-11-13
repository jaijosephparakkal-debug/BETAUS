import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { PROFILES } from "@/lib/logOptions";
import { PROJECT_PROFILES } from "@/lib/projectLogOptions";

export const dynamic = "force-dynamic";

/** Management only: for everyone with a work-log form, which of their existing task buckets have no way to log into them. */
export async function GET() {
  const m = await getCurrentMembership();
  if (!m || !m.isDirector) return new NextResponse("Not allowed.", { status: 403 });
  const out: unknown[] = [];
  const emails = Array.from(new Set([...Object.keys(PROFILES), ...Object.keys(PROJECT_PROFILES)]));
  for (const email of emails) {
    const reach = new Set<string>(["calls & emails"]);
    const p = PROFILES[email];
    if (p) Object.values(p.parent).forEach((x) => reach.add(x.toLowerCase()));
    const pp = PROJECT_PROFILES[email];
    if (pp) pp.kinds.forEach((k) => { if (k.parent) reach.add(String(k.parent).toLowerCase()); });
    const mem = await prisma.membership.findMany({ where: { user: { email } }, select: { id: true, user: { select: { name: true } } } });
    if (mem.length === 0) continue;
    const ids = mem.map((x) => x.id);
    const buckets = await prisma.task.findMany({
      where: { assignedToId: { in: ids }, parentTaskId: null },
      select: { id: true, title: true, subtasks: { select: { createdAt: true, completedAt: true } } },
    });
    const since = new Date(Date.now() - 45 * 86400000);
    const gaps = buckets
      .filter((b) => !reach.has(b.title.toLowerCase()) && b.subtasks.length > 0)
      .map((b) => ({ bucket: b.title, entries: b.subtasks.length, last45days: b.subtasks.filter((s) => s.createdAt >= since || (s.completedAt && s.completedAt >= since)).length }))
      .sort((a, b) => b.entries - a.entries);
    out.push({ person: mem[0].user.name, email, formBuckets: Array.from(reach).length, gaps });
  }
  return NextResponse.json(out);
}
