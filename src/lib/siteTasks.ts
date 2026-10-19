/**
 * The standard required on-site work items every Flaretech project starts
 * with. Items that don't apply to a project are deleted from that project's
 * checklist (and can be added back from this list). Keep in sync with the
 * seed INSERTs in prisma/migrations/20261009120000_add_project_site_tasks
 * and 20261019120000_add_more_site_tasks.
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
  // Added 2026-10-19 from "Activity of Works.xlsx" (activities not already
  // covered above) — keep in sync with migration 20261019120000.
  "Pipe Supports – Installation",
  "Pipe Sleeves – Installation",
  "Piping – Painting & Identification",
  "Kitchen Gas Detector – Termination",
  "Kitchen Gas System – Testing",
  "LPG Tank – Earthing Connection",
  "LPG Tank – Level Gauge Installation",
  "LPG Tank – Safety Valve Installation",
  "Filling System – Pressure & Leak Testing",
  "Vaporizer – Piping Connection",
  "Vaporizer – Electrical Connection",
  "Vaporizer – Testing",
  "PRMS – Piping Connection",
  "PRMS – Electrical/Signal Connection",
  "PRMS – Testing & Functional Check",
  "Manifold – Piping Connection",
  "Manifold – Pressure & Leak Testing",
  "Fire Alarm Panel – Interface",
  "Gas Detection Interlock – Testing",
  "Main Gas Line – Final Hook-Up",
  "Hook-Up – Leak Testing",
  "Complete System – Pressure Testing",
  "Complete System – Leak Testing",
  "Complete System – Purging",
  "Emergency Shut-Off System – Testing",
  "Complete System – Interlock Testing",
  "System – First Gas Filling / Gas Charging",
  "Internal QA/QC Inspection",
  "Service Provider Inspection",
  "Civil Defense Inspection",
  "Snag Rectification & Reinspection",
  "Testing & Commissioning Reports",
  "As-Built Drawings",
  "O&M Manuals",
  "Client/Operator Training",
  "Final Handover",
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

/** Who can set each task's weight. */
const SITE_TASK_WEIGHT_EMAILS = [
  "ram@flaretechnical.com", // Projects Manager
  "abraham@flaretechnical.com",
  "saroj@flaretechnical.com",
];

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
