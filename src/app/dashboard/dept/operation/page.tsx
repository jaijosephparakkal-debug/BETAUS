import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { Card, CompanyTag, formatDate } from "@/components/ui";
import { QUOTE_STATUS, statusLabel } from "@/lib/logOptions";
import { canSeeQuotations } from "@/lib/teams";
import { GN_DEPARTMENTS, aed, canSeeAmounts, inMonth, monthRange, ownerMembership, seesGnDepartments } from "@/lib/gnDepartments";
import { setQuotationStatusAction } from "@/app/dashboard/quotations/actions";
import { DeptHeader, Section, Stats, d, type Row } from "../DeptParts";

const OPEN = ["SENT", "REVISED", "REVIEWING", "NEGOTIATING", "ON_HOLD"];
const WON = ["ORDER_RECEIVED", "DELIVERED", "PAID"];

/** Operation (Antony): quotations pipeline, follow-ups due, customer visits and PRO jobs for the month. */
export default async function OperationPage({ searchParams }: { searchParams: { month?: string } }) {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!seesGnDepartments(me)) redirect("/dashboard");
  const dept = GN_DEPARTMENTS.operation;
  const showAmt = canSeeAmounts(me, "operation");
  const canMove = canSeeQuotations(me) && (showAmt || me.user.email.toLowerCase() === dept.owner);
  const month = monthRange(searchParams.month);
  const owner = await ownerMembership("operation");
  const now = new Date();

  const companies = await prisma.company.findMany({ select: { id: true, slug: true } });
  const slugOf = new Map(companies.map((c) => [c.id, c.slug]));

  // The quotation pipeline is live (every open one, whenever it was made); won and lost are this month's.
  const quotes = await prisma.quotation.findMany({
    where: {
      OR: [{ status: { in: OPEN } }, { status: { notIn: OPEN }, updatedAt: { gte: month.start, lt: month.end } }],
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 400,
  });
  const sentThisMonth = await prisma.quotation.findMany({
    where: { createdAt: { gte: month.start, lt: month.end } },
    select: { value: true, status: true },
  });
  const wonThisMonth = quotes.filter((q) => WON.includes(q.status) && q.updatedAt >= month.start);

  const logs = owner
    ? await prisma.task.findMany({
        where: { assignedToId: owner.id, logKind: { in: ["VISIT", "PRO", "FOLLOW_UP"] }, ...inMonth(month.start, month.end) },
        orderBy: [{ eventAt: "desc" }, { createdAt: "desc" }],
      })
    : [];
  const due = owner
    ? await prisma.task.findMany({
        where: { assignedToId: owner.id, followUpAt: { not: null }, status: { not: "COMPLETED" } },
        orderBy: { followUpAt: "asc" },
        take: 50,
      })
    : [];

  const visits = logs.filter((t) => t.logKind === "VISIT");
  const pro = logs.filter((t) => t.logKind === "PRO");
  const followUpsDone = logs.filter((t) => t.logKind === "FOLLOW_UP" && t.status === "COMPLETED");
  const overdue = due.filter((t) => t.followUpAt! < now);

  const quoteRow = (q: (typeof quotes)[number]): Row => ({
    id: q.id,
    href: `/dashboard/quotations/customers/${q.customerId}`,
    company: slugOf.get(q.companyId) ?? "gasneeds",
    title: `${q.number} · ${q.customer.name}`,
    sub: `${q.product}${q.quantity ? ` × ${q.quantity}` : ""}`,
    when: q.createdAt,
    right: showAmt ? aed(q.value) : undefined,
    badge: { text: statusLabel(q.status), tone: WON.includes(q.status) ? "good" : q.status === "NOT_AWARDED" ? "bad" : "plain" },
  });
  const open = quotes.filter((q) => OPEN.includes(q.status));
  const won = quotes.filter((q) => WON.includes(q.status));
  const lost = quotes.filter((q) => q.status === "NOT_AWARDED");
  const sum = (list: { value: number | null }[]) => list.reduce((s, q) => s + (q.value ?? 0), 0);

  return (
    <div className="space-y-6">
      <DeptHeader title={dept.label} owner={dept.ownerName} path="/dashboard/dept/operation" month={month} amountsHidden={!showAmt} />

      <Stats
        items={[
          { label: "Quotations sent", value: sentThisMonth.length },
          { label: "Orders won", value: wonThisMonth.length, tone: "good" },
          ...(showAmt
            ? [
                { label: "Value quoted", value: aed(sum(sentThisMonth)) },
                { label: "Value won", value: aed(sum(wonThisMonth)), tone: "good" as const },
              ]
            : []),
          { label: "Customer visits", value: visits.length },
          { label: "Follow-ups done", value: followUpsDone.length },
          { label: "Follow-ups overdue", value: overdue.length, tone: overdue.length ? "bad" : undefined },
          { label: "PRO jobs", value: pro.length },
        ]}
      />

      <Card>
        <h2 className="mb-2 text-[21px] font-semibold text-slate-900">Quotations — open {open.length}</h2>
        <p className="mb-2 text-[15px] text-slate-500">
          Every quotation still waiting on the customer, whenever it was sent{showAmt ? ` · ${aed(sum(open))}` : ""}.
        </p>
        {open.length === 0 ? (
          <p className="text-[17px] text-slate-500">No open quotations.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {open.map((q) => {
              const r = quoteRow(q);
              return (
                <div key={q.id} className="py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={r.href!} className="flex min-w-0 items-center gap-2 hover:underline">
                      <CompanyTag slug={r.company!} />
                      <span className="text-[18px] font-medium text-slate-900">{r.title}</span>
                    </Link>
                    <span className="text-[16px] text-slate-600">{r.right}</span>
                  </div>
                  <div className="text-[15px] text-slate-500">
                    {r.sub} · {formatDate(q.createdAt)} · {statusLabel(q.status)}
                  </div>
                  {canMove && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <form action={setQuotationStatusAction.bind(null, q.id)} className="flex items-center gap-2">
                        <select name="status" defaultValue={q.status} className="rounded-md border border-brand-300 px-2 py-1 text-[16px]">
                          {QUOTE_STATUS.map((s) => (
                            <option key={s.v} value={s.v}>
                              {s.l}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="rounded-md border border-brand-300 px-2.5 py-1 text-[16px] text-brand-700 hover:bg-brand-50">
                          Move
                        </button>
                      </form>
                      <Link href={`/dashboard/tasks?quotation=${q.id}`} className="text-[16px] text-brand-600 hover:underline">
                        Log follow-up
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Section title="Won this month" rows={won.map(quoteRow)} empty="No orders won yet this month." />
      <Section title="Not awarded this month" rows={lost.map(quoteRow)} empty="None lost this month." />

      <Section
        title="Follow-ups due"
        empty="Nothing due."
        rows={due.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: t.title,
          sub: t.forPerson ?? undefined,
          badge: {
            text: t.followUpAt! < now ? `Overdue · ${formatDate(t.followUpAt)}` : `Due ${formatDate(t.followUpAt)}`,
            tone: t.followUpAt! < now ? "bad" : "warn",
          },
        }))}
      />

      <Section
        title="Customer visits"
        empty="No customer visits logged this month."
        rows={visits.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: t.forPerson ?? "Customer visit",
          sub: [d(t.details, "purpose"), d(t.details, "meetFrom") && `${d(t.details, "meetFrom")}–${d(t.details, "meetTo")}`].filter(Boolean).join(" · "),
          when: t.eventAt ?? t.completedAt,
        }))}
      />

      <Section
        title="PRO jobs"
        empty="No PRO work logged this month."
        rows={pro.map((t) => ({
          id: t.id,
          href: showAmt ? `/dashboard/tasks/${t.id}` : undefined,
          company: t.workedForCompany,
          title: `${d(t.details, "service") || t.title} · ${d(t.details, "employee")}`,
          sub: [d(t.details, "agency"), d(t.details, "transaction")].filter(Boolean).join(" · "),
          when: t.eventAt ?? t.completedAt,
          right: showAmt && d(t.details, "fees") ? `AED ${d(t.details, "fees")}` : undefined,
          badge: d(t.details, "stage") ? { text: d(t.details, "stage"), tone: d(t.details, "stage") === "Rejected" ? "bad" : "plain" } : undefined,
        }))}
      />
    </div>
  );
}
