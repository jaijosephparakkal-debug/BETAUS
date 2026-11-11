import { prisma } from "@/lib/db";
import { notifyNewTask } from "@/lib/notifications";

export const DUBAI_MS = 4 * 60 * 60 * 1000;

/** "YYYY-MM-DDTHH:mm" typed in Dubai time to a real instant. */
export function dubaiInputToDate(s: string) {
  return new Date(new Date(`${s}:00Z`).getTime() - DUBAI_MS);
}

/** Creates a quotation with the next number for its company and year (GN-Q-2026-0001), retrying if two are saved at once. */
export async function createQuotationNumbered(
  data: Omit<Parameters<typeof prisma.quotation.create>[0]["data"], "number" | "seq" | "year"> & { companyId: string },
  prefix: string,
  year: number
) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const last = await prisma.quotation.findFirst({
      where: { companyId: data.companyId, year, seq: { not: null } },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });
    const seq = (last?.seq ?? 0) + 1;
    const number = `${prefix}-Q-${year}-${String(seq).padStart(4, "0")}`;
    try {
      return await prisma.quotation.create({ data: { ...(data as object), number, seq, year } as Parameters<typeof prisma.quotation.create>[0]["data"] });
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
