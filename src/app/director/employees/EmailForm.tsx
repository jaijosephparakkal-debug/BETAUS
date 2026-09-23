"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateEmployeeEmailAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export default function EmailForm({
  userId,
  currentEmail,
}: {
  userId: string;
  currentEmail: string;
}) {
  const boundAction = updateEmployeeEmailAction.bind(null, userId);
  const [state, formAction] = useFormState(boundAction, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="email"
        type="email"
        defaultValue={currentEmail}
        className="w-56 rounded-md border border-brand-300 px-2 py-1 text-xs"
      />
      <SubmitButton />
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.ok && <span className="text-xs text-emerald-600">Saved</span>}
    </form>
  );
}
