import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getCompanyApprovals } from "@/lib/queries";
import { Card, StatusBadge, formatDate } from "@/components/ui";

export default async function CompanyApprovalsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  const requests = await getCompanyApprovals(membership.companyId);
  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">
          Company Approvals — {membership.company.name}
        </h1>
        <p className="mt-1 text-[19px] text-slate-500">
          Every request company-wide, not just the ones addressed to you —
          an audit view. Decisions still happen between the requester and
          their own manager.
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">
          Pending — {pending.length}
        </h2>
        {pending.length === 0 ? (
          <p className="text-[19px] text-slate-500">Nothing pending right now.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {pending.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/approvals/${r.id}`}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-brand-50/40"
              >
                <div>
                  <div className="text-[19px] font-medium text-slate-900">
                    {r.title}
                  </div>
                  <div className="text-[17px] text-slate-500">
                    {r.requestedBy.user.name} → {r.approver.user.name} ·{" "}
                    {formatDate(r.createdAt)}
                    {r._count.attachments > 0 &&
                      ` · ${r._count.attachments} file${r._count.attachments === 1 ? "" : "s"}`}
                    {r._count.comments > 0 &&
                      ` · ${r._count.comments} comment${r._count.comments === 1 ? "" : "s"}`}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">
          Decided — {decided.length}
        </h2>
        {decided.length === 0 ? (
          <p className="text-[19px] text-slate-500">
            Nothing decided yet.
          </p>
        ) : (
          <div className="divide-y divide-brand-100">
            {decided.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/approvals/${r.id}`}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-brand-50/40"
              >
                <div>
                  <div className="text-[19px] font-medium text-slate-900">
                    {r.title}
                  </div>
                  <div className="text-[17px] text-slate-500">
                    {r.requestedBy.user.name} → {r.approver.user.name} ·{" "}
                    {formatDate(r.decidedAt ?? r.createdAt)}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
