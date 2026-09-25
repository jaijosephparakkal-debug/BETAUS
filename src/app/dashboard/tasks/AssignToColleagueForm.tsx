"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { assignTaskToColleagueAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Assigning…" : "Assign task"}
    </button>
  );
}

export function AssignToColleagueForm({
  colleagues,
  projects = [],
}: {
  colleagues: { id: string; name: string; title: string }[];
  projects?: { id: string; name: string; number: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(assignTaskToColleagueAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-brand-600 hover:underline"
      >
        + Assign a task to a colleague
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <select
        name="assigneeId"
        required
        defaultValue=""
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      >
        <option value="" disabled>
          Choose a colleague…
        </option>
        {colleagues.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} — {c.title}
          </option>
        ))}
      </select>
      <input
        name="title"
        required
        placeholder="Task title"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Description (optional)"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      {projects.length > 0 && (
        <select
          name="projectId"
          defaultValue=""
          className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.number ? `${p.number} — ${p.name}` : p.name}
            </option>
          ))}
        </select>
      )}
      <input
        name="deadline"
        type="date"
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
