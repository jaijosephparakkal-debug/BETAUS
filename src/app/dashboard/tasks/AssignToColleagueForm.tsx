"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { assignTaskToColleagueAction, addTaskTitlePresetAction } from "./actions";
import { TASK_FOR_OPTIONS, OTHER_DEPARTMENTS, ADD_OTHER, type TaskFor } from "@/lib/taskFor";

type Choice = { id: string; name: string; number: string | null };
export type TaskForChoices = { projects: Choice[]; amc: Choice[]; dlp: Choice[] };

const selectClass = "w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]";

/**
 * A dropdown whose last option, "+ Add other…", swaps to a text box (with a
 * link back to the list). The typed text is submitted as `name` — or, when
 * `otherName` is given, as `otherName` while `name` submits ADD_OTHER.
 */
function SelectWithOther({
  name,
  otherName,
  options,
  placeholder,
  otherPlaceholder,
  value,
  onChange,
  ariaLabel,
}: {
  name: string;
  otherName?: string;
  options: { value: string; label: string }[];
  placeholder: string;
  otherPlaceholder: string;
  value?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
}) {
  const [inner, setInner] = useState("");
  const current = value ?? inner;
  const set = (v: string) => (onChange ? onChange(v) : setInner(v));

  if (current === ADD_OTHER) {
    return (
      <div className="flex gap-2">
        {otherName && <input type="hidden" name={name} value={ADD_OTHER} />}
        <input
          autoFocus
          name={otherName ?? name}
          required
          placeholder={otherPlaceholder}
          aria-label={ariaLabel}
          className={selectClass}
        />
        <button
          type="button"
          onClick={() => set("")}
          className="shrink-0 text-[15px] text-slate-500 hover:text-slate-700"
        >
          ← List
        </button>
      </div>
    );
  }
  return (
    <select
      name={name}
      required
      value={current}
      onChange={(e) => set(e.target.value)}
      className={selectClass}
      aria-label={ariaLabel}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      <option value={ADD_OTHER}>+ Add other…</option>
    </select>
  );
}

const asOptions = (list: readonly string[]) => list.map((x) => ({ value: x, label: x }));

/**
 * "Task for" — Projects (pick a project), Maintenance (AMC or DLP, then the
 * site), or Others (Accounts / HR / Sales / Purchase + who it's for). Every
 * dropdown also has "+ Add other…" to type an answer instead. A picked
 * project/site submits as projectId; typed answers go to forDepartment /
 * forPerson.
 */
function TaskForPicker({ choices }: { choices: TaskForChoices }) {
  const [taskFor, setTaskFor] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const hasMaintenance = choices.amc.length + choices.dlp.length > 0;
  const sites = maintenanceType === "AMC" ? choices.amc : maintenanceType === "DLP" ? choices.dlp : [];
  const siteOptions = (list: Choice[]) =>
    list.map((p) => ({ value: p.id, label: p.number ? `${p.number} — ${p.name}` : p.name }));

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-[15px] text-slate-600">Task for</label>
        <SelectWithOther
          name="taskFor"
          otherName="forPerson"
          value={taskFor}
          onChange={(v) => {
            setTaskFor(v);
            setMaintenanceType("");
          }}
          placeholder="Choose…"
          otherPlaceholder="What is this task for?"
          options={(Object.keys(TASK_FOR_OPTIONS) as TaskFor[])
            .filter((k) => k !== "MAINTENANCE" || hasMaintenance)
            .map((k) => ({ value: k, label: TASK_FOR_OPTIONS[k] }))}
        />
      </div>

      {taskFor === "PROJECT" && (
        <SelectWithOther
          name="projectId"
          otherName="forPerson"
          placeholder="Choose project…"
          otherPlaceholder="Project name"
          ariaLabel="Project"
          options={siteOptions(choices.projects)}
        />
      )}

      {taskFor === "MAINTENANCE" && (
        <>
          <SelectWithOther
            name="forDepartment"
            value={maintenanceType}
            onChange={setMaintenanceType}
            placeholder="AMC or DLP…"
            otherPlaceholder="Type of maintenance"
            ariaLabel="AMC or DLP"
            options={[
              ...(choices.amc.length > 0 ? [{ value: "AMC", label: "AMC" }] : []),
              ...(choices.dlp.length > 0 ? [{ value: "DLP", label: "DLP" }] : []),
            ]}
          />
          {(maintenanceType === "AMC" || maintenanceType === "DLP") && (
            <SelectWithOther
              key={maintenanceType}
              name="projectId"
              otherName="forPerson"
              placeholder={`Choose ${maintenanceType} site…`}
              otherPlaceholder="Site name"
              ariaLabel={`${maintenanceType} site`}
              options={siteOptions(sites)}
            />
          )}
          {maintenanceType === ADD_OTHER && (
            <input name="forPerson" required placeholder="Site name" className={selectClass} />
          )}
        </>
      )}

      {taskFor === "OTHERS" && (
        <>
          <SelectWithOther
            name="forDepartment"
            placeholder="Accounts, HR, Sales or Purchase…"
            otherPlaceholder="Department"
            ariaLabel="Department"
            options={asOptions(OTHER_DEPARTMENTS)}
          />
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
// Jayaprakash and Saroj also deal with the internal departments: for them,
// "Others" opens a second pick of these, or "+ Add other…" to type a name
// (see DEPARTMENT_CONTACT_EMAILS on the page). Saved as contactName.
const OTHER_CONTACT_DEPARTMENTS = ["Accounts", "HR", "Sales", "Purchase"];
// Jayaprakash's own titles ("Phone in", "Phone out", "Emails sent", ...) are
// interactions too — matched loosely so small wording/case differences still count.
const LOOSE_CONTACT_TITLE = /^(phone|calls?)\s*(in|out)\b|^emails?\s+(sent|attended)\b/i;
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
  departmentContacts = false,
}: {
  /** Adds Accounts/HR/Sales/Purchase to "Who was it with?" and matches phone/email titles loosely. */
  departmentContacts?: boolean;
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
  const showContactFields =
    CONTACT_TITLES.has(title) || (departmentContacts && LOOSE_CONTACT_TITLE.test(title.trim()));
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
            <SelectWithOther
              name="contactType"
              otherName="contactName"
              value={contactType}
              onChange={setContactType}
              placeholder="Choose…"
              otherPlaceholder="Mention who"
              options={asOptions(CONTACT_TYPES)}
            />
          </div>
          {showContactName &&
            (departmentContacts ? (
              <SelectWithOther
                name="contactName"
                placeholder="Accounts, HR, Sales, Purchase…"
                otherPlaceholder="Mention who"
                ariaLabel="Which other"
                options={asOptions(OTHER_CONTACT_DEPARTMENTS)}
              />
            ) : (
              <input name="contactName" required placeholder="Mention who" className={selectClass} />
            ))}
        </div>
      )}
      {showFollowUpField && (
        <div>
          <label className="block text-[15px] text-slate-600">What are they following up on?</label>
          <SelectWithOther
            name="followUpTopic"
            placeholder="Choose…"
            otherPlaceholder="What are they following up on?"
            options={asOptions(FOLLOW_UP_TOPICS)}
          />
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
