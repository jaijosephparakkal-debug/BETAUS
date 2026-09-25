"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  postApprovalCommentAction,
  uploadApprovalAttachmentAction,
} from "../actions";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function CommentForm({ requestId }: { requestId: string }) {
  const boundAction = postApprovalCommentAction.bind(null, requestId);
  const [state, formAction] = useFormState(boundAction, {});
  return (
    <form action={formAction} className="space-y-2">
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Leave a comment or ask a question…"
        className="w-full rounded-lg border border-brand-300 px-3 py-2 text-[19px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {state.error && <p className="text-[19px] text-red-600">{state.error}</p>}
      <SubmitButton label="Comment" pendingLabel="Posting…" />
    </form>
  );
}

export function UploadForm({ requestId }: { requestId: string }) {
  const boundAction = uploadApprovalAttachmentAction.bind(null, requestId);
  const [state, formAction] = useFormState(boundAction, {});
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        name="file"
        required
        className="text-[19px] text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[19px] file:font-medium file:text-slate-700 hover:file:bg-slate-200"
      />
      <SubmitButton label="Upload" pendingLabel="Uploading…" />
      {state.error && <p className="w-full text-[19px] text-red-600">{state.error}</p>}
    </form>
  );
}
