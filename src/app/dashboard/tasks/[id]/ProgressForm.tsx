"use client";

import { useFormState, useFormStatus } from "react-dom";
import { logProgressAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Log update"}
    </button>
  );
}

export default function ProgressForm({ taskId }: { taskId: string }) {
  const boundAction = logProgressAction.bind(null, taskId);
  const [state, formAction] = useFormState(boundAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-[19px] font-medium text-slate-700">Update</label>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="e.g. Site visit completed, submitted quotation to client, awaiting confirmation"
          className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-[19px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      {state.error && <p className="text-[19px] text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
