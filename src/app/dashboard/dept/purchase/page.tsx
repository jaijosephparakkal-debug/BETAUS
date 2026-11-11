import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { formatDate } from "@/components/ui";
import { GN_DEPARTMENTS, aed, canSeeAmounts, inMonth, monthRange, ownerMembership, seesGnDepartments } from "@/lib/gnDepartments";
import { DeptHeader, Section, Stats, d, dn } from "../DeptParts";

/** Purchase (Manu): hand-overs from sales, POs, imports and deliveries, and enquiries for the month. */
export default async function PurchasePage({ searchParams }: { searchParams: { month?: string } }) {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!seesGnDepartments(me)) redirect("/dashboard");
  const dept = GN_DEPARTMENTS.purchase;
  const showAmt = canSeeAmounts(me, "purchase");
  const month = monthRange(searchParams.month);
  const owner = await ownerMembership("purchase");
  const now = new Date();

  const logs = owner
    ? await prisma.task.findMany({
        where: { assignedToId: owner.id, logKind: { in: ["PURCHASE_ORDER", "IMPORT", "ENQUIRY", "FOLLOW_UP"] }, ...inMonth(month.start, month.end) },
        orderBy: [{ eventAt: "desc" }, { createdAt: "desc" }],
      })
    : [];
  const handovers = owner
    ? await prisma.task.findMany({
        where: { assignedToId: owner.id, logKind: "HANDOVER", status: { not: "COMPLETED" } },
        include: { quotation: { include: { customer: true } } },
        orderBy: { followUpAt: "asc" },
      })
    : [];

  const pos = logs.filter((t) => t.logKind === "PURCHASE_ORDER");
  const imports = logs.filter((t) => t.logKind === "IMPORT");
  const enquiries = logs.filter((t) => t.logKind === "ENQUIRY");
  const followUps = logs.filter((t) => t.logKind === "FOLLOW_UP" && t.status === "COMPLETED");
  const delivered = imports.filter((t) => d(t.details, "stage") === "Delivered");
  const poValue = pos.reduce((s, t) => s + (dn(t.details, "amount") ?? 0), 0);
  const lateHandovers = handovers.filter((t) => t.followUpAt && t.followUpAt < now);

  return (
    <div className="space-y-6">
      <DeptHeader title={dept.label} owner={dept.ownerName} path="/dashboard/dept/purchase" month={month} amountsHidden={!showAmt} />

      <Stats
        items={[
          { label: "Orders to buy (from sales)", value: handovers.length, tone: lateHandovers.length ? "bad" : undefined },
          { label: "POs raised", value: pos.length },
          ...(showAmt ? [{ label: "PO value", value: aed(poValue) }] : []),
          { label: "Deliveries completed", value: delivered.length, tone: "good" },
          { label: "Enquiries handled", value: enquiries.length },
          { label: "Supplier follow-ups", value: followUps.length },
        ]}
      />

      <Section
        title="Orders to buy — handed over by sales"
        empty="Nothing waiting for purchase."
        rows={handovers.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: t.quotation ? `${t.quotation.number} · ${t.quotation.customer.name}` : t.title,
          sub: t.quotation?.product,
          right: showAmt && t.quotation ? aed(t.quotation.value) : undefined,
          badge: t.followUpAt
            ? { text: t.followUpAt < now ? `Overdue · ${formatDate(t.followUpAt)}` : `Due ${formatDate(t.followUpAt)}`, tone: t.followUpAt < now ? "bad" : "warn" }
            : undefined,
        }))}
      />

      <Section
        title="Purchase orders"
        empty="No POs logged this month."
        rows={pos.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: `${d(t.details, "poNumber") || "PO"} · ${d(t.details, "supplier")}`,
          sub: [d(t.details, "quotationNumber") && `for ${d(t.details, "quotationNumber")}`, d(t.details, "expectedOn") && `expected ${d(t.details, "expectedOn")}`]
            .filter(Boolean)
            .join(" · "),
          when: t.eventAt ?? t.completedAt,
          right: showAmt ? aed(dn(t.details, "amount")) : undefined,
          badge: d(t.details, "status") ? { text: d(t.details, "status"), tone: d(t.details, "status") === "Cancelled" ? "bad" : "plain" } : undefined,
        }))}
      />

      <Section
        title="Imports and deliveries"
        empty="No shipment updates this month."
        rows={imports.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: `${d(t.details, "supplier")}${d(t.details, "reference") ? ` · ${d(t.details, "reference")}` : ""}`,
          sub: [d(t.details, "quotationNumber"), d(t.details, "eta") && `ETA ${d(t.details, "eta")}`].filter(Boolean).join(" · "),
          when: t.eventAt ?? t.completedAt,
          badge: { text: d(t.details, "stage") || t.title, tone: d(t.details, "stage") === "Delivered" ? "good" : "plain" },
        }))}
      />

      <Section
        title="Enquiries"
        empty="No enquiries logged this month."
        rows={enquiries.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: `${t.forPerson ?? "Customer"} · ${d(t.details, "product")}`,
          sub: [d(t.details, "quantity") && `× ${d(t.details, "quantity")}`, d(t.details, "channel")].filter(Boolean).join(" · "),
          when: t.eventAt ?? t.completedAt,
          badge: { text: d(t.details, "status") || t.title, tone: d(t.details, "status") === "Converted to a quotation" ? "good" : "plain" },
        }))}
      />
    </div>
  );
}
