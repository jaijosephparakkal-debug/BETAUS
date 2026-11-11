/** The November 2026 roll-out email: what changed for each person, how KPIs work for now, and the confidentiality note. */
export type Recipient = { name: string; email: string; personal: string[] };

export const RECIPIENTS: Recipient[] = [
  { name: "Antony", email: "sales@gasneeds.com", personal: [
    "Your quotations are numbered with the month, for example GN-Q-2026-NOV-0001, and you can back-date an entry when you log it late.",
    "“Earlier quotation” lets you follow up or pass on a quotation raised before 11 Nov.",
    "Every enquiry now records where the lead came from (website, Google, referral and so on).",
    "From Next step you can hand a quotation over to Manu, with a due date and a reminder." ] },
  { name: "Manu", email: "business@gasneeds.com", personal: [
    "Quotations, enquiries (with lead source), purchase orders, imports and deliveries and follow-ups are all structured forms now.",
    "“Earlier quotation” covers anything raised before 11 Nov.",
    "When goods are delivered, hand the quotation over to Jintu from Next step for the payment follow-up." ] },
  { name: "Jintu", email: "accounts@gasneeds.com", personal: [
    "Payment received, payment made, payment follow-up, follow-up, cheque or cash and accounts entry now use dropdowns for customer, supplier, bank, payment method and status.",
    "A payment can be logged with no quotation, as “Payment is for” an invoice, advance, deposit or other.",
    "You work for both firms: choose Gasneeds or Flaretech at the top of the form.",
    "You can pass work to Shafeek or Hashim from Next step." ] },
  { name: "Flexie", email: "alerts@flaretechnical.com", personal: [
    "Meter reading, gas invoice, collection, disconnection and refund and outstanding report are logged by building, from the building list.",
    "Pick the building and its bill cycle, rate and charges appear automatically. Type only the flat or kitchen number.",
    "You can hand a collection to Hashim from Next step." ] },
  { name: "Jayaprakash", email: "service@flaretechnical.com", personal: [
    "Connections and disconnections get a service request number automatically (for example SR-2026-NOV-0001).",
    "Enquiries, FSM schedule, invoice or payment link and calls are logged by building.",
    "You can hand a first bill over to Flexie from Next step." ] },
  { name: "Hashim", email: "accounts@flaretechnical.com", personal: [
    "Your form has two tabs, Maintenance (AMC, PPM report, DCD attestation, gas reading report) and Accounts (collection, accounts entry).",
    "Everything is for Flaretech.",
    "You can pass work to Shafeek or Jintu from Next step." ] },
  { name: "Shafeek", email: "finance@flaretechnical.com", personal: [
    "Your form has eight tabs for both firms: banking and cash, receivables, payables, payroll and staff, tax and compliance, reports, audit and control, and meetings, plus an “Other task” entry.",
    "Customers, suppliers, banks, projects and staff come from dropdowns. The staff list is the Employee ID Directory.",
    "You can pass work to Hashim or Jintu from Next step." ] },
  { name: "Ram", email: "ram@flaretechnical.com", personal: [
    "New entries: Variation or claim, Plan, issue or report, and Team review, where you pick a team member and approve or return their work.",
    "Payment or invoice now includes progress certificate and retention release.",
    "Every project is in the project dropdown." ] },
  { name: "Jiyad", email: "jiyad.m@flaretechnical.com", personal: [
    "New entries: Material at site and Snag or RFI.",
    "Inspection now includes subcontractor work checked, and Tracker or report includes measurement sheet and testing or commissioning record.",
    "One dropdown holds all 70 site tasks for the project you pick." ] },
  { name: "Jashim", email: "jashim@flaretechnical.com", personal: [
    "New entries: RFI or clash, and Calculation or BOM.",
    "You also take over the drawings and submittals that were Mamidi's.",
    "One dropdown holds all 70 site tasks for the project you pick." ] },
  { name: "Saroj", email: "saroj@flaretechnical.com", personal: [
    "New entry: Supplier price request. Quotation now includes tender submitted, clarification answered, negotiation and bid bond.",
    "Your Estimate and Quotation entries have an optional private value in AED. Your estimation figures are visible only to you and Abraham sir.",
    "Estimation numbers continue as before." ] },
  { name: "Simi", email: "simi@flaretechnical.com", personal: [
    "New entry: LPO or delivery. Cost now includes subcontractor payment and retention, and Document or report includes transmittal sent.",
    "Suppliers come from a dropdown with “Add supplier” for new ones.",
    "Every project is in the project dropdown." ] },
];

const li = (items: string[]) => items.map((x) => `<li style="margin:0 0 6px">${x}</li>`).join("");
const h = (t: string) => `<h3 style="margin:22px 0 8px;font-size:16px;color:#111217">${t}</h3>`;

export function buildEmail(r: Recipient): { subject: string; html: string } {
  const first = r.name;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1b1f27;max-width:640px">
<p>Dear ${first},</p>
<p>OWN IT has had an upgrade. This note explains what is new for you, how your KPIs work for now, and how confidential information is handled.</p>
${h("What is new for you")}
<ul style="padding-left:20px;margin:0">${li(r.personal)}</ul>
${h("What is new for everyone")}
<ul style="padding-left:20px;margin:0">${li([
  "A new look, with your photo and your company's colours.",
  "My Tasks now opens with a home panel: what needs you today, quick links to log work, and live numbers.",
  "Forms are mostly dropdowns. You type only numbers, references, names of outside contacts and links.",
  "Next step lets you pass work on to a colleague, with a due date and a reminder.",
  "If something is missing from a list, use “Other task” and tell us, so we can add it.",
])}</ul>
${h("Nothing has been removed")}
<p style="margin:0">Your existing tasks, history and KPIs are exactly as they were. From here we only add to them or upgrade them.</p>
${h("How your KPI is calculated for now")}
<ul style="padding-left:20px;margin:0">${li([
  "Each KPI gives a score from 0 to 100. It is your actual result divided by the target. For speed KPIs, such as days to finish, it is the target divided by your actual.",
  "Your score is the average of your KPIs.",
  "A company's score is the average of its people, and each company is scored against its own targets.",
  "No targets are fixed yet. Any figures you see are provisional and for reference. Until we have enough real data, your KPIs simply show what you actually do. Targets will be set from that data, starting in January.",
])}</ul>
${h("Confidential information")}
<p style="margin:0">Anything confidential you enter, such as figures, amounts and documents including Emirates ID and visa copies, is private to you and the company's management. If you attach such a document as a link, set its sharing to named people only.</p>
${h("What we ask of you")}
<ul style="padding-left:20px;margin:0">${li([
  "Log your work on the day, using the dropdowns.",
  "Close the loop when something finishes, for example when a payment is received, so the numbers stay true.",
  "Tell us what is missing or awkward, so we can improve it.",
])}</ul>
<p style="margin-top:20px">Sign in at <a href="https://ownit-uae.vercel.app">ownit-uae.vercel.app</a>.</p>
<p>Thank you,<br>OWN IT · Management</p>
</div>`;
  return { subject: "What's new in OWN IT, and how your KPIs work for now", html };
}
