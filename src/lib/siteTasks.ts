/**
 * The standard required on-site work items every Flaretech project starts
 * with. Items that don't apply to a project are deleted from that project's
 * checklist (and can be added back from this list). Keep in sync with the
 * seed INSERT in prisma/migrations/20261009120000_add_project_site_tasks.
 */
export const STANDARD_SITE_TASKS = [
  "Riser/Dropper Installation",
  "Branch Out to Kitchen",
  "Kitchen PRDP Installation",
  "Kitchen Sensor Fixing",
  "Kitchen Cabling",
  "Main GD Cabling",
  "Roof Piping Works",
  "Roof PRDP Fixing",
  "Tank Installation",
  "Vaporizer Installation",
  "Basement Piping",
  "Pipe in Pipe Installation",
  "Kitchen Final valve Fixing",
  "Kitchen Hose Connection",
  "Filling Line Liq/Vap Installation",
  "Filling Box complete Installation",
  "Gas Control Panel Fixing",
  "Tank Pressure Testing",
  "Hydrotesting of Tank",
  "Riser/Dropper Pressure Testing",
  "Basement Piping Pressure Testing",
  "Roof Piping Pressure Testing",
  "Termination to Gas Detectors",
  "Termination to Gas Panel",
  "Testing of Gas Detectors/Panel",
  "Consultant Inspection of Work",
  "Manifold Installation",
  "First Stage PRDP Installation",
  "PRMS Installation",
  "Connection to Solenoid Valve/Detector",
  "Tapping/Hook up from Main Line",
  "HDPE Pipe Laying",
  "Copper Pipe Works",
  "Final Testing & Commissioning",
] as const;

/** Only Flaretech projects carry the site-task checklist. */
export const SITE_TASK_COMPANY_SLUG = "flaretechnical";

/** Who can update progress — the editors below plus the site engineer. */
const SITE_TASK_PROGRESS_EMAILS = [
  "ram@flaretechnical.com",
  "abraham@flaretechnical.com",
  "saroj@flaretechnical.com",
  "jiyad.m@flaretechnical.com", // Site Engineer
];

/** Who can delete (X) and re-add site tasks. */
const SITE_TASK_EDITOR_EMAILS = [
  "ram@flaretechnical.com", // Projects Manager
  "abraham@flaretechnical.com", // Managing Director
  "saroj@flaretechnical.com",
];

/** Who can set each task's weight — not Ram. */
const SITE_TASK_WEIGHT_EMAILS = ["abraham@flaretechnical.com", "saroj@flaretechnical.com"];

export function canEditSiteTasks(user: { email: string }) {
  return SITE_TASK_EDITOR_EMAILS.includes(user.email.toLowerCase());
}

export function canUpdateSiteTaskProgress(user: { email: string }) {
  return SITE_TASK_PROGRESS_EMAILS.includes(user.email.toLowerCase());
}

export function canSetSiteTaskWeights(user: { email: string }) {
  return SITE_TASK_WEIGHT_EMAILS.includes(user.email.toLowerCase());
}

/** Sum of assigned weights, and how much of that weight has been fulfilled (weight x progress). */
export function siteTaskSummary(tasks: { weight: number | null; progress: number }[]) {
  const totalWeight = tasks.reduce((s, t) => s + (t.weight ?? 0), 0);
  const fulfilled = tasks.reduce((s, t) => s + ((t.weight ?? 0) * t.progress) / 100, 0);
  return {
    totalWeight,
    fulfilled: Math.round(fulfilled * 10) / 10,
    completed: tasks.filter((t) => t.progress === 100).length,
  };
}
