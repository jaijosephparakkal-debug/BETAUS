import { prisma } from "@/lib/db";
import { estimatePrefix } from "@/lib/projectLogOptions";

/** Next estimation number for the month the work happened in (Dubai time): FT-EST-2026-NOV-0001. */
export async function nextEstimateNumber(companyId: string, when: Date) {
  const prefix = estimatePrefix(when);
  const used = await prisma.task.findMany({
    where: { companyId, details: { path: ["estimateNumber"], string_starts_with: prefix } },
    select: { details: true },
  });
  const max = used.reduce((mx, t) => {
    const n = Number(String((t.details as Record<string, unknown>).estimateNumber).slice(prefix.length));
    return Number.isFinite(n) && n > mx ? n : mx;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}
