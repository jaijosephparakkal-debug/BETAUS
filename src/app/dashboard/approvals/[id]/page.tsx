import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getApprovalRequestDetail } from "@/lib/queries";
import { Card, StatusBadge, AttachmentList, formatDate } from "@/components/ui";
import { DecideApprovalForm } from "../ApprovalForms";
import { CommentForm, UploadForm } from "./Forms";

export default async function ApprovalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const request = await getApprovalRequestDetail(params.id);
  if (!request || request.companyId !== membership.companyId) notFound();

  const isRequester = request.requestedById === membership.id;
  const isApprover = request.approverId === membership.id;
  if (!isRequester && !isApprover) redirect("/dashboard/approvals");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/approvals"
          className="text-sm text-brand-600 hover:underline"
        >
          ← Back to Approvals
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-900">{request.title}</h1>
          <StatusBadge status={request.status} />
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {request.requestedBy.user.name} → {request.approver.user.name} ·{" "}
          {formatDate(request.createdAt)}
        </div>
        {request.description && (
          <p className="mt-2 text-sm text-slate-600">{request.description}</p>
        )}
        {request.requestSignature && (
          <div className="mt-3">
            <div className="text-xs text-slate-400">
              Signed by {request.requestedBy.user.name}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={request.requestSignature}
              alt={`${request.requestedBy.user.name}'s signature`}
              className="h-10"
            />
          </div>
        )}
      </div>

      {request.status === "PENDING" && isApprover && (
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Your decision</h2>
          <DecideApprovalForm id={request.id} />
        </Card>
      )}

      {request.status !== "PENDING" && (
        <Card>
          <h2 className="mb-2 font-semibold text-slate-900">Decision</h2>
          {request.decisionNote && (
            <p className="text-sm text-slate-600">
              &ldquo;{request.decisionNote}&rdquo;
            </p>
          )}
          <div className="mt-1 text-xs text-slate-500">
            {formatDate(request.decidedAt)}
          </div>
          {request.decisionSignature && (
            <div className="mt-3">
              <div className="text-xs text-slate-400">
                Signed by {request.approver.user.name}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={request.decisionSignature}
                alt={`${request.approver.user.name}'s signature`}
                className="h-10"
              />
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">
          Documents — quotations, drawings, site maps, submission plans
        </h2>
        <AttachmentList attachments={request.attachments} />
        <div className="mt-3 border-t border-brand-100 pt-3">
          <UploadForm requestId={request.id} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Comments</h2>
        <div className="space-y-4">
          {request.comments.map((c) => (
            <div key={c.id} className="border-l-2 border-brand-200 pl-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {c.author.user.name}
                </span>
                <span>{formatDate(c.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {c.body}
              </p>
            </div>
          ))}
          {request.comments.length === 0 && (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}
        </div>
        <div className="mt-4 border-t border-brand-100 pt-4">
          <CommentForm requestId={request.id} />
        </div>
      </Card>
    </div>
  );
}
