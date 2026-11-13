import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PEOPLE = ["alerts@flaretechnical.com", "service@flaretechnical.com", "accounts@flaretechnical.com"];

/** Security deposit and refund entries logged by Flexie, Jayaprakash and Hashim (management only). */
export async function GET(req: Request) {
  const m = await getCurrentMembership();
  if (!m || !m.isDirector) return new NextResponse("Not allowed.", { status: 403 });
  const url = new URL(req.url);
  const wide = url.searchParams.get("wide") === "1";
  const terms = wide ? ["refund", "deposit", "rebate"] : ["refund", "security deposit"];
  const rows = await prisma.task.findMany({
    where: {
      assignedTo: { user: { email: { in: wide && url.searchParams.get("who") ? [url.searchParams.get("who") as string] : PEOPLE } } },
      ...(wide ? {} : { parentTaskId: { not: null } }),
      OR: [
        ...terms.flatMap((t) => [{ title: { contains: t, mode: "insensitive" as const } }, { description: { contains: t, mode: "insensitive" as const } }]),
        ...(wide ? terms.map((t) => ({ comments: { some: { body: { contains: t, mode: "insensitive" as const } } } })) : []),
        { logKind: "REFUND" },
      ],
    },
    select: {
      id: true, parentTaskId: true, title: true, description: true, status: true, forPerson: true, logKind: true, eventAt: true, createdAt: true, completedAt: true, details: true,
      parentTask: { select: { title: true } },
      assignedTo: { select: { user: { select: { name: true } } } },
      comments: { orderBy: { createdAt: "asc" }, take: 6, select: { body: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const day = (d: Date | null) => (d ? new Date(d.getTime() + 4 * 3600 * 1000).toISOString().slice(0, 10) : "");
  return NextResponse.json(
    rows.map((t) => ({
      id: t.id,
      parent: t.parentTask?.title ?? "(top level)",
      who: t.assignedTo.user.name,
      date: day(t.eventAt ?? t.completedAt ?? t.createdAt),
      title: t.title,
      for: t.forPerson ?? "",
      status: t.status,
      kind: t.logKind ?? "",
      note: [t.description, ...t.comments.map((c) => c.body)].filter((x) => x && x !== "Marked as Complete").join(" | ").slice(0, 400),
      building: (t.details as { building?: string } | null)?.building ?? "",
    }))
  );
}
