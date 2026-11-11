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
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add project"}
    </button>
  );
}

export function AddProjectForm({ companies = [], defaultCompanyId }: { companies?: { id: string; name: string }[]; defaultCompanyId?: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createProjectAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[19px] text-brand-600 hover:underline"
      >
        + Add a project
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      {companies.length > 1 && (
        <select
          name="companyId"
          defaultValue={defaultCompanyId}
          className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
          aria-label="Company"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <input
        name="number"
        placeholder="Project number (optional, e.g. P672-2021)"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
      />
      <input
        name="name"
        required
        placeholder="Project name"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
      />
      {state.error && <p className="text-[19px] text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[19px] text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
