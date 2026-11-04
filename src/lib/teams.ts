/**
 * Who sees and manages the Projects and Maintenance areas. Everyone can still pick a project or a
 * maintenance site in a task's "Task for" dropdown — these rules only decide the tabs and who may add.
 * Directors (the admins, Jai and Abraham) see and do everything.
 */
type Person = { isDirector: boolean; department: string | null; user: { email: string } };

// Hashim sits in Accounts but does maintenance work too, so he also gets the Maintenance tab.
const ALSO_MAINTENANCE = ["accounts@flaretechnical.com"];

const dept = (m: Person) => (m.department ?? "").trim().toLowerCase();

export function canSeeProjects(m: Person) {
  return m.isDirector || dept(m) === "projects";
}

export function canSeeMaintenance(m: Person) {
  return m.isDirector || dept(m) === "maintenance" || ALSO_MAINTENANCE.includes(m.user.email.toLowerCase());
}

/** Adding projects (and project changes) belongs to the Projects team and the directors. */
export const canAddProjects = canSeeProjects;

/** Same rule for maintenance sites: the Maintenance team and the directors. */
export const canAddMaintenance = (m: Person) => m.isDirector || dept(m) === "maintenance";
