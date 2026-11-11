/** Wording and lists for the structured work log form (Antony). Everything here is picked, not typed. */
export type NextStep = { v: string; l: string };
type Profile = {
  kinds: { v: string; l: string }[];
  /** Company slugs the person can log work for. */
  companies: string[];
  /** Category task each kind is filed under. */
  parent: Record<string, string>;
  next: NextStep[];
  /** Optional tabs that split the kinds of work (e.g. Maintenance and Accounts for Hashim). */
  tabs?: { l: string; kinds: string[] }[];
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
    tabs: [{ l: "Maintenance", kinds: ["amc", "ppm", "dcd", "rp"] }, { l: "Accounts", kinds: ["co", "ac"] }],
    parent: { amc: "Maintenance — AMC, Contracts & Portals", ppm: "Maintenance — Gas Reading & Reports", dcd: "Maintenance — AMC, Contracts & Portals", rp: "Maintenance — Gas Reading & Reports", co: "Accounts — Collections & Follow-ups", ac: "Accounts — Vouchers & Reconciliation" },
    next: [NS_NONE, NS_SELF, { v: "f_shafeek", l: "Pass to Shafeek" }, { v: "f_jintu", l: "Pass to Jintu" }],
  },
  "finance@flaretechnical.com": {
    kinds: [{ v: "br", l: "Bank reconciliation" }, { v: "chq", l: "Cheques" }, { v: "pc", l: "Petty cash and cash" }, { v: "tr", l: "Transfer" }, { v: "bf", l: "Bank facility" }, { v: "rv", l: "Review or collection" }, { v: "sd", l: "Security deposit refund" }, { v: "sp", l: "Supplier payment" }, { v: "ss", l: "Supplier statement check" }, { v: "py", l: "Payroll" }, { v: "ls", l: "Leave salary or settlement" }, { v: "ad", l: "Advance or loan" }, { v: "vat", l: "VAT" }, { v: "ct", l: "Corporate tax" }, { v: "ez", l: "E-invoicing and Zoho" }, { v: "lic", l: "Licence and insurance" }, { v: "fr", l: "Financial report" }, { v: "pl", l: "Project P&L" }, { v: "aj", l: "Adjustments and postings" }, { v: "ic", l: "Intercompany" }, { v: "au", l: "Audit or internal check" }, { v: "ap", l: "Approval given" }, { v: "mt", l: "Meeting" }, { v: "oth", l: "Other task (type it)" }],
    companies: ["flaretechnical", "gasneeds"],
    tabs: [{ l: "Banking & cash", kinds: ["br", "chq", "pc", "tr", "bf"] }, { l: "Receivables", kinds: ["rv", "sd"] }, { l: "Payables", kinds: ["sp", "ss"] }, { l: "Payroll & staff", kinds: ["py", "ls", "ad"] }, { l: "Tax & compliance", kinds: ["vat", "ct", "ez", "lic"] }, { l: "Reports", kinds: ["fr", "pl", "aj", "ic"] }, { l: "Audit & control", kinds: ["au", "ap"] }, { l: "Meetings", kinds: ["mt", "oth"] }],
    parent: { br: "Banking & Cash", chq: "Banking & Cash", pc: "Banking & Cash", tr: "Banking & Cash", bf: "Banking & Cash", rv: "Receivables & Collections", sd: "Receivables & Collections", sp: "Payables & Suppliers", ss: "Payables & Suppliers", py: "Payroll & Staff Payments", ls: "Payroll & Staff Payments", ad: "Payroll & Staff Payments", vat: "Tax, VAT & Compliance", ct: "Tax, VAT & Compliance", ez: "Tax, VAT & Compliance", lic: "Tax, VAT & Compliance", fr: "Reports & Adjustments", pl: "Reports & Adjustments", aj: "Reports & Adjustments", ic: "Reports & Adjustments", au: "Audit & Control", ap: "Audit & Control", mt: "Meetings & Admin", oth: "Other work" },
    next: [NS_NONE, NS_SELF, { v: "f_hashim", l: "Pass to Hashim" }, { v: "f_jintu", l: "Pass to Jintu" }],
  },
  "accounts@gasneeds.com": {
    kinds: [{ v: "pr", l: "Payment received" }, { v: "pm", l: "Payment made" }, { v: "pf", l: "Payment follow-up" }, { v: "f", l: "Follow-up" }, { v: "cc", l: "Cheque or cash" }, { v: "ac", l: "Accounts entry" }],
    companies: ["gasneeds", "flaretechnical"],
    parent: { pr: "Payments & Receipts", pm: "Payments & Receipts", pf: "Receivables Follow-up", f: "Calls & Emails", cc: "Cheques, Cash & Banking", ac: "Bills & Books" },
    dept: { f: "Accounts" },
    next: [NS_NONE, NS_SELF, { v: "f_shafeek", l: "Pass to Shafeek" }, { v: "f_hashim", l: "Pass to Hashim" }],
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
export const BANKS = ["Emirates NBD", "Mashreq", "ADCB", "FAB", "Dubai Islamic Bank", "RAKBANK", "Wio", "Other bank"];
export const PAY_FOR = ["Invoice", "Advance payment", "Security deposit", "Material or project", "Other"];
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
export type GField = { n: string; l: string; t: "pick" | "type" | "date" | "month" | "staff" | "customer" | "supplier" | "project"; o?: string[]; ph?: string; req?: boolean };
export type GKind = { code: string; dept: string; parentFrom?: string; building?: "req" | "opt"; fields: GField[]; title: (v: Record<string, string>) => string };
const sm = (n = "readMonth", l = "For the month"): GField => ({ n, l, t: "month", req: true });
const OTHER_CATS = ["Audit & Control", "Banking & Cash", "Meetings & Admin", "Other work", "Payables & Suppliers", "Payroll & Staff Payments", "Receivables & Collections", "Reports & Adjustments", "Tax, VAT & Compliance"];
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
  br: { code: "FIN_BANK_REC", dept: "Accounts", title: (v) => `Bank reconciliation — ${v.bank || ""}`, fields: [{ n: "bank", l: "Bank", t: "pick", o: BANKS }, { n: "month", l: "For the month", t: "month", req: true }, { n: "what", l: "Where it stands", t: "pick", o: ["Started", "Done", "Differences found", "Waiting for the bank"] }] },
  chq: { code: "FIN_CHEQUES", dept: "Accounts", title: (v) => v.what || "Cheques", fields: [{ n: "what", l: "What was done", t: "pick", o: ["Cheques prepared", "Cheques signed", "Cheques issued", "Cheques deposited", "Cheques collected", "Cheque returned"] }, { n: "bank", l: "Bank", t: "pick", o: BANKS }, { n: "count", l: "Number of cheques", t: "type" }, { n: "amount", l: "Amount (AED)", t: "type" }] },
  pc: { code: "FIN_PETTY_CASH", dept: "Accounts", title: (v) => v.what || "Petty cash", fields: [{ n: "what", l: "What was done", t: "pick", o: ["Petty cash topped up", "Petty cash checked", "Cash deposited", "Cash count"] }, { n: "amount", l: "Amount (AED)", t: "type" }] },
  tr: { code: "FIN_TRANSFER", dept: "Accounts", title: (v) => v.what || "Transfer", fields: [{ n: "what", l: "Type", t: "pick", o: ["International transfer", "Local transfer", "Between our own accounts"] }, { n: "bank", l: "Bank", t: "pick", o: BANKS }, { n: "amount", l: "Amount (AED)", t: "type", req: true }, { n: "reference", l: "Reference", t: "type", ph: "Only if you have it" }] },
  bf: { code: "FIN_BANK_FACILITY", dept: "Accounts", title: (v) => `${v.what || "Facility"} — ${v.stage || ""}`, fields: [{ n: "what", l: "Facility", t: "pick", o: ["Letter of credit", "Bank guarantee", "Overdraft", "Loan", "Credit card"] }, { n: "bank", l: "Bank", t: "pick", o: BANKS }, { n: "stage", l: "Where it stands", t: "pick", o: ["Requested", "Approved", "Issued", "Renewed", "Closed"] }, { n: "expiry", l: "Expiry date", t: "date" }, { n: "amount", l: "Amount (AED)", t: "type" }] },
  rv: { code: "FIN_RECEIVABLE", dept: "Accounts", title: (v) => v.what || "Receivables", fields: [{ n: "what", l: "What was done", t: "pick", o: ["Ageing review", "Payment collection", "Statement of account sent", "Credit terms set", "Dispute raised", "Written off"] }, { n: "customerId", l: "Customer", t: "customer", req: true }, { n: "invoice", l: "Invoice no.", t: "type", ph: "Only if you have it" }, { n: "amount", l: "Amount (AED)", t: "type" }, { n: "answer", l: "Their answer", t: "pick", o: ["Will pay this week", "Asked for more time", "Disputed", "No answer", "Paid"] }, { n: "promisedOn", l: "Promised by", t: "date" }] },
  sd: { code: "FIN_DEPOSIT_REFUND", dept: "Accounts", title: (v) => `Security deposit refund — ${v.stage || ""}`, fields: [{ n: "customerId", l: "Customer", t: "customer", req: true }, { n: "amount", l: "Amount (AED)", t: "type", req: true }, { n: "stage", l: "Where it stands", t: "pick", o: ["Requested", "Approved", "Paid", "On hold"] }] },
  sp: { code: "FIN_SUPPLIER_PAYMENT", dept: "Accounts", title: (v) => `Supplier payment — ${v.stage || ""}`, fields: [{ n: "supplierId", l: "Supplier", t: "supplier", req: true }, { n: "invoice", l: "PO or invoice no.", t: "type", ph: "Only if you have it" }, { n: "amount", l: "Amount (AED)", t: "type", req: true }, { n: "method", l: "Paid by", t: "pick", o: PAY_METHODS }, { n: "stage", l: "Where it stands", t: "pick", o: ["Invoice verified", "Payment approved", "Paid", "Part of a payment run"] }] },
  ss: { code: "FIN_SUPPLIER_STATEMENT", dept: "Accounts", title: (v) => `Supplier statement — ${v.stage || ""}`, fields: [{ n: "supplierId", l: "Supplier", t: "supplier", req: true }, { n: "month", l: "For the month", t: "month", req: true }, { n: "stage", l: "Where it stands", t: "pick", o: ["Matched", "Differences found", "Waiting for supplier"] }] },
  py: { code: "FIN_PAYROLL", dept: "Accounts", title: (v) => v.what || "Payroll", fields: [{ n: "what", l: "What was done", t: "pick", o: ["Payroll generation", "Payroll review", "WPS file", "Overtime payment", "Salary paid", "Employee performance report"] }, { n: "month", l: "For the month", t: "month", req: true }, { n: "stage", l: "Where it stands", t: "pick", o: ["Prepared", "Reviewed", "Approved by Abraham sir", "Paid"] }] },
  ls: { code: "FIN_SETTLEMENT", dept: "Accounts", title: (v) => v.what || "Settlement", fields: [{ n: "what", l: "Type", t: "pick", o: ["Leave salary and air ticket", "Final settlement", "Gratuity"] }, { n: "employee", l: "Employee", t: "staff", req: true }, { n: "amount", l: "Amount (AED)", t: "type" }, { n: "stage", l: "Where it stands", t: "pick", o: ["Calculated", "Approved", "Paid"] }] },
  ad: { code: "FIN_ADVANCE", dept: "Accounts", title: (v) => v.what || "Advance or loan", fields: [{ n: "employee", l: "Employee", t: "staff", req: true }, { n: "what", l: "Type", t: "pick", o: ["Salary advance", "Staff loan", "Loan recovery"] }, { n: "amount", l: "Amount (AED)", t: "type", req: true }] },
  vat: { code: "FIN_VAT", dept: "Accounts", title: (v) => `VAT ${v.period || ""} — ${v.stage || ""}`, fields: [{ n: "period", l: "Period", t: "pick", o: ["Q1", "Q2", "Q3", "Q4"] }, { n: "stage", l: "Where it stands", t: "pick", o: ["Preparing", "Submitted", "Paid", "Acknowledgement received"] }, { n: "amount", l: "Amount (AED)", t: "type" }, { n: "due", l: "Due date", t: "date" }] },
  ct: { code: "FIN_CORPORATE_TAX", dept: "Accounts", title: (v) => `Corporate tax ${v.year || ""} — ${v.stage || ""}`, fields: [{ n: "year", l: "Year", t: "pick", o: ["2025", "2026", "2027"] }, { n: "stage", l: "Where it stands", t: "pick", o: ["Preparing", "Submitted", "Paid", "Acknowledgement received"] }, { n: "amount", l: "Amount (AED)", t: "type" }, { n: "due", l: "Due date", t: "date" }] },
  ez: { code: "FIN_SYSTEMS", dept: "Accounts", title: (v) => v.what || "Systems", fields: [{ n: "what", l: "What was done", t: "pick", o: ["E-invoice set-up", "E-invoice issue fixed", "Zoho set-up or change", "Chart of accounts change"] }, { n: "stage", l: "Where it stands", t: "pick", o: ["Started", "Done", "Waiting for someone", "Query raised"] }] },
  lic: { code: "FIN_LICENCE", dept: "Accounts", title: (v) => v.what || "Licence or insurance", fields: [{ n: "what", l: "What", t: "pick", o: ["Trade licence renewal", "Insurance renewal", "Professional indemnity", "Other registration"] }, { n: "expiry", l: "Expiry date", t: "date" }, { n: "stage", l: "Where it stands", t: "pick", o: ["Quote requested", "Renewed", "Paid", "Documents received"] }, { n: "amount", l: "Amount (AED)", t: "type" }] },
  fr: { code: "FIN_REPORT", dept: "Accounts", title: (v) => v.what || "Report", fields: [{ n: "what", l: "Report", t: "pick", o: ["Monthly financial report", "Management report to Abraham sir", "Budget vs actual", "Import / consolidated report", "Cash-flow report", "Cash-flow forecast"] }, { n: "month", l: "For the month", t: "month", req: true }, { n: "stage", l: "Where it stands", t: "pick", o: ["Prepared", "Reviewed", "Submitted to Abraham sir"] }] },
  pl: { code: "FIN_PROJECT_PL", dept: "Accounts", title: (v) => `Project P&L — ${v.stage || ""}`, fields: [{ n: "projectId", l: "Project", t: "project", req: true }, { n: "stage", l: "Where it stands", t: "pick", o: ["Prepared", "Reviewed", "Submitted to Abraham sir"] }] },
  aj: { code: "FIN_ADJUSTMENTS", dept: "Accounts", title: (v) => v.what || "Adjustments", fields: [{ n: "what", l: "What was done", t: "pick", o: ["Adjustment entries", "Expense posting and review", "Accruals", "Depreciation", "Month-end close"] }, { n: "month", l: "For the month", t: "month", req: true }, { n: "stage", l: "Where it stands", t: "pick", o: ["Started", "Done", "Waiting for someone", "Query raised"] }] },
  ic: { code: "FIN_INTERCOMPANY", dept: "Accounts", title: (v) => `Intercompany — ${v.what || ""}`, fields: [{ n: "between", l: "Between", t: "pick", o: ["Flaretech to Gasneeds", "Gasneeds to Flaretech"] }, { n: "what", l: "What", t: "pick", o: ["Balance reconciliation", "Recharge", "Loan or payment"] }, { n: "amount", l: "Amount (AED)", t: "type" }, { n: "stage", l: "Where it stands", t: "pick", o: ["Matched", "Differences found", "Settled"] }] },
  au: { code: "FIN_AUDIT", dept: "Accounts", title: (v) => v.what || "Audit or check", fields: [{ n: "what", l: "What was done", t: "pick", o: ["Auditor request answered", "Audit documents shared", "Audit meeting", "Management letter points closed", "Bank reconciliation reviewed", "Payment approvals checked", "Petty cash checked", "Team's work reviewed"] }, { n: "stage", l: "Result", t: "pick", o: ["Done", "Issues found and fixed", "Issues escalated", "Waiting for someone"] }] },
  ap: { code: "FIN_APPROVAL", dept: "Accounts", title: (v) => `Approved — ${v.what || ""}`, fields: [{ n: "what", l: "Approved", t: "pick", o: ["Payment", "Expense", "Salary or advance", "Credit note", "Purchase"] }, { n: "amount", l: "Amount (AED)", t: "type" }, { n: "employee", l: "Requested by", t: "staff", req: true }] },
  mt: { code: "FIN_MEETING", dept: "Accounts", title: (v) => v.what || "Meeting", fields: [{ n: "what", l: "Type", t: "pick", o: ["Meeting with Abraham sir", "Accounts team meeting", "Weekly project meeting", "Bank meeting", "Auditor meeting"] }, { n: "stage", l: "Result", t: "pick", o: ["Agreed", "Action points given", "Decision pending", "Postponed"] }] },
  oth: { code: "FIN_OTHER", dept: "Accounts", parentFrom: "category", title: (v) => v.title || "Other task", fields: [{ n: "category", l: "Category", t: "pick", o: OTHER_CATS }, { n: "title", l: "Short title", t: "type", ph: "What was it?", req: true }] },
  rp: { code: "REPORT", dept: "Maintenance", building: "opt", title: (v) => v.reportType || "Report", fields: [{ n: "reportType", l: "Report", t: "pick", o: ["Gas reading summary", "Outstanding report", "Detail report"] }, sm("reportMonth", "For the month")] },
};
