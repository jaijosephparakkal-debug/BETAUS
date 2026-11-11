import { prisma } from "@/lib/db";
import { DUBAI_OFFSET_MS, dubaiDateKey } from "@/lib/attendance";

/**
 * Gas Needs department pages. Everyone at Gas Needs can open every page and see what stands where;
 * only the page's owner, Abraham and Jai see money amounts (AED) and personal HR details.
 */
export const GN_DEPARTMENTS = {
  operation: { label: "Operation", owner: "sales@gasneeds.com", ownerName: "Antony" },
  purchase: { label: "Purchase", owner: "business@gasneeds.com", ownerName: "Manu" },
  accounts: { label: "Accounts", owner: "accounts@gasneeds.com", ownerName: "Jintu" },
} as const;
export type GnDept = keyof typeof GN_DEPARTMENTS;

const ALWAYS_SEE_AMOUNTS = ["abraham@flaretechnical.com", "jai@gasneeds.com"];

type Viewer = { isDirector: boolean; company: { slug: string }; user: { email: string } };

/** Who gets the Gas Needs department tabs: Gas Needs staff and the directors. */
export function seesGnDepartments(m: Viewer) {
  return m.isDirector || m.company.slug === "gasneeds";
}

/** AED amounts (and personal HR details) on a department page: its owner, Abraham and Jai only. */
export function canSeeAmounts(m: Viewer, dept: GnDept) {
  const email = m.user.email.toLowerCase();
  return ALWAYS_SEE_AMOUNTS.includes(email) || email === GN_DEPARTMENTS[dept].owner;
}

/** The owner's Gas Needs membership (their work log lives under it). */
export function ownerMembership(dept: GnDept) {
  return prisma.membership.findFirst({
    where: { user: { email: { equals: GN_DEPARTMENTS[dept].owner, mode: "insensitive" } }, company: { slug: "gasneeds" } },
    include: { user: true },
  });
}

/** A Dubai calendar month from "YYYY-MM" (default: this month), with prev/next keys and a label. */
export function monthRange(key?: string) {
  const now = dubaiDateKey(new Date()).slice(0, 7);
  const k = key && /^\d{4}-\d{2}$/.test(key) ? key : now;
  const [y, m] = k.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1) - DUBAI_OFFSET_MS);
  const end = new Date(Date.UTC(y, m, 1) - DUBAI_OFFSET_MS);
  const shift = (d: number) => {
    const t = new Date(Date.UTC(y, m - 1 + d, 1));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  return { key: k, start, end, prev: shift(-1), next: shift(1), isCurrent: k === now, label };
}

/** Work-log entries whose "when it happened" falls in the month (older rows fall back to completed/created). */
export function inMonth(start: Date, end: Date) {
  return {
    OR: [
      { eventAt: { gte: start, lt: end } },
      { eventAt: null, completedAt: { gte: start, lt: end } },
      { eventAt: null, completedAt: null, createdAt: { gte: start, lt: end } },
    ],
  };
}

export const aed = (n: unknown) => (typeof n === "number" && n > 0 ? `AED ${n.toLocaleString("en-US")}` : "—");
