"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { assignTaskToColleagueAction, addTaskTitlePresetAction } from "./actions";

const ADD_NEW_VALUE = "__add_new__";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add task"}
    </button>
  );
}

/** Dropdown of quick-pick titles, with a "+ Add new title…" option that saves a new one inline. */
function TitlePicker({ initialOptions }: { initialOptions: string[] }) {
  const [options, setOptions] = useState(initialOptions);
  const [selected, setSelected] = useState("");
  const [addingNew, setAddingNew] = useState(options.length === 0);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function saveNewTitle() {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setError("Enter a title first.");
      return;
    }
    setError(null);
    startSaving(async () => {
      const result = await addTaskTitlePresetAction(trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }
      const added = result.title!;
      setOptions((prev) => (prev.includes(added) ? prev : [...prev, added]));
      setSelected(added);
      setAddingNew(false);
      setNewTitle("");
    });
  }

  if (addingNew) {
    return (
      <div className="space-y-1">
        <div className="flex gap-2">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New task title"
            className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
          />
          <button
            type="button"
            onClick={saveNewTitle}
            disabled={saving}
            className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-[17px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add"}
          </button>
          {options.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setAddingNew(false);
                setNewTitle("");
                setError(null);
              }}
              className="shrink-0 text-[17px] text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
        {error && <p className="text-[15px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <select
      name="title"
      required
      value={selected}
      onChange={(e) => {
        if (e.target.value === ADD_NEW_VALUE) {
          setAddingNew(true);
        } else {
          setSelected(e.target.value);
        }
      }}
      className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
    >
      <option value="" disabled>
        Task title…
      </option>
      {options.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
      <option value={ADD_NEW_VALUE}>+ Add new title…</option>
    </select>
  );
}

export function AssignToColleagueForm({
  selfId,
  titleOptions,
  projects = [],
}: {
  /** This person's own membership id — every task added here is always for themself. */
  selfId: string;
  titleOptions: string[];
  projects?: { id: string; name: string; number: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(assignTaskToColleagueAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[19px] text-brand-600 hover:underline"
      >
        + Add task
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <input type="hidden" name="assigneeId" value={selfId} />
      <TitlePicker initialOptions={titleOptions} />
      <textarea
        name="description"
        rows={2}
        placeholder="e.g. Prepare BOQ for Al Ain villa project and email to client for review"
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
