"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProjectStatusAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-[17px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Update status"}
    </button>
  );
}

export function UpdateProjectStatusForm({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: string;
}) {
  const boundAction = updateProjectStatusAction.bind(null, projectId);
  const [state, formAction] = useFormState(boundAction, {});

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-md border border-brand-300 px-2 py-1.5 text-[17px]"
      >
        <option value="ACTIVE">Active</option>
        <option value="ON_HOLD">On hold</option>
        <option value="COMPLETED">Completed</option>
      </select>
      <SubmitButton />
      {state.error && <p className="w-full text-[17px] text-red-600">{state.error}</p>}
    </form>
  );
}
