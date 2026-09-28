import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { getCompanyApprovals } from "@/lib/queries";
import { Card, StatusBadge, CompanyTag, formatDate } from "@/components/ui";

type ApprovalRow = Awaited<ReturnType<typeof getCompanyApprovals>>[number] & { companySlug: string };

function ApprovalList({ requests }: { requests: ApprovalRow[] }) {
  if (requests.length === 0) {
    return <p className="text-[19px] text-slate-500">Nothing here.</p>;
  }
  return (
    <div className="divide-y divide-brand-100">
      {requests.map((r) => (
        <Link
          key={r.id}
          href={`/dashboard/approvals/${r.id}`}
          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-brand-50/40"
        >
          <div className="flex min-w-0 items-center gap-2">
            <CompanyTag slug={r.companySlug} />
            <div className="min-w-0">
              <div className="truncate text-[19px] font-medium text-slate-900">{r.title}</div>
              <div className="truncate text-[17px] text-slate-500">
                {r.requestedBy.user.name} → {r.approver.user.name} ·{" "}
                {formatDate(r.status === "PENDING" ? r.createdAt : r.decidedAt ?? r.createdAt)}
                {r._count.attachments > 0 && ` · ${r._count.attachments} file${r._count.attachments === 1 ? "" : "s"}`}
                {r._count.comments > 0 && ` · ${r._count.comments} comment${r._count.comments === 1 ? "" : "s"}`}
              </div>
            </div>
          </div>
          <StatusBadge status={r.status} />
        </Link>
      ))}
    </div>
  );
}

export default async function CompanyApprovalsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  // Only ever two companies system-wide — merged into one Pending list and
  // one Decided list, each row tagged by company, instead of two separate
  // per-company sections. No company switch involved anywhere here.
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  const allRequests: ApprovalRow[] = [];
  for (const c of companies) {
    const requests = await getCompanyApprovals(c.id);
    allRequests.push(...requests.map((r) => ({ ...r, companySlug: c.slug })));
  }

  const pending = allRequests
    .filter((r) => r.status === "PENDING")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const decided = allRequests
    .filter((r) => r.status !== "PENDING")
    .sort((a, b) => (b.decidedAt ?? b.createdAt).getTime() - (a.decidedAt ?? a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">Company Approvals — both companies</h1>
        <p className="mt-1 text-[19px] text-slate-500">
          Every request, not just the ones addressed to you — an audit view. Decisions still happen
          between the requester and their own approver.
        </p>
      </div>
      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Pending — {pending.length}</h2>
        <ApprovalList requests={pending} />
      </Card>
      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Decided — {decided.length}</h2>
        <ApprovalList requests={decided} />
      </Card>
    </div>
  );
}
