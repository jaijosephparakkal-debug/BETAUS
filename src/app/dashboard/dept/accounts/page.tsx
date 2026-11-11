import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { formatDate } from "@/components/ui";
import { statusLabel } from "@/lib/logOptions";
import { GN_DEPARTMENTS, aed, canSeeAmounts, inMonth, monthRange, ownerMembership, seesGnDepartments } from "@/lib/gnDepartments";
import { DeptHeader, Section, Stats, d, dn } from "../DeptParts";

/** Accounts (Jintu): what customers still owe, payments in and out, follow-ups and promised dates. */
export default async function GnAccountsPage({ searchParams }: { searchParams: { month?: string } }) {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!seesGnDepartments(me)) redirect("/dashboard");
  const dept = GN_DEPARTMENTS.accounts;
  const showAmt = canSeeAmounts(me, "accounts");
  const month = monthRange(searchParams.month);
  const owner = await ownerMembership("accounts");
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const companies = await prisma.company.findMany({ select: { id: true, slug: true } });
  const slugOf = new Map(companies.map((c) => [c.id, c.slug]));

  // Receivables are live: every delivered-but-unpaid quotation, and every open payment hand-over.
  const unpaid = await prisma.quotation.findMany({ where: { status: "DELIVERED" }, include: { customer: true }, orderBy: { updatedAt: "asc" } });
  const handovers = owner
    ? await prisma.task.findMany({
        where: { assignedToId: owner.id, logKind: "HANDOVER", status: { not: "COMPLETED" } },
        include: { quotation: { include: { customer: true } } },
        orderBy: { followUpAt: "asc" },
      })
    : [];
  const logs = owner
    ? await prisma.task.findMany({
        where: {
          assignedToId: owner.id,
          logKind: { in: ["PAYMENT_RECEIVED", "PAYMENT_MADE", "PAYMENT_FOLLOW_UP", "CASH_CHEQUE", "ACCOUNTS_ENTRY"] },
          ...inMonth(month.start, month.end),
        },
        orderBy: [{ eventAt: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const received = logs.filter((t) => t.logKind === "PAYMENT_RECEIVED");
  const made = logs.filter((t) => t.logKind === "PAYMENT_MADE");
  const chases = logs.filter((t) => t.logKind === "PAYMENT_FOLLOW_UP");
  const cash = logs.filter((t) => t.logKind === "CASH_CHEQUE");
  const entries = logs.filter((t) => t.logKind === "ACCOUNTS_ENTRY");
  const total = (list: typeof logs) => list.reduce((s, t) => s + (dn(t.details, "amount") ?? 0), 0);
  const promised = chases.filter((t) => d(t.details, "promisedOn"));
  const promisedLate = promised.filter((t) => d(t.details, "promisedOn") < today);

  return (
    <div className="space-y-6">
      <DeptHeader title={dept.label} owner={dept.ownerName} path="/dashboard/dept/accounts" month={month} amountsHidden={!showAmt} />

      <Stats
        items={[
          { label: "Waiting for payment", value: unpaid.length + handovers.filter((h) => !h.quotationId || !unpaid.some((q) => q.id === h.quotationId)).length, tone: "warn" },
          ...(showAmt ? [{ label: "Still owed", value: aed(unpaid.reduce((s, q) => s + (q.value ?? 0), 0)), tone: "warn" as const }] : []),
          { label: "Payments received", value: received.length, tone: "good" },
          ...(showAmt ? [{ label: "Collected", value: aed(total(received)), tone: "good" as const }] : []),
          { label: "Payments made", value: made.length },
          ...(showAmt ? [{ label: "Paid out", value: aed(total(made)) }] : []),
          { label: "Payment follow-ups", value: chases.length },
          { label: "Promised dates passed", value: promisedLate.length, tone: promisedLate.length ? "bad" : undefined },
        ]}
      />

      <Section
        title="Waiting for payment"
        empty="Nothing waiting for payment."
        rows={[
          ...unpaid.map((q) => ({
            id: q.id,
            href: `/dashboard/quotations/customers/${q.customerId}`,
            company: slugOf.get(q.companyId) ?? "gasneeds",
            title: `${q.number} · ${q.customer.name}`,
            sub: `${q.product} · delivered`,
            when: q.updatedAt,
            right: showAmt ? aed(q.value) : undefined,
            badge: { text: statusLabel(q.status), tone: "warn" as const },
          })),
          ...handovers
            .filter((h) => !h.quotationId || !unpaid.some((q) => q.id === h.quotationId))
            .map((h) => ({
              id: h.id,
              href: showAmt ? `/dashboard/tasks/${h.id}` : undefined,
              company: h.workedForCompany,
              title: h.quotation ? `${h.quotation.number} · ${h.quotation.customer.name}` : h.title,
              sub: "handed over for payment",
              right: showAmt && h.quotation ? aed(h.quotation.value) : undefined,
              badge: h.followUpAt
                ? { text: h.followUpAt < now ? `Overdue · ${formatDate(h.followUpAt)}` : `Due ${formatDate(h.followUpAt)}`, tone: (h.followUpAt < now ? "bad" : "warn") as "bad" | "warn" }
                : undefined,
            })),
        ]}
      />

      <Section
        title="Payment follow-ups"
        empty="No payment follow-ups this month."
        rows={chases.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: t.forPerson ?? "Payment follow-up",
          sub: [d(t.details, "quotationNumber") || (d(t.details, "invoiceNumber") && `Invoice ${d(t.details, "invoiceNumber")}`), d(t.details, "channel"), d(t.details, "response")]
            .filter(Boolean)
            .join(" · "),
          when: t.eventAt ?? t.completedAt,
          right: showAmt && dn(t.details, "amount") ? aed(dn(t.details, "amount")) : undefined,
          badge: d(t.details, "promisedOn")
            ? { text: `Promised ${formatDate(d(t.details, "promisedOn"))}`, tone: (d(t.details, "promisedOn") < today ? "bad" : "warn") as "bad" | "warn" }
            : undefined,
        }))}
      />

      <Section
        title="Payments received"
        empty="No payments received logged this month."
        rows={received.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: t.forPerson ?? "Payment received",
          sub: [d(t.details, "paymentType"), d(t.details, "method"), d(t.details, "quotationNumber")].filter(Boolean).join(" · "),
          when: t.eventAt ?? t.completedAt,
          right: showAmt ? aed(dn(t.details, "amount")) : undefined,
          badge: { text: "Received", tone: "good" as const },
        }))}
      />

      <Section
        title="Payments made"
        empty="No payments made logged this month."
        rows={made.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: d(t.details, "supplier") || t.forPerson || "Payment made",
          sub: [d(t.details, "method"), d(t.details, "poNumber") && `PO ${d(t.details, "poNumber")}`].filter(Boolean).join(" · "),
          when: t.eventAt ?? t.completedAt,
          right: showAmt ? aed(dn(t.details, "amount")) : undefined,
        }))}
      />

      <Section
        title="Cheques, cash and entries"
        empty="Nothing logged this month."
        rows={[...cash, ...entries].map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: d(t.details, "type") || t.title,
          sub: [d(t.details, "bank"), d(t.details, "reference")].filter(Boolean).join(" · "),
          when: t.eventAt ?? t.completedAt,
          right: showAmt && dn(t.details, "amount") ? aed(dn(t.details, "amount")) : undefined,
        }))}
      />
    </div>
  );
}
