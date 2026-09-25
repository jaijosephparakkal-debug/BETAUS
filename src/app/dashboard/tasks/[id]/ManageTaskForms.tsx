"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  addDailyTaskAction,
  deleteTaskAction,
  reassignTaskAction,
  updateTaskAction,
} from "./actions";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AddDailyTaskForm({ parentTaskId }: { parentTaskId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = addDailyTaskAction.bind(null, parentTaskId);
  const [state, formAction] = useFormState(boundAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-brand-600 hover:underline"
      >
        + Add a daily task
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <input
        name="title"
        required
        placeholder="Daily task title"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Description (optional)"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      <input
        name="deadline"
        type="date"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton label="Add daily task" pendingLabel="Adding…" />
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

type ProjectOption = { id: string; name: string; number: string | null };

export function EditTaskForm({
  taskId,
  initialTitle,
  initialDescription,
  initialDeadline,
  initialProjectId,
  projects = [],
}: {
  taskId: string;
  initialTitle: string;
  initialDescription: string;
  initialDeadline: string; // yyyy-mm-dd or ""
  initialProjectId?: string;
  projects?: ProjectOption[];
}) {
  const [open, setOpen] = useState(false);
  const boundAction = updateTaskAction.bind(null, taskId);
  const [state, formAction] = useFormState(boundAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-brand-600 hover:underline"
      >
        Edit
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <input
        name="title"
        required
        defaultValue={initialTitle}
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      <textarea
        name="description"
        rows={2}
        defaultValue={initialDescription}
        placeholder="Description (optional)"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      {projects.length > 0 && (
        <select
          name="projectId"
          defaultValue={initialProjectId ?? ""}
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
        defaultValue={initialDeadline}
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton label="Save" pendingLabel="Saving…" />
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

export function ReassignTaskForm({
  taskId,
  currentAssigneeId,
  employees,
}: {
  taskId: string;
  currentAssigneeId: string;
  employees: { id: string; name: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const boundAction = reassignTaskAction.bind(null, taskId);
  const [state, formAction] = useFormState(boundAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-brand-600 hover:underline"
      >
        Reassign
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <select
        name="assigneeId"
        defaultValue={currentAssigneeId}
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-sm"
      >
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name} — {e.title}
          </option>
        ))}
      </select>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton label="Reassign" pendingLabel="Reassigning…" />
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

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const boundAction = deleteTaskAction.bind(null, taskId);
  const [state, formAction] = useFormState(boundAction, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm("Delete this task? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        className="text-sm text-red-600 hover:underline"
      >
        Delete task
      </button>
    </form>
  );
}
