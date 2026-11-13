import { PRODUCTS } from "@/lib/products";

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
/** Creates a reminder task that can only be closed by writing what was informed and what Abraham sir decided. */
const NS_INFORM = { v: "inform_abraham", l: "Inform Abraham sir" };

/** Who gets the structured work-log form, and what it offers them. */
export const PROFILES: Record<string, Profile> = {
  "sales@gasneeds.com": {
    kinds: [{ v: "q", l: "Quotation" }, { v: "f", l: "Follow-up" }, { v: "v", l: "Customer visit" }, { v: "pro", l: "PRO" }, { v: "hr", l: "HR" }, { v: "av", l: "Visit or meeting" }],
    companies: ["gasneeds", "flaretechnical"],
    parent: { q: "Sales — Quotations", f: "Sales — Follow-ups", v: "Sales — Customer Visits", pro: "PRO — Government & Admin", hr: "HR — Staff & Insurance", av: "Sales — Customer Visits" },
    next: [NS_NONE, NS_SELF, NS_INFORM, { v: "manu", l: "Hand over to Manu — purchase follow-up" }, { v: "jintu", l: "Hand over to Jintu — payment follow-up" }],
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
    kinds: [{ v: "amc", l: "AMC contract" }, { v: "ppm", l: "PPM report" }, { v: "dcd", l: "DCD attestation" }, { v: "rp", l: "Gas reading report" }, { v: "co", l: "Collection" }, { v: "hsd", l: "Security deposit refund" }, { v: "ac", l: "Accounts entry" }],
    companies: ["flaretechnical"],
    tabs: [{ l: "Maintenance", kinds: ["amc", "ppm", "dcd", "rp"] }, { l: "Accounts", kinds: ["co", "hsd", "ac"] }],
    parent: { amc: "Maintenance — AMC, Contracts & Portals", ppm: "Maintenance — Gas Reading & Reports", dcd: "Maintenance — AMC, Contracts & Portals", rp: "Maintenance — Gas Reading & Reports", co: "Accounts — Collections & Follow-ups", hsd: "Accounts — Collections & Follow-ups", ac: "Accounts — Vouchers & Reconciliation" },
    next: [NS_NONE, NS_SELF, { v: "f_shafeek", l: "Pass to Shafeek" }, { v: "f_jintu", l: "Pass to Jintu" }],
  },
  "finance@flaretechnical.com": {
    kinds: [{ v: "br", l: "Bank reconciliation" }, { v: "chq", l: "Cheques" }, { v: "pc", l: "Petty cash and cash" }, { v: "tr", l: "Transfer" }, { v: "bf", l: "Bank facility" }, { v: "rv", l: "Review or collection" }, { v: "sd", l: "Security deposit refund" }, { v: "sp", l: "Supplier payment" }, { v: "ss", l: "Supplier statement check" }, { v: "py", l: "Payroll" }, { v: "ls", l: "Leave salary or settlement" }, { v: "ad", l: "Advance or loan" }, { v: "vat", l: "VAT" }, { v: "ct", l: "Corporate tax" }, { v: "ez", l: "E-invoicing and Zoho" }, { v: "lic", l: "Licence and insurance" }, { v: "fr", l: "Financial report" }, { v: "pl", l: "Project P&L" }, { v: "aj", l: "Adjustments and postings" }, { v: "ic", l: "Intercompany" }, { v: "au", l: "Audit or internal check" }, { v: "ap", l: "Approval given" }, { v: "mt", l: "Meeting" }, { v: "oth", l: "Other task (type it)" }],
    companies: ["flaretechnical", "gasneeds"],
    tabs: [{ l: "Banking & cash", kinds: ["br", "chq", "pc", "tr", "bf"] }, { l: "Receivables", kinds: ["rv", "sd"] }, { l: "Payables", kinds: ["sp", "ss"] }, { l: "Payroll & staff", kinds: ["py", "ls", "ad"] }, { l: "Tax & compliance", kinds: ["vat", "ct", "ez", "lic"] }, { l: "Reports", kinds: ["fr", "pl", "aj", "ic"] }, { l: "Audit & control", kinds: ["au", "ap"] }, { l: "Meetings", kinds: ["mt", "oth"] }],
    parent: { br: "Banking & Cash", chq: "Banking & Cash", pc: "Banking & Cash", tr: "Banking & Cash", bf: "Banking & Cash", rv: "Receivables & Collections", sd: "Receivables & Collections", sp: "Payables & Suppliers", ss: "Payables & Suppliers", py: "Payroll & Staff Payments", ls: "Payroll & Staff Payments", ad: "Payroll & Staff Payments", vat: "Tax, VAT & Compliance", ct: "Tax, VAT & Compliance", ez: "Tax, VAT & Compliance", lic: "Tax, VAT & Compliance", fr: "Reports & Adjustments", pl: "Reports & Adjustments", aj: "Reports & Adjustments", ic: "Reports & Adjustments", au: "Audit & Control", ap: "Audit & Control", mt: "Meetings & Admin", oth: "Other work" },
    next: [NS_NONE, NS_SELF, { v: "f_hashim", l: "Pass to Hashim" }, { v: "f_jintu", l: "Pass to Jintu" }],
  },
  "jai@gasneeds.com": {
    kinds: [{ v: "j_des", l: "Design" }, { v: "j_vid", l: "Video" }, { v: "j_ph", l: "Photo shoot" }, { v: "j_cw", l: "Copy or blog writing" }, { v: "j_sp", l: "Social post" }, { v: "j_sw", l: "Website or product page" }, { v: "j_em", l: "Email campaign" }, { v: "j_gb", l: "Google Business and reviews" }, { v: "j_kw", l: "Keyword research" }, { v: "j_on", l: "On-page fixes" }, { v: "j_bl", l: "Blog or content published" }, { v: "j_lk", l: "Backlinks" }, { v: "j_ta", l: "Technical audit" }, { v: "j_rk", l: "Ranking check" }, { v: "j_cp", l: "Campaign" }, { v: "j_ad", l: "Paid ad" }, { v: "j_cr", l: "Campaign result" }, { v: "j_mr", l: "Monthly report" }, { v: "j_sc", l: "Search Console or GA4 check" }, { v: "j_bg", l: "Brand guidelines" }, { v: "j_pa", l: "Print approval" }, { v: "j_al", l: "Asset library" }, { v: "j_ap", l: "Apps and systems" }, { v: "j_cf", l: "Confidential" }, { v: "j_ot", l: "Other task (type it)" }],
    companies: ["gasneeds", "flaretechnical"],
    tabs: [{ l: "Create", kinds: ["j_des", "j_vid", "j_ph", "j_cw"] }, { l: "Publish", kinds: ["j_sp", "j_sw", "j_em", "j_gb"] }, { l: "SEO", kinds: ["j_kw", "j_on", "j_bl", "j_lk", "j_ta", "j_rk"] }, { l: "Campaigns", kinds: ["j_cp", "j_ad", "j_cr"] }, { l: "Analytics", kinds: ["j_mr", "j_sc"] }, { l: "Brand & assets", kinds: ["j_bg", "j_pa", "j_al"] }, { l: "Systems", kinds: ["j_ap"] }, { l: "Confidential", kinds: ["j_cf", "j_ot"] }],
    parent: { j_des: "Design", j_vid: "Video", j_ph: "Digital Marketing", j_cw: "Digital Marketing", j_sp: "Digital Marketing", j_sw: "Digital Marketing", j_em: "Digital Marketing", j_gb: "Digital Marketing", j_kw: "Campaigns & SEO", j_on: "Campaigns & SEO", j_bl: "Campaigns & SEO", j_lk: "Campaigns & SEO", j_ta: "Campaigns & SEO", j_rk: "Campaigns & SEO", j_cp: "Campaigns & SEO", j_ad: "Campaigns & SEO", j_cr: "Campaigns & SEO", j_mr: "Analytics & Reports", j_sc: "Analytics & Reports", j_bg: "Brand & Assets", j_pa: "Brand & Assets", j_al: "Brand & Assets", j_ap: "Apps & Systems", j_cf: "Confidential", j_ot: "Other work" },
    next: [NS_NONE, NS_SELF],
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
/** Government visits and meetings that belong to PRO work: they have no transaction number. */
export const PRO_VISITS = ["Visit to a government office", "Meeting with a government official", "Inspection or audit visit"];
export const PRO_SERVICES = ["Visa — renewal", "Visa — new", "Emirates ID", "Medical test", "Labour card", "Trade licence", "RTA", ...PRO_VISITS];
export const VISIT_WHO = ["Customer", "Vendor or supplier", "Partner or distributor", "Government official", "Exhibition or event", "Yard or storage", "Printer", "Office space", "Bank", "Other"];
export const VISIT_HOW = ["In person — at their place", "In person — at our office", "Site visit", "Exhibition or event", "Video call", "Phone call"];
export const VISIT_PURPOSE = ["Introduction or relationship", "Quotation or price discussion", "Order or delivery", "Payment", "Inspection or check", "Registration or approval", "Product demo", "Other"];
export const PRO_STAGES = ["Documents sent", "Submitted", "In process", "Approved", "Collected", "Rejected"];
export const BACKDATE_REASONS = ["Forgot to log it", "Was away from the office", "No network at the time", "Other"];
export const BACKDATE_DAYS = 7;

export const ENQ_STATUS = ["Enquiry received", "Clarified with the customer", "Converted to a quotation", "Closed — no order"];
export const PO_STATUS = ["Sent to supplier", "Confirmed by supplier", "Amended", "Cancelled"];
export const IMPORT_STAGES = ["Shipment booked", "In transit", "Customs clearance", "Arrived", "Delivery arranged", "Delivered"];
export const LEAD_SOURCES = ["Existing customer", "Website", "Google search", "Social media", "Email campaign", "Exhibition or event", "Referral", "Walk-in or cold call", "Other"];
export const MKT_FOR = ["Mooken brand", "Gasneeds brand", "Flaretech brand", "Internal", ...Object.keys(PRODUCTS)];
export const REQUEST_TYPES = ["Design", "Brochure or print", "Video", "Photo shoot", "Social post", "Website or product page", "Document or presentation", "Other"];
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
export type GKind = { code: string; dept: string; parentFrom?: string; building?: "req" | "opt"; /** Ask for the building only, no unit or charges (AMC, PPM, DCD). */ noUnit?: boolean; fields: GField[]; title: (v: Record<string, string>) => string };
const sm = (n = "readMonth", l = "For the month"): GField => ({ n, l, t: "month", req: true });
const JAI_CATS = ["Analytics & Reports", "Apps & Systems", "Brand & Assets", "Campaigns & SEO", "Confidential", "Design", "Digital Marketing", "Other work", "Video", "Other work"];
const OTHER_CATS = ["Audit & Control", "Banking & Cash", "Meetings & Admin", "Other work", "Payables & Suppliers", "Payroll & Staff Payments", "Receivables & Collections", "Reports & Adjustments", "Tax, VAT & Compliance"];
export const GENERIC: Record<string, GKind> = {
  hsd: { code: "SECURITY_DEPOSIT_REFUND", dept: "Accounts", building: "req", noUnit: true, title: (v) => `Security deposit refund — ${v.stage || ""}`, fields: [{ n: "stage", l: "Where it stands", t: "pick", o: ["Verified", "Posted", "Submitted to Shafeek sir", "Refund paid", "On hold"] }, { n: "tenants", l: "Number of tenants", t: "type", ph: "e.g. 18" }, { n: "amount", l: "Amount (AED)", t: "type", ph: "Only when known" }, { n: "notes", l: "Notes", t: "type", ph: "Only if useful" }] },
  av: { code: "VISIT_MEETING", dept: "Operation", title: (v) => `${v.who || "Visit"} — ${v.name || ""}`, fields: [{ n: "who", l: "Who or what", t: "pick", o: VISIT_WHO }, { n: "name", l: "Name of the person, company or place", t: "type", req: true, ph: "e.g. Dubai Municipality, Al Ain Printers" }, { n: "how", l: "How", t: "pick", o: VISIT_HOW }, { n: "timeOfDay", l: "When", t: "pick", o: ["Morning", "Afternoon", "Evening", "Full day"] }, { n: "purpose", l: "Why", t: "pick", o: VISIT_PURPOSE }, { n: "outcome", l: "What came of it", t: "pick", o: ["Done, nothing more", "Follow-up needed", "Quotation to send", "Waiting for their reply"] }, { n: "notes", l: "Notes", t: "type", ph: "Only if useful" }] },
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
  amc: { code: "AMC_RENEWAL", dept: "Maintenance", building: "req", noUnit: true, title: (v) => v.amcStage || "AMC contract", fields: [{ n: "contractNo", l: "Contract no.", t: "type" }, { n: "renewalOn", l: "Renewal or expiry date", t: "date", req: true }, { n: "value", l: "Contract value (AED)", t: "type" }, { n: "amcStage", l: "Where it stands", t: "pick", o: ["Renewal quoted", "Renewal agreed", "Contract signed", "Lapsed"] }] },
  ppm: { code: "PPM_REPORT", dept: "Maintenance", building: "req", noUnit: true, title: (v) => v.ppmStage || "PPM report", fields: [sm("ppmMonth", "PPM month"), { n: "ppmStage", l: "Where it stands", t: "pick", o: ["Visit done", "Report prepared", "Report submitted"] }] },
  dcd: { code: "DCD_ATTESTATION", dept: "Maintenance", building: "req", noUnit: true, title: (v) => v.dcdStage || "DCD attestation", fields: [{ n: "dcdStage", l: "Where it stands", t: "pick", o: ["Documents prepared", "Submitted", "Inspection booked", "Attested", "Rejected"] }, { n: "reference", l: "Reference", t: "type", ph: "Only if you have it" }] },
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
  j_des: { code: "MKT_DESIGN", dept: "Marketing", title: (v) => `Design — ${v.type || ""}`, fields: [{ n: "type", l: "Type", t: "pick", o: ["Brochure / catalogue", "Brand / identity", "Packaging / print", "Certificate / form / document", "Presentation", "Signage / sticker", "Revision / re-edit"] }, { n: "for", l: "For", t: "pick", o: MKT_FOR }, { n: "requestedBy", l: "Requested by", t: "staff" }, { n: "state", l: "Where it stands", t: "pick", o: ["Brief received", "In progress", "Sent for approval", "Approved", "Delivered", "Revision"] }, { n: "approvedBy", l: "Approved by", t: "staff" }, { n: "due", l: "Due date", t: "date" }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_vid: { code: "MKT_VIDEO", dept: "Marketing", title: (v) => `Video — ${v.type || ""}`, fields: [{ n: "type", l: "Stage", t: "pick", o: ["Pre-production / storyboard", "Shoot", "Edit", "Final delivery / upload", "Rework / revision"] }, { n: "for", l: "For", t: "pick", o: MKT_FOR }, { n: "requestedBy", l: "Requested by", t: "staff" }, { n: "state", l: "Where it stands", t: "pick", o: ["Brief received", "In progress", "Sent for approval", "Approved", "Delivered", "Revision"] }, { n: "published", l: "Published on", t: "pick", o: ["Not yet", "YouTube", "Website", "Instagram", "LinkedIn", "WhatsApp / customers"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_ph: { code: "MKT_PHOTO", dept: "Marketing", title: (v) => `Photo shoot — ${v.type || ""}`, fields: [{ n: "type", l: "What", t: "pick", o: ["Product photos", "Site photos", "Team or event photos", "Editing"] }, { n: "for", l: "For", t: "pick", o: MKT_FOR }, { n: "state", l: "Where it stands", t: "pick", o: ["Planned", "Shot", "Edited", "Delivered"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_cw: { code: "MKT_COPY", dept: "Marketing", title: (v) => `Copy — ${v.type || ""}`, fields: [{ n: "type", l: "Type", t: "pick", o: ["Blog article", "Product description", "Brochure copy", "Social caption", "Email copy", "Website copy"] }, { n: "for", l: "For", t: "pick", o: MKT_FOR }, { n: "keyword", l: "Keyword", t: "type", ph: "Only if it is for SEO" }, { n: "state", l: "Where it stands", t: "pick", o: ["Drafting", "Sent for approval", "Approved", "Published"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_sp: { code: "MKT_SOCIAL", dept: "Marketing", title: (v) => `Social post — ${v.type || ""}`, fields: [{ n: "type", l: "Platform", t: "pick", o: ["Instagram", "LinkedIn", "YouTube", "Facebook", "TikTok", "X"] }, { n: "format", l: "Format", t: "pick", o: ["Post", "Reel or video", "Story", "Carousel"] }, { n: "for", l: "For", t: "pick", o: MKT_FOR }, { n: "state", l: "Where it stands", t: "pick", o: ["Drafted", "Scheduled", "Published"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_sw: { code: "MKT_WEBSITE", dept: "Marketing", title: (v) => `Website — ${v.type || ""}`, fields: [{ n: "site", l: "Website", t: "pick", o: ["Gasneeds website", "Flaretech website", "Mooken website"] }, { n: "type", l: "What", t: "pick", o: ["New page", "Page update", "Product added or updated", "Fix"] }, { n: "page", l: "Page", t: "type", ph: "Only if you know it" }, { n: "state", l: "Where it stands", t: "pick", o: ["In progress", "Live"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_em: { code: "MKT_EMAIL", dept: "Marketing", title: (v) => `Email campaign — ${v.state || ""}`, fields: [{ n: "type", l: "To", t: "pick", o: ["Customers", "Prospects", "Distributors", "Staff"] }, { n: "state", l: "Where it stands", t: "pick", o: ["Drafted", "Scheduled", "Sent"] }, { n: "count", l: "Number sent", t: "type", ph: "Only when sent" }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_gb: { code: "MKT_GBP", dept: "Marketing", title: (v) => `Google Business — ${v.type || ""}`, fields: [{ n: "site", l: "Profile", t: "pick", o: ["Gasneeds", "Flaretech", "Mooken"] }, { n: "type", l: "What", t: "pick", o: ["Profile updated", "Post published", "Review replied", "Photos added"] }] },
  j_kw: { code: "MKT_KEYWORDS", dept: "Marketing", title: (v) => "Keyword research", fields: [{ n: "site", l: "Website", t: "pick", o: ["Gasneeds website", "Flaretech website", "Mooken website"] }, { n: "topic", l: "Topic", t: "type", ph: "Only if you know it" }, { n: "objective", l: "Objective", t: "pick", o: ["Awareness", "Enquiries", "Rankings", "Retention"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_on: { code: "MKT_ONPAGE", dept: "Marketing", title: (v) => `On-page — ${v.type || ""}`, fields: [{ n: "site", l: "Website", t: "pick", o: ["Gasneeds website", "Flaretech website", "Mooken website"] }, { n: "type", l: "What", t: "pick", o: ["Titles and meta", "Headings", "Images and alt text", "Internal links", "Speed"] }, { n: "page", l: "Page", t: "type", ph: "Only if you know it" }, { n: "state", l: "Where it stands", t: "pick", o: ["In progress", "Done"] }] },
  j_bl: { code: "MKT_CONTENT", dept: "Marketing", title: (v) => `Published — ${v.type || ""}`, fields: [{ n: "site", l: "Website", t: "pick", o: ["Gasneeds website", "Flaretech website", "Mooken website"] }, { n: "type", l: "Type", t: "pick", o: ["Blog article", "Landing page", "Product page", "Case study"] }, { n: "keyword", l: "Keyword", t: "type", ph: "Only if it is for SEO" }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_lk: { code: "MKT_BACKLINKS", dept: "Marketing", title: (v) => `Backlinks — ${v.type || ""}`, fields: [{ n: "site", l: "Website", t: "pick", o: ["Gasneeds website", "Flaretech website", "Mooken website"] }, { n: "type", l: "What", t: "pick", o: ["Outreach sent", "Link secured", "Directory listing"] }, { n: "target", l: "Site or directory", t: "type", ph: "Only if you know it" }] },
  j_ta: { code: "MKT_AUDIT", dept: "Marketing", title: (v) => `Technical audit — ${v.type || ""}`, fields: [{ n: "site", l: "Website", t: "pick", o: ["Gasneeds website", "Flaretech website", "Mooken website"] }, { n: "type", l: "What", t: "pick", o: ["Crawl errors", "Speed", "Mobile", "Indexing", "Schema"] }, { n: "finding", l: "Finding", t: "pick", o: ["Nothing to fix", "Fixes needed", "Fixed"] }] },
  j_rk: { code: "MKT_RANKING", dept: "Marketing", title: (v) => `Ranking — ${v.keyword || ""} ${v.position || ""}`, fields: [{ n: "site", l: "Website", t: "pick", o: ["Gasneeds website", "Flaretech website", "Mooken website"] }, { n: "keyword", l: "Keyword", t: "type", req: true }, { n: "position", l: "Position (number)", t: "type", ph: "e.g. 7", req: true }] },
  j_cp: { code: "MKT_CAMPAIGN", dept: "Marketing", title: (v) => `Campaign — ${v.type || ""}`, fields: [{ n: "name", l: "Campaign name", t: "type", req: true }, { n: "type", l: "Stage", t: "pick", o: ["Planned", "Launched", "Paused", "Finished"] }, { n: "channel", l: "Channel", t: "pick", o: ["Website", "Google", "LinkedIn", "Instagram", "YouTube", "Email"] }, { n: "objective", l: "Objective", t: "pick", o: ["Awareness", "Enquiries", "Rankings", "Retention"] }, { n: "for", l: "For", t: "pick", o: MKT_FOR }] },
  j_ad: { code: "MKT_PAID_AD", dept: "Marketing", title: (v) => `Paid ad — ${v.type || ""}`, fields: [{ n: "type", l: "Platform", t: "pick", o: ["Google Ads", "Meta", "LinkedIn", "YouTube"] }, { n: "state", l: "Where it stands", t: "pick", o: ["Planned", "Live", "Paused", "Finished"] }, { n: "budget", l: "Budget (AED)", t: "type" }, { n: "for", l: "For", t: "pick", o: MKT_FOR }] },
  j_cr: { code: "MKT_RESULT", dept: "Marketing", title: (v) => `Result — ${v.name || ""}`, fields: [{ n: "name", l: "Campaign name", t: "type", req: true }, { n: "channel", l: "Channel", t: "pick", o: ["Website", "Google", "LinkedIn", "Instagram", "YouTube", "Email"] }, { n: "enquiries", l: "Enquiries received", t: "type" }, { n: "reach", l: "Reach or clicks", t: "type" }] },
  j_mr: { code: "MKT_REPORT", dept: "Marketing", title: (v) => "Monthly marketing report", fields: [{ n: "month", l: "For the month", t: "month", req: true }, { n: "visits", l: "Website visits", t: "type" }, { n: "enquiries", l: "Enquiries from marketing", t: "type" }, { n: "state", l: "Where it stands", t: "pick", o: ["Prepared", "Shared with Abraham sir"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_sc: { code: "MKT_ANALYTICS", dept: "Marketing", title: (v) => `${v.type || "Analytics"} check`, fields: [{ n: "type", l: "What", t: "pick", o: ["Search Console", "GA4", "Both"] }, { n: "finding", l: "Finding", t: "pick", o: ["Nothing to fix", "Fixes needed", "Fixed"] }] },
  j_bg: { code: "MKT_BRAND", dept: "Marketing", title: (v) => `Brand guidelines — ${v.type || ""}`, fields: [{ n: "site", l: "Brand", t: "pick", o: ["Mooken", "Gasneeds", "Flaretech"] }, { n: "type", l: "What", t: "pick", o: ["Updated", "Shared", "Approved"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_pa: { code: "MKT_PRINT", dept: "Marketing", title: (v) => `Print — ${v.type || ""}`, fields: [{ n: "type", l: "Item", t: "pick", o: ["Catalogue", "Brochure", "Packaging", "Signage", "Certificate", "Other"] }, { n: "printer", l: "Printer or vendor", t: "supplier" }, { n: "state", l: "Where it stands", t: "pick", o: ["Proof received", "Approved for print", "Printed", "Delivered"] }, { n: "approvedBy", l: "Approved by", t: "staff" }] },
  j_al: { code: "MKT_ASSETS", dept: "Marketing", title: (v) => `Asset library — ${v.type || ""}`, fields: [{ n: "type", l: "What", t: "pick", o: ["Added", "Reorganised", "Backed up"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_ap: { code: "MKT_SYSTEMS", dept: "Marketing", title: (v) => v.type || "Apps and systems", fields: [{ n: "type", l: "Type", t: "pick", o: ["App development", "App testing / fixes", "Store listing / release", "System setup / admin"] }, { n: "site", l: "Which", t: "pick", o: ["OWN IT", "Flaretech staff app", "Gasneeds website", "Mooken website", "Other"] }, { n: "state", l: "Where it stands", t: "pick", o: ["Planned", "In progress", "Testing", "Released"] }] },
  j_cf: { code: "MKT_CONFIDENTIAL", dept: "Marketing", title: (v) => v.type || "Confidential", fields: [{ n: "type", l: "Type", t: "pick", o: ["Agreement / legal document", "Business proposal", "Data report", "Letterhead / formal notice", "Presentation"] }, { n: "site", l: "For", t: "pick", o: ["Abraham sir", "Both firms", "Gasneeds", "Flaretech"] }, { n: "state", l: "Where it stands", t: "pick", o: ["Brief received", "In progress", "Sent for approval", "Approved", "Delivered", "Revision"] }, { n: "link", l: "Link to the file (Canva, Drive…)", t: "type", ph: "Paste the link" }] },
  j_ot: { code: "MKT_OTHER", dept: "Marketing", parentFrom: "category", title: (v) => v.title || "Other task", fields: [{ n: "category", l: "Category", t: "pick", o: JAI_CATS }, { n: "title", l: "Short title", t: "type", ph: "What was it?", req: true }] },
  rp: { code: "REPORT", dept: "Maintenance", building: "opt", title: (v) => v.reportType || "Report", fields: [{ n: "reportType", l: "Report", t: "pick", o: ["Gas reading summary", "Outstanding report", "Detail report"] }, sm("reportMonth", "For the month")] },
};
