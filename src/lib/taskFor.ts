// "Task for" on My Tasks' add form. Client-safe (no prisma import), shared
// by the form, the server action and the task cards.

export const TASK_FOR_OPTIONS = { PROJECT: "Projects", MAINTENANCE: "Maintenance", OTHERS: "Others" } as const;
export type TaskFor = keyof typeof TASK_FOR_OPTIONS;
export const OTHER_DEPARTMENTS = ["Accounts", "HR", "Sales", "Purchase"] as const;

/** Value a dropdown submits when its "+ Add other…" option is picked and the text goes to a separate field. */
export const ADD_OTHER = "__other__";

/**
 * The small "For: ..." tag for a task, covering typed-in ("+ Add other…")
 * answers. Returns null when the linked project/site already says it all.
 */
export function taskForLabel(t: {
  taskFor?: string | null;
  forDepartment?: string | null;
  forPerson?: string | null;
  project?: unknown | null;
}) {
  if (t.taskFor === "OTHERS" && t.forDepartment) {
    return `For: ${t.forDepartment}${t.forPerson ? ` — ${t.forPerson}` : ""}`;
  }
  if (t.taskFor === "CUSTOM" && t.forPerson) return `For: ${t.forPerson}`;
  if (!t.project && t.forPerson) {
    if (t.taskFor === "PROJECT") return `Project: ${t.forPerson}`;
    if (t.taskFor === "MAINTENANCE") return `${t.forDepartment || "Maintenance"} — ${t.forPerson}`;
  }
  return null;
}
