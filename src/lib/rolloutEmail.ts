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

/** Malayalam version of the same email, for Antony and Jayaprakash. */
export const ML_RECIPIENTS: { name: string; ml: string; email: string; personal: string[] }[] = [
  { name: "Antony", ml: "ആന്റണി", email: "sales@gasneeds.com", personal: [
    "നിങ്ങളുടെ ക്വട്ടേഷനുകൾക്ക് മാസം ഉൾപ്പെടുത്തിയ നമ്പർ ലഭിക്കും, ഉദാഹരണം GN-Q-2026-NOV-0001. വൈകി രേഖപ്പെടുത്തുമ്പോൾ പഴയ തീയതി നൽകാം.",
    "“Earlier quotation” ഉപയോഗിച്ച് 11 നവംബറിന് മുമ്പ് തയ്യാറാക്കിയ ക്വട്ടേഷനിൽ ഫോളോ-അപ്പ് ചെയ്യുകയോ മറ്റൊരാൾക്ക് കൈമാറുകയോ ചെയ്യാം.",
    "ഓരോ എൻക്വയറിയും എവിടെ നിന്ന് വന്നു എന്ന് (വെബ്സൈറ്റ്, ഗൂഗിൾ, റഫറൽ തുടങ്ങിയവ) ഇപ്പോൾ രേഖപ്പെടുത്തുന്നു.",
    "Next step-ൽ നിന്ന് ക്വട്ടേഷൻ മനുവിന് കൈമാറാം; അവസാന തീയതിയും ഓർമ്മപ്പെടുത്തലും ഉണ്ടാകും." ] },
  { name: "Jayaprakash", ml: "ജയപ്രകാശ്", email: "service@flaretechnical.com", personal: [
    "കണക്ഷൻ, ഡിസ്കണക്ഷൻ എന്നിവയ്ക്ക് സർവീസ് റിക്വസ്റ്റ് നമ്പർ സ്വയം ലഭിക്കും (ഉദാഹരണം SR-2026-NOV-0001).",
    "എൻക്വയറികൾ, FSM ഷെഡ്യൂൾ, ഇൻവോയ്സ് അല്ലെങ്കിൽ പേയ്മെന്റ് ലിങ്ക്, കോളുകൾ എന്നിവ ബിൽഡിങ് അനുസരിച്ച് രേഖപ്പെടുത്താം.",
    "Next step-ൽ നിന്ന് ആദ്യത്തെ ബിൽ ഫ്ലെക്സിക്ക് കൈമാറാം." ] },
];

export function buildMalayalamEmail(r: (typeof ML_RECIPIENTS)[number]): { subject: string; html: string } {
  const html = `<div style="font-family:'Noto Sans Malayalam','Kartika','Nirmala UI',Arial,sans-serif;font-size:15px;line-height:1.7;color:#1b1f27;max-width:640px">
<p>പ്രിയ ${r.ml},</p>
<p>OWN IT പുതുക്കിയിരിക്കുന്നു. നിങ്ങൾക്ക് എന്തെല്ലാം പുതിയതാണ്, നിങ്ങളുടെ KPI ഇപ്പോൾ എങ്ങനെ കണക്കാക്കുന്നു, രഹസ്യ വിവരങ്ങൾ എങ്ങനെ കൈകാര്യം ചെയ്യുന്നു എന്നിവ ഈ കുറിപ്പിൽ വിശദീകരിക്കുന്നു.</p>
${h("നിങ്ങൾക്കുള്ള പുതിയ കാര്യങ്ങൾ")}
<ul style="padding-left:20px;margin:0">${li(r.personal)}</ul>
${h("എല്ലാവർക്കുമുള്ള പുതിയ കാര്യങ്ങൾ")}
<ul style="padding-left:20px;margin:0">${li([
  "പുതിയ രൂപം; നിങ്ങളുടെ ഫോട്ടോയും കമ്പനിയുടെ നിറങ്ങളും.",
  "My Tasks ഇപ്പോൾ ഒരു ഹോം പാനലോടെ തുറക്കുന്നു: ഇന്ന് നിങ്ങൾ ചെയ്യേണ്ടവ, ജോലി രേഖപ്പെടുത്താനുള്ള എളുപ്പ ലിങ്കുകൾ, തത്സമയ സംഖ്യകൾ.",
  "ഫോമുകളിൽ മിക്കതും ഡ്രോപ്പ്ഡൗൺ ആണ്. സംഖ്യകൾ, റഫറൻസ് നമ്പറുകൾ, പുറത്തുള്ളവരുടെ പേരുകൾ, ലിങ്കുകൾ എന്നിവ മാത്രം ടൈപ്പ് ചെയ്താൽ മതി.",
  "Next step ഉപയോഗിച്ച് ഒരു സഹപ്രവർത്തകന് ജോലി കൈമാറാം; അവസാന തീയതിയും ഓർമ്മപ്പെടുത്തലും ഉണ്ടാകും.",
  "പട്ടികയിൽ എന്തെങ്കിലും ഇല്ലെങ്കിൽ “Other task” ഉപയോഗിച്ച് ഞങ്ങളെ അറിയിക്കുക; ഞങ്ങൾ ചേർക്കാം.",
])}</ul>
${h("ഒന്നും നീക്കം ചെയ്തിട്ടില്ല")}
<p style="margin:0">നിങ്ങളുടെ നിലവിലുള്ള ടാസ്കുകൾ, ചരിത്രം, KPI എന്നിവ പഴയതുപോലെ തന്നെയുണ്ട്. ഇനി അവയിൽ കൂട്ടിച്ചേർക്കലുകളും മെച്ചപ്പെടുത്തലുകളും മാത്രമേ ഉണ്ടാകൂ.</p>
${h("നിങ്ങളുടെ KPI ഇപ്പോൾ എങ്ങനെ കണക്കാക്കുന്നു")}
<ul style="padding-left:20px;margin:0">${li([
  "ഓരോ KPI-ക്കും 0 മുതൽ 100 വരെ സ്കോർ ലഭിക്കും. നിങ്ങളുടെ യഥാർത്ഥ ഫലത്തെ ലക്ഷ്യം (target) കൊണ്ട് ഹരിച്ചതാണ് ഇത്. പൂർത്തിയാക്കാൻ എടുക്കുന്ന ദിവസങ്ങൾ പോലുള്ള വേഗതയുടെ KPI-കളിൽ, ലക്ഷ്യത്തെ നിങ്ങളുടെ യഥാർത്ഥ ഫലം കൊണ്ട് ഹരിക്കുന്നു.",
  "നിങ്ങളുടെ സ്കോർ നിങ്ങളുടെ KPI-കളുടെ ശരാശരിയാണ്.",
  "ഒരു കമ്പനിയുടെ സ്കോർ അതിലെ ജീവനക്കാരുടെ ശരാശരിയാണ്; ഓരോ കമ്പനിയും സ്വന്തം ലക്ഷ്യങ്ങളുമായാണ് വിലയിരുത്തപ്പെടുന്നത്.",
  "ലക്ഷ്യങ്ങൾ ഇതുവരെ നിശ്ചയിച്ചിട്ടില്ല. നിങ്ങൾ കാണുന്ന സംഖ്യകൾ താൽക്കാലികവും റഫറൻസിനു മാത്രവുമാണ്. വേണ്ടത്ര യഥാർത്ഥ വിവരങ്ങൾ ലഭിക്കുന്നതുവരെ നിങ്ങളുടെ KPI-കൾ നിങ്ങൾ യഥാർത്ഥത്തിൽ ചെയ്യുന്നത് മാത്രം കാണിക്കും. ജനുവരി മുതൽ, ആ വിവരങ്ങളുടെ അടിസ്ഥാനത്തിൽ ലക്ഷ്യങ്ങൾ നിശ്ചയിക്കും.",
])}</ul>
${h("രഹസ്യ വിവരങ്ങൾ")}
<p style="margin:0">നിങ്ങൾ നൽകുന്ന രഹസ്യ വിവരങ്ങൾ, അതായത് കണക്കുകൾ, തുകകൾ, എമിറേറ്റ്സ് ഐഡി, വിസ പകർപ്പുകൾ ഉൾപ്പെടെയുള്ള രേഖകൾ എന്നിവ നിങ്ങൾക്കും കമ്പനി മാനേജ്മെന്റിനും മാത്രമുള്ളതാണ്. അത്തരം രേഖ ലിങ്ക് ആയി ചേർക്കുകയാണെങ്കിൽ, അതിന്റെ ഷെയറിംഗ് പേര് നൽകിയ ആളുകൾക്ക് മാത്രമായി നൽകുക.</p>
${h("ഞങ്ങൾ നിങ്ങളോട് ആവശ്യപ്പെടുന്നത്")}
<ul style="padding-left:20px;margin:0">${li([
  "അന്നന്നുതന്നെ ജോലി ഡ്രോപ്പ്ഡൗണുകൾ ഉപയോഗിച്ച് രേഖപ്പെടുത്തുക.",
  "ഒരു കാര്യം പൂർത്തിയാകുമ്പോൾ, ഉദാഹരണത്തിന് പേയ്മെന്റ് ലഭിക്കുമ്പോൾ, അത് രേഖപ്പെടുത്തുക; അപ്പോൾ മാത്രമേ സംഖ്യകൾ ശരിയായിരിക്കൂ.",
  "എന്തെങ്കിലും ഇല്ലാത്തതോ ബുദ്ധിമുട്ടുള്ളതോ ആയി തോന്നിയാൽ ഞങ്ങളെ അറിയിക്കുക.",
])}</ul>
<p style="margin-top:20px"><a href="https://ownit-uae.vercel.app">ownit-uae.vercel.app</a> വഴി സൈൻ ഇൻ ചെയ്യുക.</p>
<p>നന്ദി,<br>OWN IT · മാനേജ്മെന്റ്</p>
</div>`;
  return { subject: "OWN IT-ലെ പുതിയ മാറ്റങ്ങളും KPI ഇപ്പോൾ എങ്ങനെ പ്രവർത്തിക്കുന്നു എന്നതും", html };
}
