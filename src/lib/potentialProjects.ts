import { prisma } from "@/lib/db";

export type PotentialProject = {
  name: string;
  estimates: string[];
  lastAt: Date;
  /** Latest "where it stands" from Saroj's quotation entries, if any. */
  quoteStatus: string | null;
  entries: number;
  /** Set when closed without becoming a project (e.g. "Not awarded"). */
  closed: string | null;
};

/**
 * Saroj's potential projects (tenders not yet a project), built from his log entries: every Flaretech entry that
 * names a potential project and is not linked to a real project yet. Newest first.
 */
export async function getPotentialProjects(companyId: string): Promise<PotentialProject[]> {
  const rows = await prisma.task.findMany({
    where: { companyId, projectId: null, workedForCompany: "flaretechnical", eventAt: { not: null } },
    orderBy: { eventAt: "desc" },
    take: 2000,
    select: { details: true, eventAt: true, logKind: true },
  });
  const map = new Map<string, PotentialProject>();
  for (const r of rows) {
    const d = (r.details ?? {}) as Record<string, unknown>;
    const name = typeof d.potentialProject === "string" ? d.potentialProject : "";
    if (!name) continue;
    let p = map.get(name);
    if (!p) {
      p = { name, estimates: [], lastAt: r.eventAt!, quoteStatus: null, entries: 0, closed: null };
      map.set(name, p);
    }
    p.entries++;
    if (typeof d.estimateNumber === "string" && !p.estimates.includes(d.estimateNumber)) p.estimates.push(d.estimateNumber);
    if (!p.quoteStatus && r.logKind === "PROJECT_QUOTATION" && typeof d.status === "string") p.quoteStatus = d.status;
    if (!p.closed && typeof d.potentialClosed === "string") p.closed = d.potentialClosed;
  }
  return Array.from(map.values());
}
