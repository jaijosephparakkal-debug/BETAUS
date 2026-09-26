"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createApprovalRequestAction,
  decideApprovalAction,
  reassignApprovalAction,
} from "./actions";

type ColleagueOption = { id: string; name: string; title: string };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function NewApprovalRequestForm({ colleagues }: { colleagues: ColleagueOption[] }) {
  const [state, formAction] = useFormState(createApprovalRequestAction, {});
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-[17px] font-medium text-slate-500">
          Send to
        </label>
        <select
          name="approverId"
          required
          defaultValue=""
          className="w-full rounded-lg border border-brand-300 px-3 py-2 text-[19px]"
        >
          <option value="" disabled>
            Choose who this goes to…
          </option>
          {colleagues.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[17px] font-medium text-slate-500">
          What are you asking for
        </label>
        <select
          name="requestType"
          defaultValue="APPROVAL"
          className="w-full rounded-lg border border-brand-300 px-3 py-2 text-[19px]"
        >
          <option value="REVIEW">Review only</option>
          <option value="APPROVAL">Approval</option>
          <option value="BOTH">Review and approval</option>
        </select>
      </div>
      <input
        name="title"
        required
        placeholder="What needs approval? e.g. Sign off on Q3 travel budget"
        className="w-full rounded-lg border border-brand-300 px-3 py-2 text-[19px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <textarea
        name="description"
        rows={3}
        placeholder="Details (optional)"
        className="w-full rounded-lg border border-brand-300 px-3 py-2 text-[19px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <div>
        <label className="mb-1 block text-[17px] font-medium text-slate-500">
          Deadline (optional)
        </label>
        <input
          name="deadline"
          type="date"
          className="w-full rounded-lg border border-brand-300 px-3 py-2 text-[19px]"
        />
      </div>
      <div>
        <label className="mb-1 block text-[17px] font-medium text-slate-500">
          Attach a file (optional) — quotation, drawing, site map, letter
        </label>
        <input
          type="file"
          name="file"
          className="text-[19px] text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[19px] file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>
      <p className="text-[17px] text-slate-500">
        Your saved signature (above) is attached automatically when this is sent.
      </p>
      {state.error && <p className="text-[19px] text-red-600">{state.error}</p>}
      <SubmitButton label="Send for approval" pendingLabel="Sending…" />
    </form>
  );
}

export function DecideApprovalForm({ id }: { id: string }) {
  const boundAction = decideApprovalAction.bind(null, id);
  const [state, formAction] = useFormState(boundAction, {});
  return (
    <form action={formAction} className="mt-2 space-y-2">
      <select
        name="outcome"
        required
        defaultValue=""
        className="w-full rounded-lg border border-brand-300 px-3 py-1.5 text-[19px]"
      >
        <option value="" disabled>
          Choose an outcome…
        </option>
        <option value="REVIEWED">Reviewed</option>
        <option value="APPROVED">Approved</option>
        <option value="REVIEWED_AND_APPROVED">Reviewed and approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
      <input
        name="note"
        placeholder="Note (optional)"
        className="w-full rounded-lg border border-brand-300 px-3 py-1.5 text-[19px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {state.error && <p className="text-[19px] text-red-600">{state.error}</p>}
      <SubmitButton label="Send decision" pendingLabel="Sending…" />
    </form>
  );
}

export function ReassignApprovalForm({
  id,
  colleagues,
}: {
  id: string;
  colleagues: ColleagueOption[];
}) {
  const [open, setOpen] = useState(false);
  const boundAction = reassignApprovalAction.bind(null, id);
  const [state, formAction] = useFormState(boundAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[17px] text-brand-600 hover:underline"
      >
        Reassign to someone else instead
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <select
        name="newApproverId"
        required
        defaultValue=""
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[17px]"
      >
        <option value="" disabled>
          Reassign to…
        </option>
        {colleagues.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} — {c.title}
          </option>
        ))}
      </select>
      {state.error && <p className="text-[17px] text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-[17px] font-medium text-white hover:bg-brand-700"
        >
          Reassign
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[17px] text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
