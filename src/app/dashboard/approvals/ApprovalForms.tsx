"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createApprovalRequestAction, decideApprovalAction } from "./actions";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-[17px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function NewApprovalRequestForm() {
  const [state, formAction] = useFormState(createApprovalRequestAction, {});
  return (
    <form action={formAction} className="space-y-3">
      <input
        name="title"
        required
        placeholder="What needs approval? e.g. Sign off on Q3 travel budget"
        className="w-full rounded-lg border border-brand-300 px-3 py-2 text-[17px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <textarea
        name="description"
        rows={3}
        placeholder="Details (optional)"
        className="w-full rounded-lg border border-brand-300 px-3 py-2 text-[17px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <div>
        <label className="mb-1 block text-[15px] font-medium text-slate-500">
          Attach a file (optional) — quotation, drawing, site map, letter
        </label>
        <input
          type="file"
          name="file"
          className="text-[17px] text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[17px] file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>
      {state.error && <p className="text-[17px] text-red-600">{state.error}</p>}
      <SubmitButton label="Send for approval" pendingLabel="Sending…" />
    </form>
  );
}

export function DecideApprovalForm({ id }: { id: string }) {
  const boundAction = decideApprovalAction.bind(null, id);
  const [state, formAction] = useFormState(boundAction, {});
  return (
    <form action={formAction} className="mt-2 space-y-2">
      <input
        name="note"
        placeholder="Note (optional)"
        className="w-full rounded-lg border border-brand-300 px-3 py-1.5 text-[17px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {state.error && <p className="text-[17px] text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          name="decision"
          value="APPROVED"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[15px] font-medium text-white hover:bg-emerald-700"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="REJECTED"
          className="rounded-lg bg-red-600 px-3 py-1.5 text-[15px] font-medium text-white hover:bg-red-700"
        >
          Reject
        </button>
      </div>
    </form>
  );
}
