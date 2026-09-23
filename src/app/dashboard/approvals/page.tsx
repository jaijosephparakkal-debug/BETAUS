import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getMyApprovalRequests, getPendingApprovalsFor } from "@/lib/queries";
import { Card, StatusBadge, formatDate } from "@/components/ui";
import { SignaturePad } from "@/components/SignaturePad";
import { NewApprovalRequestForm } from "./ApprovalForms";

export default async function ApprovalsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const [myRequests, pending] = await Promise.all([
    getMyApprovalRequests(membership.id),
    getPendingApprovalsFor(membership.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Approvals</h1>

      <Card>
        <h2 className="mb-1 font-semibold text-slate-900">Your signature</h2>
        <p className="mb-3 text-sm text-slate-500">
          Draw it once — it&rsquo;s attached automatically whenever you send
          or decide a request, like signing a document.
        </p>
        <SignaturePad existing={membership.user.signature} />
      </Card>

      {pending.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">
            Waiting on you — {pending.length}
          </h2>
          <div className="divide-y divide-brand-100">
            {pending.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/approvals/${r.id}`}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-brand-50/40"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {r.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    From {r.requestedBy.user.name} · {formatDate(r.createdAt)}
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
        </Card>
      )}

      {membership.managerId ? (
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">
            Send a new request
          </h2>
          <p className="mb-3 text-sm text-slate-500">
            Goes to your manager for approval — sign-off, a read, a decision.
          </p>
          <NewApprovalRequestForm />
        </Card>
      ) : null}

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">My requests</h2>
        {myRequests.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing sent for approval yet.
          </p>
        ) : (
          <div className="divide-y divide-brand-100">
            {myRequests.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/approvals/${r.id}`}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-brand-50/40"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {r.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    To {r.approver.user.name} · {formatDate(r.createdAt)}
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
    </div>
  );
}
