import { prisma } from "@/lib/db";
import { notifyNewTask } from "@/lib/notifications";

export const DUBAI_MS = 4 * 60 * 60 * 1000;

/** "YYYY-MM-DDTHH:mm" typed in Dubai time to a real instant. */
export function dubaiInputToDate(s: string) {
  return new Date(new Date(`${s}:00Z`).getTime() - DUBAI_MS);
}

/** Creates a quotation with the next number for its company and year (GN-Q-2026-0001), retrying if two are saved at once. */
export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
export const quotationNumber = (prefix: string, year: number, month: number, seq: number) =>
  `${prefix}-Q-${year}-${MONTHS[month - 1]}-${String(seq).padStart(4, "0")}`;

export async function createQuotationNumbered(
  data: Omit<Parameters<typeof prisma.quotation.create>[0]["data"], "number" | "seq" | "year" | "month"> & { companyId: string },
  prefix: string,
  year: number,
  month: number
) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const last = await prisma.quotation.findFirst({
      where: { companyId: data.companyId, year, month, seq: { not: null } },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });
    const seq = (last?.seq ?? 0) + 1;
    const number = quotationNumber(prefix, year, month, seq);
    try {
      return await prisma.quotation.create({ data: { ...(data as object), number, seq, year, month } as Parameters<typeof prisma.quotation.create>[0]["data"] });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002" || attempt === 3) throw e;
    }
  }
  throw new Error("Could not number the quotation.");
}

const HAND_OVER = {
  manu: { email: "business@gasneeds.com", parentId: "mp_purchase_orders", label: "Purchase follow-up" },
  jintu: { email: "accounts@gasneeds.com", parentId: "ji_payments_receipts", label: "Payment follow-up" },
} as const;

/** Gives the next person their task for this quotation, with the quotation number in the title, and notifies them. */
export async function createHandOver(opts: {
  to: "manu" | "jintu";
  quotationId: string;
  assignedById: string;
  dueAt: Date;
  companySlug: string;
}): Promise<string | null> {
  const cfg = HAND_OVER[opts.to];
  const q = await prisma.quotation.findUnique({ where: { id: opts.quotationId }, include: { customer: true } });
  const member = await prisma.membership.findFirst({
    where: { user: { email: { equals: cfg.email, mode: "insensitive" } }, company: { slug: "gasneeds" } },
  });
  const parent = await prisma.task.findUnique({ where: { id: cfg.parentId } });
  if (!q || !member || !parent) return null;
  const open = await prisma.task.findFirst({
    where: { quotationId: q.id, logKind: "HANDOVER", assignedToId: member.id, status: { not: "COMPLETED" } },
    select: { id: true },
  });
  if (open) return open.id;
  const title = `${cfg.label} — ${q.number}`;
  const task = await prisma.task.create({
    data: {
      companyId: member.companyId,
      title,
      description: `${q.customer.name} · ${q.product}${q.value ? ` · AED ${q.value.toLocaleString("en-US")}` : ""}`,
      assignedToId: member.id,
      assignedById: opts.assignedById,
      parentTaskId: parent.id,
      category: parent.category ?? parent.title,
      status: "NOT_STARTED",
      deadline: opts.dueAt,
      followUpAt: opts.dueAt,
      quotationId: q.id,
      customerId: q.customerId,
      logKind: "HANDOVER",
      workedForCompany: opts.companySlug,
      eventAt: new Date(),
    },
  });
  await notifyNewTask(member.id, task.id, title);
  return task.id;
}

/** Next running number for a key, e.g. SR-2026-NOV-0001. Atomic, so two people never get the same number. */
export async function nextRunning(key: string, make: (n: number) => string) {
  const row = await prisma.numberCounter.upsert({ where: { key }, update: { last: { increment: 1 } }, create: { key, last: 1 } });
  return make(row.last);
}

const GENERIC_HAND_OVER = {
  flexie: { email: "alerts@flaretechnical.com", parentId: "fx_gas_billing_invoicing", label: "First bill" },
  hashim: { email: "accounts@flaretechnical.com", parentId: "ha_accounts_collections_follow_ups", label: "Collection follow-up" },
} as const;

/** Gives Flexie or Hashim the next task in a maintenance flow and notifies them. */
export async function createMaintenanceHandOver(opts: { to: "flexie" | "hashim"; ref: string; description: string; assignedById: string; dueAt: Date; companySlug: string }) {
  const cfg = GENERIC_HAND_OVER[opts.to];
  const member = await prisma.membership.findFirst({ where: { user: { email: { equals: cfg.email, mode: "insensitive" } }, company: { slug: "flaretechnical" } } });
  const parent = await prisma.task.findUnique({ where: { id: cfg.parentId } });
  if (!member || !parent) return null;
  const title = `${cfg.label} — ${opts.ref}`.slice(0, 160);
  const task = await prisma.task.create({
    data: {
      companyId: member.companyId, title, description: opts.description.slice(0, 500), assignedToId: member.id, assignedById: opts.assignedById,
      parentTaskId: parent.id, category: parent.category ?? parent.title, status: "NOT_STARTED", deadline: opts.dueAt, followUpAt: opts.dueAt,
      logKind: "HANDOVER", workedForCompany: opts.companySlug, eventAt: new Date(),
    },
  });
  await notifyNewTask(member.id, task.id, title);
  return task.id;
}
