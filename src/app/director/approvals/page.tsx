import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { getCompanyApprovals } from "@/lib/queries";
import { Card, StatusBadge, formatDate } from "@/components/ui";

type ApprovalRow = Awaited<ReturnType<typeof getCompanyApprovals>>[number];

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
          <div>
            <div className="text-[19px] font-medium text-slate-900">{r.title}</div>
            <div className="text-[17px] text-slate-500">
              {r.requestedBy.user.name} → {r.approver.user.name} ·{" "}
              {formatDate(r.status === "PENDING" ? r.createdAt : r.decidedAt ?? r.createdAt)}
              {r._count.attachments > 0 && ` · ${r._count.attachments} file${r._count.attachments === 1 ? "" : "s"}`}
              {r._count.comments > 0 && ` · ${r._count.comments} comment${r._count.comments === 1 ? "" : "s"}`}
            </div>
          </div>
          <StatusBadge status={r.status} />
        </Link>
      ))}
    </div>
  );
}

async function CompanyApprovalsSection({ company }: { company: { id: string; name: string } }) {
  const requests = await getCompanyApprovals(company.id);
  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-4">
      <h2 className="text-[21px] font-semibold text-slate-900">{company.name}</h2>
      <Card>
        <h3 className="mb-3 text-[19px] font-semibold text-slate-900">Pending — {pending.length}</h3>
        <ApprovalList requests={pending} />
      </Card>
      <Card>
        <h3 className="mb-3 text-[19px] font-semibold text-slate-900">Decided — {decided.length}</h3>
        <ApprovalList requests={decided} />
      </Card>
    </div>
  );
}

export default async function CompanyApprovalsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  // Only ever two companies system-wide — always shown together, no company switch involved.
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">Company Approvals — both companies</h1>
        <p className="mt-1 text-[19px] text-slate-500">
          Every request, not just the ones addressed to you — an audit view. Decisions still happen
          between the requester and their own approver.
        </p>
      </div>
      {companies.map((c) => (
        <CompanyApprovalsSection key={c.id} company={{ id: c.id, name: c.name }} />
      ))}
    </div>
  );
}
