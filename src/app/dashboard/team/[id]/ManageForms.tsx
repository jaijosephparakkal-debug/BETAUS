"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { assignTaskAction, setKpiAction } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

type ProjectOption = { id: string; name: string; number: string | null };

export function AssignTaskForm({
  membershipId,
  projects = [],
}: {
  membershipId: string;
  projects?: ProjectOption[];
}) {
  const [open, setOpen] = useState(false);
  const boundAction = assignTaskAction.bind(null, membershipId);
  const [state, formAction] = useFormState(boundAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[19px] text-brand-600 hover:underline"
      >
        + Assign a task
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <input
        name="title"
        required
        placeholder="Task title"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Description (optional)"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
      />
      {projects.length > 0 && (
        <select
          name="projectId"
          defaultValue=""
          className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
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
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
      />
      {state.error && <p className="text-[19px] text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton label="Assign task" />
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

export function SetKpiForm({ membershipId }: { membershipId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = setKpiAction.bind(null, membershipId);
  const [state, formAction] = useFormState(boundAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[19px] text-brand-600 hover:underline"
      >
        + Set a KPI
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <input
        name="name"
        required
        placeholder="KPI name"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
      />
      <div className="flex gap-2">
        <input
          name="current"
          type="number"
          placeholder="Current"
          className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
        />
        <input
          name="target"
          type="number"
          required
          placeholder="Target"
          className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
        />
      </div>
      <input
        name="unit"
        placeholder="Unit (optional, e.g. % or hrs)"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
      />
      {state.error && <p className="text-[19px] text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton label="Set KPI" />
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
