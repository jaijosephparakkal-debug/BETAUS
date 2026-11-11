import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { canSeeQuotations } from "@/lib/teams";
import { Card, formatDate } from "@/components/ui";
import { statusLabel } from "@/lib/logOptions";

const KIND: Record<string, string> = { QUOTATION: "Quotation", FOLLOW_UP: "Follow-up", VISIT: "Visit", PRO: "PRO", HR: "HR", HANDOVER: "Hand-over" };

/** Everything done for one customer, in order: quotations, calls, visits, hand-overs and payment follow-ups. */
export default async function CustomerHistoryPage({ params }: { params: { id: string } }) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!canSeeQuotations(membership)) redirect("/dashboard");

  const customer = await prisma.customer.findUnique({ where: { id: params.id }, include: { quotations: { orderBy: { createdAt: "desc" } }, contacts: true } });
  if (!customer) notFound();
  const tasks = await prisma.task.findMany({
    where: { OR: [{ customerId: customer.id }, { quotation: { customerId: customer.id } }] },
    include: { assignedTo: { include: { user: true } }, quotation: { select: { number: true } } },
    orderBy: { eventAt: "desc" },
    take: 200,
  });
  const when = (d: Date | null) => (d ? d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }) : "");

  return (
    <div className="space-y-6">
      <Link href="/dashboard/quotations" className="text-[17px] text-brand-600 hover:underline">← Quotations</Link>
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">{customer.name}</h1>
        {customer.contacts.length > 0 && <p className="text-[17px] text-slate-500">Contacts: {customer.contacts.map((c) => c.name).join(", ")}</p>}
      </div>

      <Card>
        <h2 className="mb-2 text-[21px] font-semibold text-slate-900">Quotations — {customer.quotations.length}</h2>
        {customer.quotations.length === 0 ? <p className="text-[19px] text-slate-500">None yet.</p> : (
          <div className="divide-y divide-brand-100">
            {customer.quotations.map((q) => (
              <div key={q.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[18px]">
                <span className="font-medium text-slate-900">{q.number} <span className="font-normal text-slate-500">· {q.product}</span></span>
                <span className="text-[16px] text-slate-500">{q.value ? `AED ${q.value.toLocaleString("en-US")} · ` : ""}{statusLabel(q.status)} · {formatDate(q.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-[21px] font-semibold text-slate-900">History — {tasks.length}</h2>
        {tasks.length === 0 ? <p className="text-[19px] text-slate-500">Nothing logged yet.</p> : (
          <div className="divide-y divide-brand-100">
            {tasks.map((t) => (
              <Link key={t.id} href={`/dashboard/tasks/${t.id}`} className="block py-2.5 hover:bg-brand-50/40">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[17px]">
                  <span className="font-medium text-slate-900">{KIND[t.logKind ?? ""] ?? "Task"} · {t.title}</span>
                  <span className="text-[15px] text-slate-500">{when(t.eventAt ?? t.createdAt)}{t.enteredLater ? " · entered later" : ""}</span>
                </div>
                {t.description && <div className="text-[16px] text-slate-600">{t.description}</div>}
                <div className="text-[14px] text-slate-500">
                  {t.assignedTo.user.name}
                  {t.status !== "COMPLETED" && t.followUpAt ? ` · due ${when(t.followUpAt)}` : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
