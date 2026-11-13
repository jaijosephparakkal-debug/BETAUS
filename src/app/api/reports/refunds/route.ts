import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PEOPLE = ["alerts@flaretechnical.com", "service@flaretechnical.com", "accounts@flaretechnical.com"];

/** Security deposit and refund entries logged by Flexie, Jayaprakash and Hashim (management only). */
export async function GET() {
  const m = await getCurrentMembership();
  if (!m || !m.isDirector) return new NextResponse("Not allowed.", { status: 403 });
  const rows = await prisma.task.findMany({
    where: {
      assignedTo: { user: { email: { in: PEOPLE } } },
      parentTaskId: { not: null },
      OR: [
        { title: { contains: "refund", mode: "insensitive" } },
        { title: { contains: "security deposit", mode: "insensitive" } },
        { description: { contains: "security deposit", mode: "insensitive" } },
        { logKind: "REFUND" },
      ],
    },
    select: {
      title: true, description: true, status: true, forPerson: true, logKind: true, eventAt: true, createdAt: true, completedAt: true, details: true,
      assignedTo: { select: { user: { select: { name: true } } } },
      comments: { orderBy: { createdAt: "asc" }, take: 2, select: { body: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const day = (d: Date | null) => (d ? new Date(d.getTime() + 4 * 3600 * 1000).toISOString().slice(0, 10) : "");
  return NextResponse.json(
    rows.map((t) => ({
      who: t.assignedTo.user.name,
      date: day(t.eventAt ?? t.completedAt ?? t.createdAt),
      title: t.title,
      for: t.forPerson ?? "",
      status: t.status,
      kind: t.logKind ?? "",
      note: [t.description, ...t.comments.map((c) => c.body)].filter((x) => x && x !== "Marked as Complete").join(" | ").slice(0, 300),
      building: (t.details as { building?: string } | null)?.building ?? "",
    }))
  );
}
