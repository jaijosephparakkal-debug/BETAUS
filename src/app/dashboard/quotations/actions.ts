"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { canSeeQuotations } from "@/lib/teams";
import { QUOTE_STATUS } from "@/lib/logOptions";
import { createHandOver } from "@/lib/quotations";

/** Moves a quotation to its next stage. Order received hands it to Manu; Delivered hands it to Jintu; Paid closes the hand-overs. */
export async function setQuotationStatusAction(quotationId: string, formData: FormData): Promise<void> {
  const m = await getCurrentMembership();
  if (!m || !canSeeQuotations(m)) return;
  const status = String(formData.get("status") || "");
  if (!QUOTE_STATUS.some((s) => s.v === status)) return;
  const q = await prisma.quotation.findUnique({ where: { id: quotationId }, include: { customer: true } });
  if (!q || q.status === status) return;
  await prisma.quotation.update({ where: { id: q.id }, data: { status } });
  const company = await prisma.company.findUnique({ where: { id: q.companyId }, select: { slug: true } });
  const slug = company?.slug ?? "gasneeds";
  const dueAt = new Date(Date.now() + 2 * 86400000);
  if (status === "ORDER_RECEIVED") await createHandOver({ to: "manu", quotationId: q.id, assignedById: m.id, dueAt, companySlug: slug });
  if (status === "DELIVERED") await createHandOver({ to: "jintu", quotationId: q.id, assignedById: m.id, dueAt, companySlug: slug });
  if (status === "PAID") {
    await prisma.task.updateMany({
      where: { quotationId: q.id, logKind: "HANDOVER", status: { not: "COMPLETED" } },
      data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
    });
  }
  revalidatePath("/dashboard/quotations");
  revalidatePath("/dashboard/dept/operation");
  revalidatePath("/dashboard/dept/purchase");
  revalidatePath("/dashboard/dept/accounts");
}
