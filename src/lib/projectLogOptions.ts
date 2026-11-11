/**
 * Flaretech project team work-log form (its own form, separate from the Gas Needs log form).
 * Every entry is picked, not typed: project -> (site task) -> what was done -> a few drop-downs.
 * Kinds and choices come from each person's past task titles and their role in the Employee ID Directory.
 */

/** The 70 standard site tasks, grouped into stages so nobody scrolls a 70-row list. Unlisted titles fall under "Other". */
export const SITE_STAGES: { name: string; tasks: string[] }[] = [
  { name: "Piping", tasks: ["Riser/Dropper Installation", "Branch Out to Kitchen", "Roof Piping Works", "Basement Piping", "Pipe in Pipe Installation", "Tapping/Hook up from Main Line", "HDPE Pipe Laying", "Copper Pipe Works", "Pipe Supports – Installation", "Pipe Sleeves – Installation", "Piping – Painting & Identification", "Main Gas Line – Final Hook-Up"] },
  { name: "Kitchen", tasks: ["Kitchen PRDP Installation", "Kitchen Sensor Fixing", "Kitchen Cabling", "Kitchen Final valve Fixing", "Kitchen Hose Connection", "Kitchen Gas Detector – Termination", "Kitchen Gas System – Testing"] },
  { name: "Tank, filling, vaporizer", tasks: ["Tank Installation", "Vaporizer Installation", "Filling Line Liq/Vap Installation", "Filling Box complete Installation", "LPG Tank – Earthing Connection", "LPG Tank – Level Gauge Installation", "LPG Tank – Safety Valve Installation", "Vaporizer – Piping Connection", "Vaporizer – Electrical Connection", "Vaporizer – Testing"] },
  { name: "Regulators, PRMS, manifold", tasks: ["Roof PRDP Fixing", "Manifold Installation", "First Stage PRDP Installation", "PRMS Installation", "PRMS – Piping Connection", "PRMS – Electrical/Signal Connection", "Manifold – Piping Connection"] },
  { name: "Detection and controls", tasks: ["Main GD Cabling", "Gas Control Panel Fixing", "Termination to Gas Detectors", "Termination to Gas Panel", "Connection to Solenoid Valve/Detector", "Fire Alarm Panel – Interface"] },
  { name: "Testing", tasks: ["Tank Pressure Testing", "Hydrotesting of Tank", "Riser/Dropper Pressure Testing", "Basement Piping Pressure Testing", "Roof Piping Pressure Testing", "Testing of Gas Detectors/Panel", "Filling System – Pressure & Leak Testing", "PRMS – Testing & Functional Check", "Manifold – Pressure & Leak Testing", "Gas Detection Interlock – Testing", "Hook-Up – Leak Testing", "Complete System – Pressure Testing", "Complete System – Leak Testing", "Complete System – Purging", "Emergency Shut-Off System – Testing", "Complete System – Interlock Testing", "System – First Gas Filling / Gas Charging", "Final Testing & Commissioning"] },
  { name: "Inspections", tasks: ["Internal QA/QC Inspection", "Consultant Inspection of Work", "Service Provider Inspection", "Civil Defense Inspection", "Snag Rectification & Reinspection"] },
  { name: "Handover", tasks: ["Testing & Commissioning Reports", "As-Built Drawings", "O&M Manuals", "Client/Operator Training", "Final Handover"] },
];
export const OTHER_STAGE = "Other";
const STAGE_OF = new Map(SITE_STAGES.flatMap((s) => s.tasks.map((t) => [t.toLowerCase(), s.name] as const)));
export const stageOf = (title: string) => STAGE_OF.get(title.toLowerCase()) ?? OTHER_STAGE;
const SITE_WORK = ["Piping", "Kitchen", "Tank, filling, vaporizer", "Regulators, PRMS, manifold", "Detection and controls", "Testing", OTHER_STAGE];
const ALL_STAGES = [...SITE_STAGES.map((s) => s.name), OTHER_STAGE];

/** A field on the form. Everything except number/amount/date/ref is a fixed list. */
export type PField = {
  k: string;
  label: string;
  type: "chips" | "select" | "number" | "amount" | "date" | "ref" | "progress" | "supplier" | "who" | "estimate";
  /** For "who": the name can be left empty. */
  nameOptional?: boolean;
  options?: string[];
  optional?: boolean;
  /** Only show this field when another field has one of these values. */
  showIf?: { k: string; in: string[] };
  placeholder?: string;
};
/** "who" fields: the kind of party is picked; the person's name is picked from names used before or typed once. */
export type PKind = {
  v: string;
  l: string;
  /** The person's category task this entry is filed under (created if missing). */
  parent: string;
  /** Stored as the task's logKind. */
  code: string;
  /** Whether the entry is tied to one of the project's site tasks, and which stages are offered. */
  site: "required" | "optional" | "none";
  stages?: string[];
  /**
   * "optional": can be for no project. "potential": a tender Saroj is estimating, picked from potential projects
   * (or added by name), or an existing project for variations.
   */
  project?: "required" | "optional" | "potential";
  fields: PField[];
  /** Which field's value becomes the task title (falls back to the kind's label). */
  titleFrom?: string;
};
export type PProfile = { name: string; role: string; kinds: PKind[] };

const CHANNEL = ["Phone call", "Email", "WhatsApp", "In person", "Video call"];
const REV = ["Rev 0", "Rev 1", "Rev 2", "Rev 3", "Rev 4", "Rev 5+"];
const SUBMIT_TO = ["Consultant", "Client", "Main contractor", "Civil Defense", "Service provider", "Internal review"];
const DOC_STATUS = ["Prepared", "Submitted", "Approved", "Approved with comments", "Rejected — resubmit"];
const TEAMS = ["Team A", "Team B", "Team C", "Team D", "Team E", "Team F (Electrical)", "Subcontractor"];
const WAITING = ["Nothing", "Material", "Client", "Consultant", "Main contractor", "Drawing approval", "Site access", "Manpower"];
const PARTIES = ["Client", "Consultant", "Main contractor", "Developer", "Supplier", "Subcontractor", "Civil Defense", "Service provider", "Our site team", "Office team", "Abraham"];
const COMM_TYPES = ["Call received", "Call made", "Email received", "Email replied", "Email sent", "WhatsApp message", "Follow-up"];
/** Calls, emails and messages: same for everyone, with the topics each role deals with. */
const comm = (parent: string, topics: string[]): PKind => ({
  v: "comm", l: "Call, email or message", parent, code: "PROJECT_COMMUNICATION", site: "optional", stages: ALL_STAGES, project: "optional", titleFrom: "type",
  fields: [
    { k: "type", label: "What", type: "chips", options: COMM_TYPES },
    { k: "who", label: "With", type: "who", options: PARTIES },
    { k: "about", label: "About", type: "select", options: [...topics, "Other"] },
    { k: "response", label: "Result", type: "select", options: ["Done / agreed", "Information shared", "Will reply by a date", "Needs more information", "No answer — try again", "Escalated to Ram"] },
  ],
});
const RESPONSE = ["Done / agreed", "Will reply by a date", "Needs more information", "No answer — try again", "Escalated"];

export const PROJECT_PROFILES: Record<string, PProfile> = {
  // Ram — Projects Manager
  "ram@flaretechnical.com": {
    name: "Ram",
    role: "Projects Manager",
    kinds: [
      {
        v: "meet", l: "Meeting or site visit", parent: "Project Meetings", code: "PROJECT_MEETING", site: "optional", stages: ALL_STAGES, titleFrom: "type",
        fields: [
          { k: "type", label: "Type", type: "chips", options: ["Weekly meeting", "Site meeting", "Client meeting", "Technical meeting", "Site visit", "Variation discussion"] },
          { k: "with", label: "With", type: "who", options: PARTIES },
          { k: "result", label: "Result", type: "select", options: ["Agreed", "Action points given", "Decision pending", "Postponed"] },
        ],
      },
      {
        v: "insp", l: "Inspection or WIR", parent: "Inspections & Handover", code: "PROJECT_INSPECTION", site: "required", stages: ["Inspections", "Testing", "Handover", ...SITE_WORK.filter((s) => s !== "Testing")], titleFrom: "type",
        fields: [
          { k: "type", label: "Inspection", type: "chips", options: ["WIR raised", "Internal QA/QC", "Consultant inspection", "Service provider inspection", "Civil Defense inspection", "Handover inspection", "Site walk"] },
          { k: "by", label: "Inspector", type: "who", options: ["Internal QA/QC", "Consultant", "Service provider", "Civil Defense", "Client"], nameOptional: true },
          { k: "result", label: "Result", type: "select", options: ["Booked", "Passed", "Passed with comments", "Rejected", "Re-inspection booked"] },
          { k: "nextOn", label: "Re-inspection or next date", type: "date", optional: true },
        ],
      },
      {
        v: "docs", l: "Documents submission", parent: "Inspections & Handover", code: "PROJECT_DOCUMENT", site: "optional", stages: ["Handover", "Inspections", "Testing"], titleFrom: "doc",
        fields: [
          { k: "doc", label: "Documents", type: "select", options: ["GOC documents", "Completion documents", "Handover documents", "Test certificates", "As-built set", "O&M manuals"] },
          { k: "to", label: "Submitted to", type: "who", options: SUBMIT_TO, nameOptional: true },
          { k: "status", label: "Status", type: "select", options: DOC_STATUS },
        ],
      },
      {
        v: "pay", l: "Payment or invoice", parent: "Payments & Invoicing", code: "PROJECT_PAYMENT", site: "none", titleFrom: "action",
        fields: [
          { k: "action", label: "What was done", type: "chips", options: ["Payment follow-up", "Proforma invoice", "Invoice discussion", "Payment certificate", "Payment received"] },
          { k: "milestone", label: "For", type: "select", options: ["Advance", "Progress payment", "Variation", "Retention", "Final payment"] },
          { k: "with", label: "With", type: "who", options: ["Client", "Main contractor", "Consultant", "Developer"] },
          { k: "amount", label: "Amount (AED)", type: "amount", optional: true },
          { k: "promisedOn", label: "Promised by", type: "date", optional: true },
        ],
      },
      comm("Calls & Emails", ["Inspection", "Payment", "Variation", "Drawing approval", "Material", "Site issue", "Handover"]),
    ],
  },
  // Jiyad — Site Engineer. The only form that moves a site task's progress.
  "jiyad.m@flaretechnical.com": {
    name: "Jiyad",
    role: "Site Engineer",
    kinds: [
      {
        v: "site", l: "Site work update", parent: "Site Visits & Meetings", code: "SITE_UPDATE", site: "required", stages: SITE_WORK, titleFrom: "work",
        fields: [
          { k: "work", label: "Work today", type: "chips", options: ["Started", "Continued", "Completed"] },
          { k: "progress", label: "Progress after today", type: "progress" },
          { k: "team", label: "Team on site", type: "select", options: TEAMS },
          { k: "workers", label: "Workers on site", type: "select", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"] },
          { k: "waiting", label: "Waiting on", type: "select", options: WAITING },
        ],
      },
      {
        v: "insp", l: "Inspection", parent: "Inspections & Documentation", code: "SITE_INSPECTION", site: "required", stages: ["Inspections", "Testing", ...SITE_WORK.filter((s) => s !== "Testing"), "Handover"], titleFrom: "action",
        fields: [
          { k: "action", label: "What was done", type: "chips", options: ["Documentation for raising inspection", "Inspection raised", "Inspection done", "Completion certificate collected"] },
          { k: "by", label: "Inspected by", type: "who", options: ["Internal QA/QC", "Consultant", "Service provider", "Civil Defense", "Client"], nameOptional: true },
          { k: "result", label: "Result", type: "select", options: ["Not inspected yet", "Passed", "Passed with comments", "Rejected"], showIf: { k: "action", in: ["Inspection done"] } },
        ],
      },
      {
        v: "meet", l: "Site or consultant meeting", parent: "Site Visits & Meetings", code: "SITE_MEETING", site: "optional", stages: ALL_STAGES, titleFrom: "type",
        fields: [
          { k: "type", label: "Type", type: "chips", options: ["Site meeting", "Consultant meeting", "Technical meeting", "Site visit"] },
          { k: "with", label: "With", type: "who", options: PARTIES },
          { k: "result", label: "Result", type: "select", options: ["Agreed", "Action points given", "Decision pending", "Postponed"] },
        ],
      },
      {
        v: "hse", l: "HSE and safety", parent: "HSE & Compliance", code: "SITE_HSE", site: "none", titleFrom: "type",
        fields: [{ k: "type", label: "What was done", type: "chips", options: ["HSE induction documents", "Safety documents", "Permit to work", "Toolbox talk", "Safety observation closed"] }],
      },
      {
        v: "track", l: "Tracker or report", parent: "Tracker & Reporting", code: "SITE_REPORT", site: "none", titleFrom: "type",
        fields: [{ k: "type", label: "What was done", type: "chips", options: ["Tracker update", "Daily site report", "Weekly progress report", "Highlighting drawings"] }],
      },
      comm("Calls & Emails", ["Inspection", "Material at site", "Manpower", "Site issue", "Drawing", "Access or permit", "Safety"]),
    ],
  },
  // Mohammed Jashim — Design Engineer (also takes over Mamidi's drawings and submittals).
  "jashim@flaretechnical.com": {
    name: "Jashim",
    role: "Design Engineer",
    kinds: [
      {
        v: "design", l: "Design or drawing", parent: "Design & 3D Modelling", code: "DESIGN", site: "optional", stages: ALL_STAGES, titleFrom: "drawing",
        fields: [
          { k: "drawing", label: "Drawing", type: "select", options: ["LPG shop drawing", "Kitchen drawing", "Electrical drawing", "Coordination drawing", "DCD drawing", "Riser / isometric", "Tank and roof layout", "3D model", "As-built drawing", "Presentation"] },
          { k: "rev", label: "Revision", type: "select", options: REV },
          { k: "status", label: "Status", type: "select", options: ["In progress", "Sent for internal review", ...DOC_STATUS.slice(1)] },
          { k: "dueOn", label: "Due date", type: "date", optional: true },
        ],
      },
      {
        v: "rev", l: "Drawing revision", parent: "Drawing Revisions", code: "DESIGN_REVISION", site: "optional", stages: ALL_STAGES, titleFrom: "drawing",
        fields: [
          { k: "drawing", label: "Drawing", type: "select", options: ["LPG shop drawing", "Kitchen drawing", "Electrical drawing", "Coordination drawing", "DCD drawing", "Riser / isometric", "Tank and roof layout", "3D model", "As-built drawing"] },
          { k: "rev", label: "New revision", type: "select", options: REV.slice(1) },
          { k: "reason", label: "Why", type: "select", options: ["Consultant comments", "Client change", "Site condition", "Clash with other services", "Internal correction"] },
          { k: "status", label: "Status", type: "select", options: ["In progress", "Sent for internal review", ...DOC_STATUS.slice(1)] },
        ],
      },
      {
        v: "sub", l: "Submittal", parent: "Site, Submittals & Meetings", code: "SUBMITTAL", site: "optional", stages: ALL_STAGES, titleFrom: "doc",
        fields: [
          { k: "doc", label: "Document", type: "select", options: ["Material submittal", "Method statement", "Risk assessment", "Shop drawing set", "Price escalation submittal", "Test reports", "O&M manual", "As-built set"] },
          { k: "rev", label: "Revision", type: "select", options: REV },
          { k: "to", label: "Submitted to", type: "who", options: SUBMIT_TO, nameOptional: true },
          { k: "status", label: "Status", type: "select", options: DOC_STATUS },
        ],
      },
      {
        v: "qto", l: "Quantity take-off", parent: "Quantities & Quotations", code: "QUANTITY_TAKEOFF", site: "optional", stages: ALL_STAGES, titleFrom: "for",
        fields: [
          { k: "for", label: "For", type: "chips", options: ["Quantity take-off", "Quotation for works", "Rectification works", "Variation", "Material order"] },
          { k: "status", label: "Status", type: "select", options: ["In progress", "Sent to Saroj for pricing", "Sent to Ram", "Done"] },
        ],
      },
      {
        v: "coord", l: "Site coordination or meeting", parent: "Site, Submittals & Meetings", code: "DESIGN_MEETING", site: "optional", stages: ALL_STAGES, titleFrom: "type",
        fields: [
          { k: "type", label: "Type", type: "chips", options: ["Site coordination", "Client workshop meeting", "Consultant meeting", "Presentation"] },
          { k: "with", label: "With", type: "who", options: PARTIES },
        ],
      },
      comm("Site, Submittals & Meetings", ["Drawing comments", "Submittal status", "Design change", "Quantities", "Site coordination", "Meeting"]),
    ],
  },
  // Saroj — Estimation Engineer
  "saroj@flaretechnical.com": {
    name: "Saroj",
    role: "Estimation Engineer",
    kinds: [
      {
        v: "est", l: "Estimate or BOQ", parent: "Estimation & Pricing", code: "ESTIMATE", site: "optional", stages: ALL_STAGES, project: "potential", titleFrom: "type",
        fields: [
          { k: "type", label: "What was done", type: "chips", options: ["Estimate / BOQ prepared", "Estimate revised", "Price update", "Price escalation", "Cost comparison"] },
          { k: "estimate", label: "Estimation no.", type: "estimate" },
          { k: "rev", label: "Revision", type: "select", options: REV },
          { k: "for", label: "For", type: "select", options: ["New tender", "Variation", "Rectification works", "Additional works", "Price revision"] },
          { k: "client", label: "Client", type: "who", options: ["Client", "Main contractor", "Consultant", "Developer"], nameOptional: true },
          { k: "status", label: "Status", type: "select", options: ["In progress", "Sent to Ram for review", "Approved internally", "Sent to client"] },
        ],
      },
      {
        v: "quote", l: "Quotation", parent: "Quotations", code: "PROJECT_QUOTATION", site: "optional", stages: ALL_STAGES, project: "potential", titleFrom: "type",
        fields: [
          { k: "type", label: "What was done", type: "chips", options: ["Quotation prepared", "Quotation revised", "Quotation sent", "Quotation follow-up"] },
          { k: "estimate", label: "Estimation no.", type: "estimate" },
          { k: "rev", label: "Revision", type: "select", options: REV },
          { k: "status", label: "Where it stands", type: "select", options: ["With the client", "Negotiating", "Awarded", "Not awarded", "On hold"] },
          { k: "to", label: "Sent to", type: "who", options: ["Client", "Main contractor", "Consultant", "Developer"], nameOptional: true },
        ],
      },
      {
        v: "docs", l: "Drawing or document", parent: "Drawings & Documentation", code: "ESTIMATION_DOCUMENT", site: "optional", stages: ALL_STAGES, project: "potential", titleFrom: "type",
        fields: [
          { k: "type", label: "What was done", type: "chips", options: ["Drawing prepared", "Drawing revision", "Document prepared", "Submittal / approval follow-up"] },
          { k: "status", label: "Status", type: "select", options: DOC_STATUS },
        ],
      },
      {
        v: "visit", l: "Site visit", parent: "Site Visits", code: "ESTIMATION_SITE_VISIT", site: "optional", stages: ALL_STAGES, project: "potential", titleFrom: "type",
        fields: [{ k: "type", label: "What was done", type: "chips", options: ["Site visit", "Measurements taken", "Site report"] }],
      },
      comm("Follow-ups & Emails", ["Quotation", "Estimate", "Drawing approval", "Supplier price", "Site measurement", "Payment"]),
      {
        v: "sys", l: "App or systems update", parent: "Systems & Updates", code: "SYSTEMS_UPDATE", site: "none", project: "optional", titleFrom: "type",
        fields: [{ k: "type", label: "What was done", type: "chips", options: ["Projects update in the app", "Updated tasks on OWNIT", "IT / systems"] }],
      },
    ],
  },
  // Simi — Project Coordinator
  "simi@flaretechnical.com": {
    name: "Simi",
    role: "Project Coordinator",
    kinds: [
      {
        v: "cost", l: "Material or site cost", parent: "Material & Site Costs", code: "PROJECT_COST", site: "optional", stages: ALL_STAGES, titleFrom: "type",
        fields: [
          { k: "type", label: "Entry", type: "chips", options: ["Material cost entry", "Material purchase", "Site expense", "Subcontractor bill"] },
          { k: "supplier", label: "Supplier", type: "supplier", optional: true },
          { k: "amount", label: "Amount (AED)", type: "amount" },
          { k: "ref", label: "Bill or LPO no.", type: "ref", optional: true, placeholder: "Only if you have it" },
        ],
      },
      {
        v: "labour", l: "Labour count at site", parent: "Material & Site Costs", code: "LABOUR_COUNT", site: "none",
        fields: [
          { k: "team", label: "Team", type: "select", options: TEAMS },
          { k: "workers", label: "Workers", type: "number" },
        ],
      },
      {
        v: "inv", l: "Invoice or Zoho entry", parent: "Accounts Entries & Invoices", code: "PROJECT_INVOICE", site: "none", titleFrom: "type",
        fields: [
          { k: "type", label: "What was done", type: "chips", options: ["Zoho entry", "Invoice", "Project invoice summary", "Security cheque"] },
          { k: "amount", label: "Amount (AED)", type: "amount", optional: true },
          { k: "ref", label: "Invoice or reference no.", type: "ref", optional: true, placeholder: "Only if you have it" },
        ],
      },
      {
        v: "rep", l: "Document or report", parent: "Documentation & Reports", code: "PROJECT_REPORT", site: "optional", stages: ALL_STAGES, titleFrom: "type",
        fields: [
          { k: "type", label: "What was done", type: "chips", options: ["Progress report", "Cost report", "Documentation", "Document sent", "Miscellaneous"] },
          { k: "to", label: "Sent to", type: "who", options: ["Not sent", "Ram", "Abraham", "Client", "Consultant", "Accounts"], nameOptional: true },
        ],
      },
      {
        v: "ts", l: "Timesheet", parent: "Timesheets", code: "TIMESHEET", site: "none", project: "optional",
        fields: [
          { k: "period", label: "Period", type: "select", options: ["Daily", "Weekly", "Monthly"] },
          { k: "status", label: "Status", type: "select", options: ["Prepared", "Sent to accounts", "Corrected"] },
        ],
      },
      comm("Calls & Emails", ["Material", "Cost or bill", "Invoice", "Labour or timesheet", "Documents", "Payment", "Report"]),
    ],
  },
};
/** Saroj's estimation numbers: FT-EST-2026-NOV-0001, the sequence restarting each month (Dubai time). */
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
export const estimatePrefix = (d: Date) => {
  const dubai = new Date(d.getTime() + 4 * 3600 * 1000);
  return `FT-EST-${dubai.getUTCFullYear()}-${MONTHS[dubai.getUTCMonth()]}-`;
};
export const NEW_ESTIMATE = "__new__";

export const PROJECT_LOG_EMAILS = Object.keys(PROJECT_PROFILES);
