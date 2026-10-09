"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { assignTaskToColleagueAction, addTaskTitlePresetAction } from "./actions";
import { TASK_FOR_OPTIONS, OTHER_DEPARTMENTS, type TaskFor } from "@/lib/tasks";

type Choice = { id: string; name: string; number: string | null };
export type TaskForChoices = { projects: Choice[]; amc: Choice[]; dlp: Choice[] };

const selectClass = "w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]";

/**
 * "Task for" — Projects (pick a project), Maintenance (AMC or DLP, then the
 * site), or Others (Accounts / HR / Sales / Purchase + who it's for).
 * Projects and sites submit as projectId; Others as forDepartment/forPerson.
 */
function TaskForPicker({ choices }: { choices: TaskForChoices }) {
  const [taskFor, setTaskFor] = useState<TaskFor | "">("");
  const [maintenanceType, setMaintenanceType] = useState<"AMC" | "DLP" | "">("");
  const hasMaintenance = choices.amc.length + choices.dlp.length > 0;
  const sites = maintenanceType === "AMC" ? choices.amc : maintenanceType === "DLP" ? choices.dlp : [];

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-[15px] text-slate-600">Task for</label>
        <select
          name="taskFor"
          required
          value={taskFor}
          onChange={(e) => {
            setTaskFor(e.target.value as TaskFor);
            setMaintenanceType("");
          }}
          className={selectClass}
        >
          <option value="" disabled>
            Choose…
          </option>
          {(Object.keys(TASK_FOR_OPTIONS) as TaskFor[])
            .filter((k) => k !== "MAINTENANCE" || hasMaintenance)
            .map((k) => (
              <option key={k} value={k}>
                {TASK_FOR_OPTIONS[k]}
              </option>
            ))}
        </select>
      </div>

      {taskFor === "PROJECT" && (
        <select name="projectId" required defaultValue="" className={selectClass} aria-label="Project">
          <option value="" disabled>
            Choose project…
          </option>
          {choices.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.number ? `${p.number} — ${p.name}` : p.name}
            </option>
          ))}
        </select>
      )}

      {taskFor === "MAINTENANCE" && (
        <>
          <select
            required
            value={maintenanceType}
            onChange={(e) => setMaintenanceType(e.target.value as "AMC" | "DLP")}
            className={selectClass}
            aria-label="AMC or DLP"
          >
            <option value="" disabled>
              AMC or DLP…
            </option>
            {choices.amc.length > 0 && <option value="AMC">AMC</option>}
            {choices.dlp.length > 0 && <option value="DLP">DLP</option>}
          </select>
          {maintenanceType && (
            <select
              key={maintenanceType}
              name="projectId"
              required
              defaultValue=""
              className={selectClass}
              aria-label={`${maintenanceType} site`}
            >
              <option value="" disabled>
                Choose {maintenanceType} site…
              </option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      {taskFor === "OTHERS" && (
        <>
          <select name="forDepartment" required defaultValue="" className={selectClass} aria-label="Department">
            <option value="" disabled>
              Accounts, HR, Sales or Purchase…
            </option>
            {OTHER_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input name="forPerson" required placeholder="Who is this task for?" className={selectClass} />
        </>
      )}
    </div>
  );
}

const ADD_NEW_VALUE = "__add_new__";

// These default presets (added to every staff member's title list) capture
// who the interaction was with, so the "who was it with" pick shows up
// automatically whenever one of them is selected.
const CONTACT_TITLES = new Set(["Calls in", "Calls out", "Emails Attended", "Follow Up"]);
const CONTACT_TYPES = ["Vendor", "Supplier", "Client", "Office staff", "Site staff", "Others"];
const FOLLOW_UP_TOPICS = [
  "Quotation",
  "Invoice",
  "Bills",
  "Payments",
  "Drawing",
  "Plans",
  "Maintenance staff",
  "Site staff",
];

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

function CreatedToast() {
  return (
    <div className="toast-in fixed left-1/2 top-4 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-[17px] font-medium text-white shadow-lg">
      ✓ Task created
    </div>
  );
}

/** Dropdown of quick-pick titles, with a "+ Add new title…" option that saves a new one inline. */
function TitlePicker({
  initialOptions,
  onTitleChange,
}: {
  initialOptions: string[];
  onTitleChange: (title: string) => void;
}) {
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
      onTitleChange(added);
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
          onTitleChange(e.target.value);
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
  taskForChoices,
  companyOptions = [],
}: {
  /** This person's own membership id — every task added here is always for themself. */
  selfId: string;
  titleOptions: string[];
  taskForChoices: TaskForChoices;
  /** Only non-empty for the few people with responsibilities at both companies (see DUAL_COMPANY_EMAILS). */
  companyOptions?: { slug: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(assignTaskToColleagueAction, {});
  const [showToast, setShowToast] = useState(false);
  const isFirstRender = useRef(true);
  const [title, setTitle] = useState("");
  const [contactType, setContactType] = useState("");
  const showContactFields = CONTACT_TITLES.has(title);
  const showFollowUpField = title === "Follow Up";
  const showContactName = contactType === "Others";

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!state.error) {
      setOpen(false);
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  if (!open) {
    return (
      <>
        {showToast && <CreatedToast />}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[19px] text-brand-600 hover:underline"
        >
          + Add task
        </button>
      </>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 p-3">
      <input type="hidden" name="assigneeId" value={selfId} />
      <TitlePicker initialOptions={titleOptions} onTitleChange={setTitle} />
      <TaskForPicker choices={taskForChoices} />
      {showContactFields && (
        <div className="space-y-2">
          <div>
            <label className="block text-[15px] text-slate-600">Who was it with?</label>
            <select
              name="contactType"
              required
              value={contactType}
              onChange={(e) => setContactType(e.target.value)}
              className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
            >
              <option value="" disabled>
                Choose…
              </option>
              {CONTACT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {showContactName && (
            <input
              name="contactName"
              required
              placeholder="Mention who"
              className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
            />
          )}
        </div>
      )}
      {showFollowUpField && (
        <div>
          <label className="block text-[15px] text-slate-600">What are they following up on?</label>
          <select
            name="followUpTopic"
            required
            defaultValue=""
            className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
          >
            <option value="" disabled>
              Choose…
            </option>
            {FOLLOW_UP_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
      {companyOptions.length > 0 && (
        <div>
          <label className="block text-[15px] text-slate-600">Worked for which company?</label>
          <select
            name="workedForCompany"
            required
            defaultValue=""
            className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
          >
            <option value="" disabled>
              Choose company…
            </option>
            {companyOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <textarea
        name="description"
        rows={2}
        placeholder="e.g. Prepare BOQ for Al Ain villa project and email to client for review"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
      />
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
