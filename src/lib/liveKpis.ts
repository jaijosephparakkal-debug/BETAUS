import { prisma } from "@/lib/db";
import { inMonth, monthRange } from "@/lib/gnDepartments";

/**
 * Live monthly KPIs, counted from what each person logs in their work-log form (nothing typed by hand).
 * Gas Needs: Antony, Manu, Jintu. Flaretech project team: Ram, Jiyad, Jashim, Saroj, Simi.
 * No targets yet: the first month is the baseline, targets are set from the month after.
 */
export type LiveKpi = {
  label: string;
  value: number | null;
  unit?: "%" | "days" | "AED";
  /** For "days to …" and "unpaid" counts. */
  lowerIsBetter?: boolean;
  /** AED figures: only the person, Abraham and Jai. */
  private?: boolean;
  /** Not a monthly figure: the position right now (shown without last month). */
  live?: boolean;
  hint: string;
};
type Range = { start: Date; end: Date };
type D = Record<string, unknown>;

const DAY = 86400000;
const WON = ["ORDER_RECEIVED", "DELIVERED", "PAID"];
const det = (x: unknown): D => (x && typeof x === "object" ? (x as D) : {});
const str = (x: unknown) => (typeof x === "string" ? x : "");
const num = (x: unknown) => (typeof x === "number" ? x : 0);
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null);
const dateOnly = (d: Date) => new Date(d.getTime() + 4 * 3600 * 1000).toISOString().slice(0, 10);

export const LIVE_KPI_EMAILS = [
  "sales@gasneeds.com",
  "business@gasneeds.com",
  "accounts@gasneeds.com",
  "ram@flaretechnical.com",
  "jiyad.m@flaretechnical.com",
  "jashim@flaretechnical.com",
  "saroj@flaretechnical.com",
  "simi@flaretechnical.com",
];

async function logs(ids: string[], kinds: string[], r: Range) {
  return prisma.task.findMany({
    where: { assignedToId: { in: ids }, logKind: { in: kinds }, ...inMonth(r.start, r.end) },
    select: { id: true, logKind: true, eventAt: true, completedAt: true, createdAt: true, status: true, forPerson: true, details: true, quotationId: true },
  });
}
const when = (t: { eventAt: Date | null; completedAt: Date | null; createdAt: Date }) => t.eventAt ?? t.completedAt ?? t.createdAt;
const count = (rows: { logKind: string | null }[], kind: string) => rows.filter((t) => t.logKind === kind).length;

async function compute(email: string, ids: string[], r: Range): Promise<LiveKpi[]> {
  const now = new Date();
  switch (email) {
    case "sales@gasneeds.com": {
      const sent = await prisma.quotation.count({ where: { createdById: { in: ids }, createdAt: { gte: r.start, lt: r.end } } });
      const decided = await prisma.quotation.findMany({
        where: { createdById: { in: ids }, status: { in: [...WON, "NOT_AWARDED"] }, updatedAt: { gte: r.start, lt: r.end } },
        select: { status: true },
      });
      const won = decided.filter((q) => WON.includes(q.status)).length;
      const due = await prisma.task.findMany({
        where: { assignedToId: { in: ids }, logKind: "FOLLOW_UP", followUpAt: { gte: r.start, lt: r.end < now ? r.end : now } },
        select: { status: true, completedAt: true, followUpAt: true },
      });
      const onTime = due.filter((t) => t.status === "COMPLETED" && t.completedAt && t.completedAt.getTime() <= t.followUpAt!.getTime() + DAY).length;
      const l = await logs(ids, ["VISIT", "PRO"], r);
      return [
        { label: "Quotations sent", value: sent, hint: "Quotations made in the form this month" },
        { label: "Orders won", value: won, hint: "Quotations moved to order received, delivered or paid" },
        { label: "Win rate", value: pct(won, decided.length), unit: "%", hint: "Orders won ÷ quotations decided (won or not awarded) this month" },
        { label: "Follow-ups on time", value: pct(onTime, due.length), unit: "%", hint: "Follow-ups done by their due date (one day's grace)" },
        { label: "Customer visits", value: count(l, "VISIT"), hint: "Customer visits logged" },
        { label: "PRO jobs", value: count(l, "PRO"), hint: "PRO and government work logged" },
      ];
    }
    case "business@gasneeds.com": {
      const l = await logs(ids, ["PURCHASE_ORDER", "IMPORT", "ENQUIRY"], r);
      const pos = l.filter((t) => t.logKind === "PURCHASE_ORDER");
      // Days from the sales hand-over to the PO, for POs that name their quotation.
      const days: number[] = [];
      for (const po of pos) {
        const qn = str(det(po.details).quotationNumber);
        if (!qn) continue;
        const h = await prisma.task.findFirst({ where: { assignedToId: { in: ids }, logKind: "HANDOVER", quotation: { number: qn } }, orderBy: { createdAt: "asc" }, select: { createdAt: true } });
        if (h) days.push(Math.max(0, (when(po).getTime() - h.createdAt.getTime()) / DAY));
      }
      // Deliveries on time: delivered on or before the ETA given for that shipment.
      const delivered = l.filter((t) => t.logKind === "IMPORT" && str(det(t.details).stage) === "Delivered");
      let known = 0;
      let onTime = 0;
      for (const t of delivered) {
        let eta = str(det(t.details).eta);
        const ref = str(det(t.details).reference);
        if (!eta && ref) {
          const earlier = await prisma.task.findFirst({ where: { assignedToId: { in: ids }, logKind: "IMPORT", details: { path: ["reference"], equals: ref }, eventAt: { lt: when(t) } }, orderBy: { eventAt: "desc" }, select: { details: true } });
          eta = str(det(earlier?.details).eta);
        }
        if (!eta) continue;
        known++;
        if (dateOnly(when(t)) <= eta) onTime++;
      }
      const enq = l.filter((t) => t.logKind === "ENQUIRY");
      const converted = enq.filter((t) => str(det(t.details).status) === "Converted to a quotation").length;
      return [
        { label: "POs raised", value: pos.length, hint: "Purchase orders logged" },
        { label: "Days from hand-over to PO", value: avg(days), unit: "days", lowerIsBetter: true, hint: "Average days from Antony's hand-over to the PO (POs that name their quotation)" },
        { label: "Deliveries on time", value: pct(onTime, known), unit: "%", hint: "Delivered on or before the ETA logged for that shipment" },
        { label: "Deliveries completed", value: delivered.length, hint: "Shipments marked delivered" },
        { label: "Enquiries handled", value: enq.length, hint: "Enquiry entries logged" },
        { label: "Enquiries turned into quotations", value: pct(converted, enq.length), unit: "%", hint: "Enquiry entries marked converted ÷ all enquiry entries" },
      ];
    }
    case "accounts@gasneeds.com": {
      const l = await logs(ids, ["PAYMENT_RECEIVED", "PAYMENT_FOLLOW_UP", "CASH_CHEQUE", "ACCOUNTS_ENTRY"], r);
      const rec = l.filter((t) => t.logKind === "PAYMENT_RECEIVED");
      // Promised dates in this month that have passed: kept when a payment from them came in by that date.
      const promised = l.filter((t) => t.logKind === "PAYMENT_FOLLOW_UP" && str(det(t.details).promisedOn) && str(det(t.details).promisedOn) <= dateOnly(now));
      const allRec = await prisma.task.findMany({ where: { assignedToId: { in: ids }, logKind: "PAYMENT_RECEIVED" }, select: { eventAt: true, forPerson: true, details: true } });
      const kept = promised.filter((p) => {
        const by = str(det(p.details).promisedOn);
        const qn = str(det(p.details).quotationNumber);
        return allRec.some((x) => x.eventAt && x.eventAt >= when(p) && dateOnly(x.eventAt) <= by && ((qn && str(det(x.details).quotationNumber) === qn) || (!!p.forPerson && x.forPerson === p.forPerson)));
      }).length;
      // Days from the hand-over for payment to the full payment.
      const days: number[] = [];
      for (const t of rec.filter((x) => str(det(x.details).paymentType) === "Full payment")) {
        const qn = str(det(t.details).quotationNumber);
        if (!qn) continue;
        const h = await prisma.task.findFirst({ where: { assignedToId: { in: ids }, logKind: "HANDOVER", quotation: { number: qn } }, orderBy: { createdAt: "asc" }, select: { createdAt: true } });
        if (h) days.push(Math.max(0, (when(t).getTime() - h.createdAt.getTime()) / DAY));
      }
      const old = await prisma.quotation.count({ where: { status: "DELIVERED", updatedAt: { lt: new Date(now.getTime() - 30 * DAY) } } });
      return [
        { label: "Collected", value: rec.reduce((s, t) => s + num(det(t.details).amount), 0), unit: "AED", private: true, hint: "Payments received this month" },
        { label: "Payments received", value: rec.length, hint: "Payment received entries" },
        { label: "Promised dates kept", value: pct(kept, promised.length), unit: "%", hint: "Customers who paid by the date they promised" },
        { label: "Days from delivery to payment", value: avg(days), unit: "days", lowerIsBetter: true, hint: "Average days from the hand-over for payment to the full payment" },
        { label: "Unpaid over 30 days", value: old, lowerIsBetter: true, live: true, hint: "Delivered quotations still unpaid after 30 days (right now)" },
        { label: "Cheques, bank and book entries", value: count(l, "CASH_CHEQUE") + count(l, "ACCOUNTS_ENTRY"), hint: "Cheque, cash and accounts entries logged" },
      ];
    }
    case "ram@flaretechnical.com": {
      const l = await logs(ids, ["PROJECT_INSPECTION", "PROJECT_MEETING", "PROJECT_PAYMENT", "PROJECT_DOCUMENT", "PROJECT_COMMUNICATION"], r);
      const insp = l.filter((t) => t.logKind === "PROJECT_INSPECTION");
      const passed = insp.filter((t) => str(det(t.details).result).startsWith("Passed")).length;
      const rejected = insp.filter((t) => str(det(t.details).result) === "Rejected").length;
      const pay = l.filter((t) => t.logKind === "PROJECT_PAYMENT");
      return [
        { label: "Inspection pass rate", value: pct(passed, passed + rejected), unit: "%", hint: "Inspections passed ÷ inspections with a result (passed or rejected)" },
        { label: "Inspections and WIRs", value: insp.length, hint: "Inspection and WIR entries" },
        { label: "Documents submitted", value: count(l, "PROJECT_DOCUMENT"), hint: "GOC, completion and handover document submissions" },
        { label: "Meetings and site visits", value: count(l, "PROJECT_MEETING"), hint: "Meetings and site visits logged" },
        { label: "Payment follow-ups", value: pay.length, hint: "Payment and invoice entries" },
        { label: "Payments received", value: pay.filter((t) => str(det(t.details).action) === "Payment received").reduce((s, t) => s + num(det(t.details).amount), 0), unit: "AED", private: true, hint: "Amounts logged as payment received" },
        { label: "Calls, emails and messages", value: count(l, "PROJECT_COMMUNICATION"), hint: "Calls, emails and messages logged" },
      ];
    }
    case "jiyad.m@flaretechnical.com": {
      const l = await logs(ids, ["SITE_UPDATE", "SITE_INSPECTION", "SITE_MEETING", "PROJECT_COMMUNICATION"], r);
      const up = l.filter((t) => t.logKind === "SITE_UPDATE");
      const moved = up.reduce((s, t) => s + Math.max(0, num(det(t.details).progress) - num(det(t.details).progressBefore)), 0);
      const done = up.filter((t) => str(det(t.details).work) === "Completed").length;
      const days = new Set(up.map((t) => dateOnly(when(t)))).size;
      const insp = l.filter((t) => t.logKind === "SITE_INSPECTION");
      const passed = insp.filter((t) => str(det(t.details).result).startsWith("Passed")).length;
      const rejected = insp.filter((t) => str(det(t.details).result) === "Rejected").length;
      return [
        { label: "Site tasks completed", value: done, hint: "Site tasks taken to 100%" },
        { label: "Progress moved", value: moved, unit: "%", hint: "Total percentage points added across site tasks" },
        { label: "Days with a site update", value: days, hint: "Days with at least one site work update" },
        { label: "Inspections", value: insp.length, hint: "Inspection entries (raised, done, certificates)" },
        { label: "Inspection pass rate", value: pct(passed, passed + rejected), unit: "%", hint: "Passed ÷ inspections with a result" },
        { label: "Site and consultant meetings", value: count(l, "SITE_MEETING"), hint: "Meetings logged" },
        { label: "Calls, emails and messages", value: count(l, "PROJECT_COMMUNICATION"), hint: "Calls, emails and messages logged" },
      ];
    }
    case "jashim@flaretechnical.com": {
      const l = await logs(ids, ["DESIGN", "DESIGN_REVISION", "SUBMITTAL", "QUANTITY_TAKEOFF", "PROJECT_COMMUNICATION"], r);
      const approved = l.filter((t) => ["DESIGN", "DESIGN_REVISION", "SUBMITTAL"].includes(t.logKind!) && str(det(t.details).status).startsWith("Approved"));
      const firstTime = approved.filter((t) => str(det(t.details).rev) === "Rev 0").length;
      const withDue = l.filter((t) => t.logKind === "DESIGN" && str(det(t.details).dueOn) && str(det(t.details).status) !== "In progress");
      const onTime = withDue.filter((t) => dateOnly(when(t)) <= str(det(t.details).dueOn)).length;
      return [
        { label: "Drawings and designs", value: count(l, "DESIGN"), hint: "Design and drawing entries" },
        { label: "Approved", value: approved.length, hint: "Drawings, revisions and submittals approved" },
        { label: "Approved first time", value: pct(firstTime, approved.length), unit: "%", hint: "Approvals at Rev 0 ÷ all approvals" },
        { label: "Delivered on time", value: pct(onTime, withDue.length), unit: "%", hint: "Designs sent by their due date (where a due date was given)" },
        { label: "Revisions", value: count(l, "DESIGN_REVISION"), lowerIsBetter: true, hint: "Drawing revisions logged" },
        { label: "Submittals", value: count(l, "SUBMITTAL"), hint: "Submittals logged" },
        { label: "Quantity take-offs", value: count(l, "QUANTITY_TAKEOFF"), hint: "Take-offs logged" },
      ];
    }
    case "saroj@flaretechnical.com": {
      const l = await logs(ids, ["ESTIMATE", "PROJECT_QUOTATION", "ESTIMATION_SITE_VISIT", "PROJECT_COMMUNICATION"], r);
      const newEst = l.filter((t) => t.logKind === "ESTIMATE" && det(t.details).newEstimate === true);
      const quotes = l.filter((t) => t.logKind === "PROJECT_QUOTATION");
      const sentNos = new Set(quotes.filter((t) => ["Quotation prepared", "Quotation sent"].includes(str(det(t.details).type))).map((t) => str(det(t.details).estimateNumber)));
      const awarded = new Set(quotes.filter((t) => str(det(t.details).status) === "Awarded").map((t) => str(det(t.details).estimateNumber)));
      const lost = new Set(quotes.filter((t) => str(det(t.details).status) === "Not awarded").map((t) => str(det(t.details).estimateNumber)));
      // Days from the estimate to its first quotation.
      const days: number[] = [];
      for (const n of Array.from(sentNos)) {
        if (!n) continue;
        const est = await prisma.task.findFirst({ where: { assignedToId: { in: ids }, logKind: "ESTIMATE", details: { path: ["estimateNumber"], equals: n } }, orderBy: { eventAt: "asc" }, select: { eventAt: true } });
        const q = quotes.filter((t) => str(det(t.details).estimateNumber) === n).sort((a, b) => when(a).getTime() - when(b).getTime())[0];
        if (est?.eventAt && q) days.push(Math.max(0, (when(q).getTime() - est.eventAt.getTime()) / DAY));
      }
      return [
        { label: "Estimates prepared", value: newEst.length, hint: "New estimation numbers given" },
        { label: "Quotations sent", value: sentNos.size, hint: "Estimation numbers quoted this month" },
        { label: "Days from estimate to quotation", value: avg(days), unit: "days", lowerIsBetter: true, hint: "Average days from the estimate to its first quotation" },
        { label: "Win rate", value: pct(awarded.size, awarded.size + lost.size), unit: "%", hint: "Awarded ÷ (awarded + not awarded) this month" },
        { label: "Site visits", value: count(l, "ESTIMATION_SITE_VISIT"), hint: "Site visits and measurements" },
        { label: "Calls, emails and messages", value: count(l, "PROJECT_COMMUNICATION"), hint: "Calls, emails and messages logged" },
      ];
    }
    case "simi@flaretechnical.com": {
      const l = await logs(ids, ["PROJECT_COST", "PROJECT_INVOICE", "PROJECT_REPORT", "LABOUR_COUNT", "TIMESHEET", "PROJECT_COMMUNICATION"], r);
      const costs = l.filter((t) => t.logKind === "PROJECT_COST");
      return [
        { label: "Cost entries", value: costs.length, hint: "Material and site cost entries" },
        { label: "Costs logged", value: costs.reduce((s, t) => s + num(det(t.details).amount), 0), unit: "AED", private: true, hint: "Total of the cost entries" },
        { label: "Invoices and Zoho entries", value: count(l, "PROJECT_INVOICE"), hint: "Invoice, Zoho, invoice summary and security cheque entries" },
        { label: "Reports and documents", value: count(l, "PROJECT_REPORT"), hint: "Reports and documents logged" },
        { label: "Labour counts", value: count(l, "LABOUR_COUNT"), hint: "Labour counts at site logged" },
        { label: "Timesheets", value: count(l, "TIMESHEET"), hint: "Timesheets prepared or sent" },
        { label: "Calls, emails and messages", value: count(l, "PROJECT_COMMUNICATION"), hint: "Calls, emails and messages logged" },
      ];
    }
  }
  return [];
}

/** This month and last month for one person, matched by label. */
export async function getLiveKpis(userId: string, monthKey?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { memberships: { select: { id: true } } } });
  if (!user) return null;
  const email = user.email.toLowerCase();
  if (!LIVE_KPI_EMAILS.includes(email)) return null;
  const ids = user.memberships.map((m) => m.id);
  const month = monthRange(monthKey);
  const prev = monthRange(month.prev);
  const [cur, last] = await Promise.all([compute(email, ids, month), compute(email, ids, prev)]);
  return {
    month,
    prevLabel: prev.label,
    email,
    items: cur.map((k) => ({ ...k, last: k.live ? null : last.find((x) => x.label === k.label)?.value ?? null })),
  };
}

const AMOUNT_VIEWERS = ["abraham@flaretechnical.com", "jai@gasneeds.com"];
/** AED KPIs: the person themselves, Abraham and Jai. */
export const canSeePrivateKpis = (viewerEmail: string, ownerEmail: string) =>
  viewerEmail.toLowerCase() === ownerEmail.toLowerCase() || AMOUNT_VIEWERS.includes(viewerEmail.toLowerCase());
