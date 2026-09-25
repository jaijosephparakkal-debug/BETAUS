"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createProjectAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add project"}
    </button>
  );
}

export function AddProjectForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createProjectAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-brand-600 hover:underline"
      >
        + Add a project
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <input
        name="number"
        placeholder="Project number (optional, e.g. P672-2021)"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      <input
        name="name"
        required
        placeholder="Project name"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
