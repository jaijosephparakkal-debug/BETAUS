/** Wording and lists for the structured work log form (Antony). Everything here is picked, not typed. */
export type NextStep = { v: string; l: string };
type Profile = {
  kinds: { v: string; l: string }[];
  /** Company slugs the person can log work for. */
  companies: string[];
  /** Category task each kind is filed under. */
  parent: Record<string, string>;
  next: NextStep[];
  /** Department recorded for a kind, when it differs from the default (e.g. Jintu's follow-ups are Accounts). */
  dept?: Record<string, string>;
};
const NS_NONE = { v: "none", l: "None" };
const NS_SELF = { v: "followup", l: "Follow up myself" };

/** Who gets the structured work-log form, and what it offers them. */
export const PROFILES: Record<string, Profile> = {
  "sales@gasneeds.com": {
    kinds: [{ v: "q", l: "Quotation" }, { v: "f", l: "Follow-up" }, { v: "v", l: "Customer visit" }, { v: "pro", l: "PRO" }, { v: "hr", l: "HR" }],
    companies: ["gasneeds", "flaretechnical"],
    parent: { q: "Sales — Quotations", f: "Sales — Follow-ups", v: "Sales — Customer Visits", pro: "PRO — Government & Admin", hr: "HR — Staff & Insurance" },
    next: [NS_NONE, NS_SELF, { v: "manu", l: "Hand over to Manu — purchase follow-up" }, { v: "jintu", l: "Hand over to Jintu — payment follow-up" }],
  },
  "business@gasneeds.com": {
    kinds: [{ v: "q", l: "Quotation" }, { v: "enq", l: "Enquiry" }, { v: "po", l: "Purchase order" }, { v: "imp", l: "Import or delivery" }, { v: "f", l: "Follow-up" }],
    companies: ["gasneeds"],
    parent: { q: "Quotations", enq: "Enquiries", po: "Purchase Orders", imp: "Imports & Deliveries", f: "Follow-ups & Calls" },
    next: [NS_NONE, NS_SELF, { v: "jintu", l: "Hand over to Jintu — payment follow-up" }],
  },
  "alerts@flaretechnical.com": {
    kinds: [{ v: "rd", l: "Meter reading" }, { v: "gi", l: "Gas invoice" }, { v: "co", l: "Collection" }, { v: "rf", l: "Disconnection and refund" }, { v: "os", l: "Outstanding report" }],
    companies: ["flaretechnical"],
    parent: { rd: "Meter Reading", gi: "Gas Billing & Invoicing", co: "Collections & Payments", rf: "Disconnections & Refunds", os: "Collections & Payments" },
    next: [NS_NONE, NS_SELF, { v: "hashim", l: "Hand over to Hashim — collection follow-up" }],
  },
  "service@flaretechnical.com": {
    kinds: [{ v: "sr", l: "Connection or disconnection" }, { v: "jenq", l: "Enquiry" }, { v: "fsm", l: "FSM schedule" }, { v: "inv", l: "Invoice or payment link" }, { v: "cl", l: "Call or email" }],
    companies: ["flaretechnical"],
    parent: { sr: "Connections & Disconnections", jenq: "Enquiries & Quotations", fsm: "Scheduling (FSM)", inv: "Billing & Payments", cl: "Enquiries & Quotations" },
    next: [NS_NONE, NS_SELF, { v: "flexie", l: "Hand over to Flexie — first bill" }],
  },
  "accounts@flaretechnical.com": {
    kinds: [{ v: "amc", l: "AMC contract" }, { v: "ppm", l: "PPM report" }, { v: "dcd", l: "DCD attestation" }, { v: "rp", l: "Gas reading report" }, { v: "co", l: "Collection" }, { v: "ac", l: "Accounts entry" }],
    companies: ["flaretechnical"],
    parent: { amc: "Maintenance — AMC, Contracts & Portals", ppm: "Maintenance — Gas Reading & Reports", dcd: "Maintenance — AMC, Contracts & Portals", rp: "Maintenance — Gas Reading & Reports", co: "Accounts — Collections & Follow-ups", ac: "Accounts — Vouchers & Reconciliation" },
    next: [NS_NONE, NS_SELF],
  },
  "accounts@gasneeds.com": {
    kinds: [{ v: "pr", l: "Payment received" }, { v: "pm", l: "Payment made" }, { v: "pf", l: "Payment follow-up" }, { v: "f", l: "Follow-up" }, { v: "cc", l: "Cheque or cash" }, { v: "ac", l: "Accounts entry" }],
    companies: ["gasneeds", "flaretechnical"],
    parent: { pr: "Payments & Receipts", pm: "Payments & Receipts", pf: "Receivables Follow-up", f: "Calls & Emails", cc: "Cheques, Cash & Banking", ac: "Bills & Books" },
    dept: { f: "Accounts" },
    next: [NS_NONE, NS_SELF],
  },
};
export const LOG_FORM_EMAILS = Object.keys(PROFILES);
export const SALES_TEAM_EMAILS = ["sales@gasneeds.com", "business@gasneeds.com", "accounts@gasneeds.com"];

export const QUOTE_STATUS: { v: string; l: string }[] = [
  { v: "SENT", l: "Quotation sent" },
  { v: "REVISED", l: "Revised quotation sent" },
  { v: "REVIEWING", l: "Customer is reviewing" },
  { v: "NEGOTIATING", l: "Negotiating price" },
  { v: "ORDER_RECEIVED", l: "Order received" },
  { v: "DELIVERED", l: "Delivered" },
  { v: "PAID", l: "Paid" },
  { v: "NOT_AWARDED", l: "Not awarded to us" },
  { v: "ON_HOLD", l: "On hold by customer" },
];
export const statusLabel = (v: string) => QUOTE_STATUS.find((s) => s.v === v)?.l ?? v;
export const FORM_STATUS = QUOTE_STATUS.filter((s) => !["DELIVERED", "PAID"].includes(s.v));

export const CHANNELS = [
  "Phone call — I called them",
  "Phone call — they called me",
  "Email — I sent",
  "Email — they sent",
  "WhatsApp message",
  "Visit — in person",
  "Video call",
  "Letter or courier",
];
/** What a follow-up can be about when it isn't a quotation. */
export const FOLLOW_TOPICS = ["Order or delivery", "Payment", "Complaint", "Documents", "Meeting or visit", "New enquiry", "Other"];
export const FOLLOW_WITH = [
  { v: "customer", l: "Customer" },
  { v: "supplier", l: "Supplier" },
  { v: "someone", l: "Someone else" },
];

export const RESPONSES = [
  "Interested",
  "Needs more time",
  "Asked for a discount",
  "Price is too high",
  "Chose another supplier",
  "Could not reach them",
  "Will confirm by a date",
];
export const PURPOSES = ["Introduce the company", "Negotiate price", "Collect payment", "Handle a complaint", "Check a delivery"];
export const OUTCOMES = [
  "Completed",
  "Agreed with them",
  "They will come back to us",
  "We will come back to them",
  "Order confirmed",
  "Declined",
  "Postponed",
  "No answer — will try again",
];
export const NEXT_STEPS = [
  { v: "none", l: "None" },
  { v: "followup", l: "Follow up myself" },
  { v: "manu", l: "Hand over to Manu — purchase follow-up" },
  { v: "jintu", l: "Hand over to Jintu — payment follow-up" },
];
export const DISCUSS: { key: string; label: string; heading: string; options: string[]; placeholder: string }[] = [
  { key: "price", label: "Price", heading: "Price — what exactly", options: ["Customer asked for a discount", "We revised the price", "Price too high for them", "Matched a competitor", "Special rate offered"], placeholder: "e.g. AED 120 per piece, 5% off" },
  { key: "delivery", label: "Delivery time", heading: "Delivery — what exactly", options: ["Ready from stock", "1 to 3 days", "About a week", "2 to 4 weeks", "Import lead time", "On the customer’s date"], placeholder: "e.g. site address, date asked" },
  { key: "payment", label: "Payment terms", heading: "Payment — what exactly", options: ["Advance payment", "Cash on delivery", "Credit 30 days", "Credit 45 days", "Credit 60 days", "Cheque", "Bank transfer", "Part payment"], placeholder: "e.g. 50% advance, balance on delivery" },
  { key: "documents", label: "Documents", heading: "Document — which", options: ["Quotation copy", "Datasheet", "Certificate", "Test report", "Trade licence", "Other"], placeholder: "Only if needed" },
  { key: "complaint", label: "Complaint", heading: "Complaint — about", options: ["Damaged item", "Wrong item", "Late delivery", "Quality problem", "Billing error"], placeholder: "What happened" },
  { key: "other", label: "Something else", heading: "What else", options: [], placeholder: "Describe it" },
];
export const HR_TOPICS = ["Leave", "Visa and ID", "Insurance", "Contract", "Payroll query", "Exit and settlement"];
export const HR_ACTIONS = ["Request received", "Approved", "Rejected", "Document issued"];
export const PRO_SERVICES = ["Visa — renewal", "Visa — new", "Emirates ID", "Medical test", "Labour card", "Trade licence", "RTA"];
export const PRO_STAGES = ["Documents sent", "Submitted", "In process", "Approved", "Collected", "Rejected"];
export const BACKDATE_REASONS = ["Forgot to log it", "Was away from the office", "No network at the time", "Other"];
export const BACKDATE_DAYS = 7;

export const ENQ_STATUS = ["Enquiry received", "Clarified with the customer", "Converted to a quotation", "Closed — no order"];
export const PO_STATUS = ["Sent to supplier", "Confirmed by supplier", "Amended", "Cancelled"];
export const IMPORT_STAGES = ["Shipment booked", "In transit", "Customs clearance", "Arrived", "Delivery arranged", "Delivered"];
export const PAY_METHODS = ["Bank transfer", "Cheque", "Cash", "Card", "Payment link"];
export const PAY_RESPONSES = ["Will pay by a date", "Already paid", "Disputed", "Needs documents first", "Asked for more time", "Could not reach them"];
export const CC_TYPES = ["Cheque deposit", "Cheque collection", "Cash deposit", "Petty cash"];
export const AC_TYPES = ["Payment entries", "Bills posting", "Bank reconciliation", "Payroll", "Reports", "Other"];

export const UNIT_TYPES = [
  { v: "Apartment", label: "Flat no." },
  { v: "Kitchen", label: "Kitchen no. or name" },
  { v: "Shop", label: "Shop no." },
  { v: "Villa", label: "Villa no." },
  { v: "Office", label: "Office no." },
  { v: "Whole building", label: "" },
];

/** Work kinds described by their fields (maintenance team). `building` says whether a building (and unit) is asked for. */
export type GField = { n: string; l: string; t: "pick" | "type" | "date" | "month"; o?: string[]; ph?: string; req?: boolean };
export type GKind = { code: string; dept: string; building?: "req" | "opt"; fields: GField[]; title: (v: Record<string, string>) => string };
const sm = (n = "readMonth", l = "For the month"): GField => ({ n, l, t: "month", req: true });
export const GENERIC: Record<string, GKind> = {
  rd: { code: "METER_READING", dept: "Maintenance", building: "req", title: () => "Meter reading", fields: [sm(), { n: "prevReading", l: "Previous reading (m³)", t: "type", ph: "e.g. 412.5" }, { n: "currReading", l: "Current reading (m³)", t: "type", ph: "e.g. 431.0" }] },
  gi: { code: "GAS_INVOICE", dept: "Maintenance", building: "req", title: () => "Gas invoice", fields: [sm(), { n: "amount", l: "Invoice amount (AED)", t: "type", req: true, ph: "e.g. 780" }, { n: "reference", l: "Invoice no.", t: "type", ph: "Only if you have it" }] },
  co: { code: "COLLECTION", dept: "Accounts", building: "opt", title: (v) => (v.collectType === "Full payment" ? "Collection — in full" : "Collection — part"), fields: [{ n: "amount", l: "Amount collected (AED)", t: "type", req: true }, { n: "method", l: "Paid by", t: "pick", o: PAY_METHODS }, { n: "reference", l: "Reference or payment link", t: "type", ph: "Only if you have it" }, { n: "collectType", l: "This payment is", t: "pick", o: ["Part payment", "Full payment"] }] },
  rf: { code: "REFUND", dept: "Maintenance", building: "req", title: (v) => v.refundStage || "Disconnection and refund", fields: [{ n: "refundStage", l: "Where it stands", t: "pick", o: ["Disconnection requested", "Disconnection done", "Final bill issued", "Refund approved", "Refund paid", "Refund on hold"] }, { n: "amount", l: "Refund amount (AED)", t: "type", ph: "Only when known" }, { n: "reference", l: "Reference", t: "type", ph: "Only if you have it" }] },
  os: { code: "OUTSTANDING_REPORT", dept: "Maintenance", building: "opt", title: () => "Outstanding report", fields: [sm(), { n: "amount", l: "Total outstanding (AED)", t: "type", ph: "Only when known" }] },
  sr: { code: "SERVICE_REQUEST", dept: "Maintenance", building: "req", title: (v) => `${v.srType || "Service request"} — ${(v.srStage || "").toLowerCase()}`, fields: [{ n: "srNo", l: "Service request no.", t: "type", ph: "Leave empty for a new request; type an old number to update it" }, { n: "srType", l: "Request", t: "pick", o: ["New connection", "Disconnection", "Complaint", "Meter or leak check", "Other"] }, { n: "srStage", l: "Where it stands", t: "pick", o: ["Request received", "Scheduled on FSM", "Technician assigned", "Done", "Cancelled"] }] },
  fsm: { code: "FSM_SCHEDULE", dept: "Maintenance", building: "opt", title: (v) => v.fsmStage || "FSM schedule", fields: [{ n: "jobRef", l: "FSM job reference", t: "type", ph: "Only if you have it" }, { n: "visitDate", l: "Visit date", t: "date" }, { n: "fsmStage", l: "Where it stands", t: "pick", o: ["Scheduled", "Technician assigned", "Visited", "Closed"] }] },
  inv: { code: "INVOICE_LINK", dept: "Maintenance", building: "opt", title: (v) => v.invType || "Invoice", fields: [{ n: "invType", l: "What was done", t: "pick", o: ["Invoice generated", "Payment link created", "Payment link sent"] }, { n: "amount", l: "Amount (AED)", t: "type", req: true }, { n: "reference", l: "Invoice or link reference", t: "type", ph: "Only if you have it" }] },
  jenq: { code: "ENQUIRY", dept: "Maintenance", building: "opt", title: (v) => v.enqType || "Enquiry", fields: [{ n: "enqType", l: "About", t: "pick", o: ["New connection enquiry", "Billing enquiry", "Disconnection enquiry", "Other"] }, { n: "channel", l: "How it came in", t: "pick", o: CHANNELS }, { n: "enqStatus", l: "Where it stands", t: "pick", o: ["Received", "Answered", "Quotation sent", "Closed"] }] },
  cl: { code: "CALL_EMAIL", dept: "Maintenance", building: "opt", title: (v) => v.channel || "Call or email", fields: [{ n: "channel", l: "How you were in touch", t: "pick", o: CHANNELS }, { n: "subject", l: "About", t: "pick", o: ["New connection", "Billing", "Disconnection", "Complaint", "Other"] }] },
  amc: { code: "AMC_RENEWAL", dept: "Maintenance", title: (v) => v.amcStage || "AMC contract", fields: [{ n: "site", l: "Site or client", t: "type", req: true }, { n: "contractNo", l: "Contract no.", t: "type" }, { n: "renewalOn", l: "Renewal or expiry date", t: "date", req: true }, { n: "value", l: "Contract value (AED)", t: "type" }, { n: "amcStage", l: "Where it stands", t: "pick", o: ["Renewal quoted", "Renewal agreed", "Contract signed", "Lapsed"] }] },
  ppm: { code: "PPM_REPORT", dept: "Maintenance", title: (v) => v.ppmStage || "PPM report", fields: [{ n: "site", l: "Site or client", t: "type", req: true }, sm("ppmMonth", "PPM month"), { n: "ppmStage", l: "Where it stands", t: "pick", o: ["Visit done", "Report prepared", "Report submitted"] }] },
  dcd: { code: "DCD_ATTESTATION", dept: "Maintenance", title: (v) => v.dcdStage || "DCD attestation", fields: [{ n: "site", l: "Site or client", t: "type", req: true }, { n: "dcdStage", l: "Where it stands", t: "pick", o: ["Documents prepared", "Submitted", "Inspection booked", "Attested", "Rejected"] }, { n: "reference", l: "Reference", t: "type", ph: "Only if you have it" }] },
  rp: { code: "REPORT", dept: "Maintenance", building: "opt", title: (v) => v.reportType || "Report", fields: [{ n: "reportType", l: "Report", t: "pick", o: ["Gas reading summary", "Outstanding report", "Detail report"] }, sm("reportMonth", "For the month")] },
};
