/** Wording and lists for the structured work log form (Antony). Everything here is picked, not typed. */
export const LOG_FORM_EMAILS = ["sales@gasneeds.com"];
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
