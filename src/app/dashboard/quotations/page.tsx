import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { canSeeQuotations } from "@/lib/teams";
import { Card, CompanyTag, formatDate } from "@/components/ui";
import { LOG_FORM_EMAILS, QUOTE_STATUS, statusLabel } from "@/lib/logOptions";
import { setQuotationStatusAction } from "./actions";
import { canSeeAmounts } from "@/lib/gnDepartments";

const ORDER = ["SENT", "REVISED", "REVIEWING", "NEGOTIATING", "ORDER_RECEIVED", "DELIVERED", "PAID", "ON_HOLD", "NOT_AWARDED"];

/** All quotations by where they stand, with the value of each group; plus the customers. */
export default async function QuotationsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!canSeeQuotations(membership)) redirect("/dashboard");
  const canLog = LOG_FORM_EMAILS.includes(membership.user.email.toLowerCase());
  const showAmt = canSeeAmounts(membership, "operation");

  const quotations = await prisma.quotation.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true },
    take: 500,
  });
  const companies = await prisma.company.findMany({ select: { id: true, slug: true } });
  const slugOf = new Map(companies.map((c) => [c.id, c.slug]));
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { quotations: true } } } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">Quotations</h1>
        <p className="mt-1 text-[19px] text-slate-500">
          Every quotation by where it stands. The number follows the job from quotation to order, delivery and payment.
        </p>
      </div>

      {quotations.length === 0 && (
        <Card><p className="text-[19px] text-slate-500">No quotations yet. They appear here as they are logged.</p></Card>
      )}

      {ORDER.map((st) => {
        const list = quotations.filter((q) => q.status === st);
        if (list.length === 0) return null;
        const total = list.reduce((s, q) => s + (q.value ?? 0), 0);
        return (
          <Card key={st}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[21px] font-semibold text-slate-900">
                {statusLabel(st)} — {list.length}
              </h2>
              {showAmt && <span className="text-[17px] text-slate-500">AED {total.toLocaleString("en-US")}</span>}
            </div>
            <div className="divide-y divide-brand-100">
              {list.map((q) => (
                <div key={q.id} className="py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[19px] font-medium text-slate-900">
                      <CompanyTag slug={slugOf.get(q.companyId) ?? "gasneeds"} />
                      <Link href={`/dashboard/quotations/customers/${q.customerId}`} className="hover:underline">{q.number}</Link>
                    </span>
                    {showAmt && <span className="text-[17px] text-slate-600">{q.value ? `AED ${q.value.toLocaleString("en-US")}` : "—"}</span>}
                  </div>
                  <div className="text-[16px] text-slate-500">
                    {q.customer.name} · {q.product}{q.quantity ? ` × ${q.quantity}` : ""} · {formatDate(q.createdAt)}
                    {q.docUrl && (
                      <> · <a href={q.docUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">PDF</a></>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <form action={setQuotationStatusAction.bind(null, q.id)} className="flex items-center gap-2">
                      <select name="status" defaultValue={q.status} className="rounded-md border border-brand-300 px-2 py-1 text-[16px]">
                        {QUOTE_STATUS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                      </select>
                      <button type="submit" className="rounded-md border border-brand-300 px-2.5 py-1 text-[16px] text-brand-700 hover:bg-brand-50">Move</button>
                    </form>
                    {canLog && (
                      <Link href={`/dashboard/tasks?quotation=${q.id}`} className="text-[16px] text-brand-600 hover:underline">Log follow-up</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <Card>
        <h2 className="mb-2 text-[21px] font-semibold text-slate-900">Customers — {customers.length}</h2>
        {customers.length === 0 ? (
          <p className="text-[19px] text-slate-500">No customers yet.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {customers.map((c) => (
              <Link key={c.id} href={`/dashboard/quotations/customers/${c.id}`} className="flex items-center justify-between py-2 text-[19px] hover:bg-brand-50/40">
                <span className="flex items-center gap-2"><CompanyTag slug={slugOf.get(c.companyId) ?? "gasneeds"} />{c.name}</span>
                <span className="text-[16px] text-slate-500">{c._count.quotations} quotation{c._count.quotations === 1 ? "" : "s"}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
