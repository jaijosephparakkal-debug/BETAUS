"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { cleanLink } from "@/lib/links";
import { PROFILES, BACKDATE_DAYS, QUOTE_STATUS, statusLabel, GENERIC } from "@/lib/logOptions";
import { dubaiInputToDate, createQuotationNumbered, createHandOver, DUBAI_MS, nextRunning, createMaintenanceHandOver, createFinanceHandOver, MONTHS } from "@/lib/quotations";

export type LogState = { error?: string; needsConfirm?: boolean; ok?: string };

const DEPT: Record<string, string> = { q: "Sales", f: "Sales", v: "Sales", pro: "PRO", hr: "HR", enq: "Purchase", po: "Purchase", imp: "Purchase", pr: "Accounts", pm: "Accounts", pf: "Accounts", cc: "Accounts", ac: "Accounts" };
const KIND_CODE: Record<string, string> = { q: "QUOTATION", f: "FOLLOW_UP", v: "VISIT", pro: "PRO", hr: "HR", enq: "ENQUIRY", po: "PURCHASE_ORDER", imp: "IMPORT", pr: "PAYMENT_RECEIVED", pm: "PAYMENT_MADE", pf: "PAYMENT_FOLLOW_UP", cc: "CASH_CHEQUE", ac: "ACCOUNTS_ENTRY" };

type Fd = (k: string) => string;

/** One structured work-log entry: who, when it happened, what was discussed, the outcome and the next step. */
export async function createLogEntryAction(_prev: LogState | undefined, formData: FormData): Promise<LogState> {
  const m = await getCurrentMembership();
  if (!m) return { error: "Not signed in." };
  const profile = PROFILES[m.user.email.toLowerCase()];
  if (!profile) return { error: "This form is not set up for you." };
  const s: Fd = (k) => String(formData.get(k) || "").trim();

  const kind = s("kind");
  if (!profile.kinds.some((k) => k.v === kind)) return { error: "Choose the kind of work." };

  const slug = s("company");
  if (!profile.companies.includes(slug)) return { error: "Choose the company you are working for." };
  const company = await prisma.company.findUnique({ where: { slug } });
  if (!company) return { error: "Choose the company you are working for." };

  // When it happened (Dubai time). Back-dating is allowed; it is always shown as "entered later", and older than a week needs a reason.
  const whenRaw = s("eventAt");
  if (!whenRaw) return { error: "Choose when it happened." };
  const eventAt = dubaiInputToDate(whenRaw);
  const now = new Date();
  if (isNaN(eventAt.getTime())) return { error: "That date and time is not valid." };
  if (eventAt.getTime() > now.getTime() + 10 * 60 * 1000) return { error: "That time is in the future." };
  const lag = now.getTime() - eventAt.getTime();
  const enteredLater = lag > 15 * 60 * 1000;
  let backdateReason: string | null = null;
  if (lag > BACKDATE_DAYS * 86400000) {
    const r = s("reason");
    if (!r) return { error: `That is more than ${BACKDATE_DAYS} days ago. Choose why it is being entered late.` };
    backdateReason = r === "Other" ? s("reasonText") || "Other" : r;
  } else if (s("reason")) backdateReason = s("reason");

  let discussed: { key: string; label: string; option: string; detail: string }[] = [];
  try {
    const parsed = JSON.parse(s("discussed") || "[]");
    if (Array.isArray(parsed)) discussed = parsed.slice(0, 12);
  } catch {
    discussed = [];
  }

  type Cust = { id: string; name: string };
  type Quote = { id: string; number: string; customerId: string; product: string; value: number | null; status: string };
  let customer: Cust | null = null;
  let quotation: Quote | null = null;

  const pickCustomer = async (): Promise<Cust | string> => {
    const cid = s("customerId");
    if (cid === "__new__") {
      const name = s("newCustomer");
      if (!name) return "Type the new customer’s name.";
      return prisma.customer.upsert({ where: { companyId_name: { companyId: company.id, name } }, update: {}, create: { companyId: company.id, name } });
    }
    const c = cid ? await prisma.customer.findFirst({ where: { id: cid, companyId: company.id } }) : null;
    return c ?? "Choose the customer.";
  };
  const pickSupplier = async (): Promise<Cust | string> => {
    const sid = s("supplierId");
    if (sid === "__new__") {
      const name = s("newSupplier");
      if (!name) return "Type the new supplier’s name.";
      return prisma.supplier.upsert({ where: { companyId_name: { companyId: company.id, name } }, update: {}, create: { companyId: company.id, name } });
    }
    const x = sid ? await prisma.supplier.findFirst({ where: { id: sid, companyId: company.id } }) : null;
    return x ?? "Choose the supplier.";
  };
  const loadQuote = async (id: string): Promise<Quote | null> => {
    const q = id ? await prisma.quotation.findUnique({ where: { id }, include: { customer: true } }) : null;
    if (q) customer = q.customer;
    return q;
  };

  // "Earlier quotation" (raised before the system): bring it in once under its own number, reuse it next time.
  let oldQuoteId: string | null = null;
  if (s("quotationId") === "__old__") {
    const num = s("oldNumber");
    if (!num) return { error: "Type the earlier quotation’s number." };
    const found = await prisma.quotation.findUnique({ where: { number: num } });
    if (found) {
      if (found.companyId !== company.id) return { error: `${num} belongs to the other company.` };
      oldQuoteId = found.id;
    } else {
      const c = await pickCustomer();
      if (typeof c === "string") return { error: c };
      const val = Number(s("oldValue").replace(/,/g, ""));
      const d = new Date(Date.now() + 4 * 3600 * 1000);
      const made = await prisma.quotation.create({
        data: { companyId: company.id, number: num, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, seq: null, customerId: c.id, productCategory: "Earlier quotation", product: "Raised before the system", value: val > 0 ? val : null, status: "SENT", legacy: true, createdById: m.id },
      });
      oldQuoteId = made.id;
    }
  }
  const qid = () => oldQuoteId ?? s("quotationId");

  const amountOf = (k: string) => Number(s(k).replace(/,/g, ""));
  let title = "";
  let forPerson = "";
  let summary = "";
  let docUrl: string | null = null;
  const contactName = s("contact");
  const details: Record<string, unknown> = { discussed, outcome: s("outcome"), contact: contactName || null };
  const aed = (n: number) => `AED ${n.toLocaleString("en-US")}`;

  if (kind === "q" || kind === "v" || kind === "enq" || kind === "pr") {
    if (kind === "pr" && qid()) {
      quotation = await loadQuote(qid());
      if (!quotation) return { error: "That quotation was not found." };
    } else {
      const c = await pickCustomer();
      if (typeof c === "string") return { error: c };
      customer = c;
    }
  }
  // A follow-up can be about a quotation or about anything else (topic + who it was with).
  const followOther = (kind === "f" || kind === "pf") && s("followAbout") === "other";
  let followWho = "";
  if (followOther) {
    const w = s("followWith");
    if (w === "supplier") {
      const sup = await pickSupplier();
      if (typeof sup === "string") return { error: sup };
      followWho = sup.name;
    } else if (w === "someone") {
      followWho = s("followWho");
      if (!followWho) return { error: "Write who the follow-up was with." };
    } else {
      const c = await pickCustomer();
      if (typeof c === "string") return { error: c };
      customer = c;
      followWho = c.name;
    }
  }
  if ((kind === "f" || kind === "pf") && !followOther) {
    if (!qid()) return { error: "Choose which quotation this is about." };
    quotation = await loadQuote(qid());
    if (!quotation) return { error: "That quotation was not found." };
  }
  if (customer && contactName) {
    const c: Cust = customer;
    await prisma.contact.upsert({
      where: { customerId_name: { customerId: c.id, name: contactName } },
      update: {},
      create: { customerId: c.id, name: contactName },
    });
  }

  let parentOverride = "";
  let mdKind: { code: string; dept: string } | null = null;
  let mdRef = "";
  if (GENERIC[kind]) {
    // Maintenance kinds: a building and unit (flat, kitchen, shop…) plus the fields listed for the kind.
    const g = GENERIC[kind];
    mdKind = { code: g.code, dept: g.dept };
    const vals: Record<string, string> = {};
    for (const f of g.fields) {
      if (f.t === "customer") {
        const c = await pickCustomer();
        if (typeof c === "string") return { error: c };
        vals[f.n] = c.name;
        continue;
      }
      if (f.t === "supplier") {
        const x = await pickSupplier();
        if (typeof x === "string") return { error: x };
        vals[f.n] = x.name;
        continue;
      }
      if ((f.t === "staff" || f.t === "project") && !f.req && !s(f.n)) {
        vals[f.n] = "";
        continue;
      }
      if (f.t === "staff") {
        const e = await prisma.employee.findFirst({ where: { name: s(f.n) }, select: { id: true } });
        if (!e) return { error: `${f.l}: choose from the staff directory.` };
        vals[f.n] = s(f.n);
        continue;
      }
      if (f.t === "project") {
        const pr = await prisma.project.findUnique({ where: { id: s(f.n) }, select: { name: true, number: true } });
        if (!pr) return { error: `${f.l}: choose the project.` };
        vals[f.n] = `${pr.name}${pr.number ? ` (${pr.number})` : ""}`;
        continue;
      }
      vals[f.n] = s(f.n);
    }
    if (vals.link) {
      const l = cleanLink(vals.link);
      if (!l) return { error: "That link does not look right. Paste the full web address." };
      vals.link = l;
    }
    if (g.parentFrom && vals[g.parentFrom]) parentOverride = vals[g.parentFrom];
    for (const f of g.fields) if (f.req && !vals[f.n]) return { error: `${f.l}: fill this in.` };
    let building: { id: string; name: string; code: string | null } | null = null;
    if (g.building) {
      const bid = s("buildingId");
      building = bid ? await prisma.building.findUnique({ where: { id: bid } }) : null;
      if (!building && g.building === "req") return { error: "Choose the building." };
    }
    const unitType = s("unitType");
    let unitLabel = "";
    let tenant = "";
    if (building && unitType && unitType !== "Whole building") {
      const uid = s("unitId");
      if (unitType === "Apartment" && uid && uid !== "__typed__") {
        const u = await prisma.unit.findFirst({ where: { id: uid, buildingId: building.id } });
        if (u) { unitLabel = u.flat; tenant = u.tenantName ?? ""; }
      } else {
        unitLabel = s("unitText");
        if (!unitLabel) return { error: `Type the ${unitType.toLowerCase()} number.` };
      }
    }
    const dubai = new Date(eventAt.getTime() + DUBAI_MS);
    let srNo = "";
    if (kind === "sr") {
      srNo = vals.srNo || (await nextRunning(`SR-${dubai.getUTCFullYear()}-${dubai.getUTCMonth() + 1}`, (n) => `SR-${dubai.getUTCFullYear()}-${MONTHS[dubai.getUTCMonth()]}-${String(n).padStart(4, "0")}`));
      vals.srNo = srNo;
    }
    title = g.title(vals);
    forPerson = tenant || building?.name || vals.site || "";
    const where = building ? `${building.code ? `${building.code} ` : ""}${building.name}${unitType && unitType !== "Whole building" ? ` · ${unitType} ${unitLabel}` : ""}${tenant ? ` · ${tenant}` : ""}` : "";
    const parts = g.fields.filter((f) => vals[f.n] && f.n !== "srNo").map((f) => `${f.l}: ${vals[f.n]}`);
    summary = [srNo, where, ...parts].filter(Boolean).join(" · ");
    mdRef = srNo || where || vals.site || title;
    Object.assign(details, { ...vals, building: building?.name ?? null, unitType: unitType || null, unit: unitLabel || null, tenant: tenant || null });
  } else if (kind === "q") {
    const category = s("productCategory");
    let product = s("product");
    if (category === "Other product") product = s("productOther");
    if (!category || !product) return { error: "Choose the product." };
    const value = amountOf("value");
    if (!value || value <= 0) return { error: "Enter the quotation value in AED." };
    const status = s("status") || "SENT";
    if (!QUOTE_STATUS.some((x) => x.v === status)) return { error: "Choose where the quotation stands." };
    const rawDoc = s("docUrl");
    if (rawDoc) {
      docUrl = cleanLink(rawDoc);
      if (!docUrl) return { error: "That link does not look right. Paste the full web address." };
    } else if (status === "SENT" || status === "REVISED") {
      return { error: "Add the link to the quotation PDF (for example from Drive)." };
    }
    const existing = s("existingNumber");
    if (!existing && !s("confirmNew")) {
      const dup = await prisma.quotation.findFirst({
        where: { companyId: company.id, customerId: customer!.id, product, createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
        orderBy: { createdAt: "desc" },
      });
      if (dup) {
        return { needsConfirm: true, error: `${dup.number} was already made for this customer and product in the last week. If this is a new quotation, tick “This is a new quotation” and save again.` };
      }
    }
    const dubaiWhen = new Date(eventAt.getTime() + DUBAI_MS);
    const year = dubaiWhen.getUTCFullYear();
    const month = dubaiWhen.getUTCMonth() + 1;
    const base = { companyId: company.id, customerId: customer!.id, contactName: contactName || null, productCategory: category, product, quantity: s("quantity") || null, value, status, docUrl, createdById: m.id };
    if (existing) {
      if (await prisma.quotation.findUnique({ where: { number: existing } })) return { error: `${existing} is already in the system.` };
      quotation = await prisma.quotation.create({ data: { ...base, number: existing, year, month, seq: null, legacy: true } });
    } else {
      quotation = await createQuotationNumbered(base, slug === "gasneeds" ? "GN" : "FT", year, month);
    }
    title = status === "SENT" ? "Product quotation sent" : status === "REVISED" ? "Quotation revised" : "Quotation update";
    forPerson = customer!.name;
    summary = `${quotation.number} · ${customer!.name} · ${product}${s("quantity") ? ` × ${s("quantity")}` : ""} · ${aed(value)} · ${statusLabel(status)}`;
    Object.assign(details, { quotationNumber: quotation.number, productCategory: category, product, quantity: s("quantity") || null, value, status });
  } else if (kind === "f" && followOther) {
    const topic = s("followTopic") === "Other" ? s("followTopicOther") : s("followTopic");
    if (!topic) return { error: "Choose what the follow-up is about." };
    title = `Follow-up — ${topic}`.slice(0, 200);
    forPerson = followWho;
    summary = `${topic} · ${followWho} · ${s("channel")} · ${s("response")}`;
    Object.assign(details, { topic, with: followWho, withType: s("followWith"), channel: s("channel"), response: s("response") });
  } else if (kind === "f") {
    title = "Quotation follow-up";
    forPerson = customer!.name;
    summary = `${quotation!.number} · ${customer!.name} · ${s("channel")} · ${s("response")}`;
    Object.assign(details, { quotationNumber: quotation!.number, channel: s("channel"), response: s("response") });
  } else if (kind === "v") {
    const from = s("meetFrom");
    const to = s("meetTo");
    if (!from || !to) return { error: "Choose the meeting start and end time." };
    title = "Customer visit";
    forPerson = customer!.name;
    if (s("relatedQuotationId")) {
      const q = await prisma.quotation.findUnique({ where: { id: s("relatedQuotationId") } });
      if (q) quotation = q;
    }
    summary = `${customer!.name} · ${s("purpose")} · ${from}–${to}${quotation ? ` · ${quotation.number}` : ""}`;
    Object.assign(details, { meetFrom: from, meetTo: to, purpose: s("purpose"), quotationNumber: quotation?.number ?? null });
  } else if (kind === "pro") {
    let agency = s("agencyId");
    if (agency === "__new__") {
      const name = s("newAgency");
      if (!name) return { error: "Type the PRO agency name." };
      agency = (await prisma.proAgency.upsert({ where: { name }, update: {}, create: { name } })).id;
    }
    const agencyRow = agency ? await prisma.proAgency.findUnique({ where: { id: agency } }) : null;
    if (!agencyRow) return { error: "Choose the PRO agency." };
    const who = await resolveEmployee(s, company.id);
    if ("error" in who) return { error: who.error };
    if (!s("txnNo")) return { error: "Type the transaction or application number." };
    title = s("proService") || "PRO work";
    forPerson = `${agencyRow.name} · ${who.name}`;
    summary = `${agencyRow.name} · ${title} · ${who.name} · ${s("txnNo")}${s("fees") ? ` · AED ${s("fees")}` : ""} · ${s("proStage")}`;
    Object.assign(details, { agency: agencyRow.name, service: title, employee: who.name, transaction: s("txnNo"), fees: s("fees") || null, stage: s("proStage") });
  } else if (kind === "hr") {
    const who = await resolveEmployee(s, company.id);
    if ("error" in who) return { error: who.error };
    title = s("hrTopic") || "HR work";
    forPerson = who.name;
    summary = `${who.name} · ${title} · ${s("hrAction")}`;
    Object.assign(details, { employee: who.name, topic: title, action: s("hrAction"), confidential: s("confidential") === "yes" });
  } else if (kind === "enq") {
    const category = s("productCategory");
    let product = s("product");
    if (category === "Other product") product = s("productOther");
    if (!category || !product) return { error: "Choose the product." };
    title = s("enqStatus") || "Enquiry received";
    forPerson = customer!.name;
    const leadSource = s("leadSource") || null;
    summary = `${customer!.name} · ${product}${s("quantity") ? ` × ${s("quantity")}` : ""} · ${s("channel")}${leadSource ? ` · from ${leadSource}` : ""} · ${title}`;
    Object.assign(details, { productCategory: category, product, quantity: s("quantity") || null, channel: s("channel"), status: title, leadSource });
  } else if (kind === "po") {
    const sup = await pickSupplier();
    if (typeof sup === "string") return { error: sup };
    const poNo = s("poNo");
    const amount = amountOf("amount");
    if (!poNo) return { error: "Type the PO number." };
    if (!amount || amount <= 0) return { error: "Enter the PO amount in AED." };
    if (qid()) quotation = await loadQuote(qid());
    title = s("poStatus") === "Sent to supplier" || !s("poStatus") ? "PO raised" : `PO — ${s("poStatus").toLowerCase()}`;
    forPerson = sup.name;
    summary = `${poNo} · ${sup.name} · ${aed(amount)} · ${s("poStatus")}${quotation ? ` · for ${quotation.number}` : ""}${s("expectedOn") ? ` · expected ${s("expectedOn")}` : ""}`;
    Object.assign(details, { poNumber: poNo, supplier: sup.name, amount, status: s("poStatus"), quotationNumber: quotation?.number ?? null, expectedOn: s("expectedOn") || null });
  } else if (kind === "imp") {
    const sup = await pickSupplier();
    if (typeof sup === "string") return { error: sup };
    if (qid()) quotation = await loadQuote(qid());
    title = s("importStage") || "Shipment update";
    forPerson = sup.name;
    summary = `${sup.name} · ${title}${s("shipRef") ? ` · ${s("shipRef")}` : ""}${s("etaOn") ? ` · ETA ${s("etaOn")}` : ""}${quotation ? ` · ${quotation.number}` : ""}`;
    Object.assign(details, { supplier: sup.name, stage: title, reference: s("shipRef") || null, eta: s("etaOn") || null, quotationNumber: quotation?.number ?? null });
  } else if (kind === "pr") {
    const amount = amountOf("amount");
    if (!amount || amount <= 0) return { error: "Enter the amount received in AED." };
    title = s("payType") === "Full payment" ? "Payment received — in full" : "Payment received — part";
    forPerson = customer!.name;
    summary = `${customer!.name} · ${aed(amount)} · ${s("method")}${s("reference") ? ` · ${s("reference")}` : ""}${quotation ? ` · ${quotation.number}` : ` · ${s("payFor") || "Other"}${s("invoiceNo") ? ` ${s("invoiceNo")}` : ""}`} · ${s("payType")}`;
    Object.assign(details, { amount, method: s("method"), reference: s("reference") || null, paymentType: s("payType"), quotationNumber: quotation?.number ?? null, paymentFor: quotation ? "Quotation" : s("payFor") || "Other", invoiceNumber: s("invoiceNo") || null });
  } else if (kind === "pm") {
    const sup = await pickSupplier();
    if (typeof sup === "string") return { error: sup };
    const amount = amountOf("amount");
    if (!amount || amount <= 0) return { error: "Enter the amount paid in AED." };
    title = "Payment made";
    forPerson = sup.name;
    summary = `${sup.name} · ${aed(amount)} · ${s("method")}${s("poNo") ? ` · PO ${s("poNo")}` : ""}${s("reference") ? ` · ${s("reference")}` : ""}`;
    Object.assign(details, { supplier: sup.name, amount, method: s("method"), poNumber: s("poNo") || null, reference: s("reference") || null });
  } else if (kind === "pf" && followOther) {
    const inv = s("invoiceNo");
    const amt = amountOf("amount");
    title = "Payment follow-up";
    forPerson = followWho;
    summary = `${inv ? `Invoice ${inv} · ` : ""}${followWho}${amt > 0 ? ` · ${aed(amt)}` : ""} · ${s("channel")} · ${s("payResponse")}${s("promisedOn") ? ` · promised ${s("promisedOn")}` : ""}`;
    Object.assign(details, { invoiceNumber: inv || null, amount: amt > 0 ? amt : null, with: followWho, withType: s("followWith"), channel: s("channel"), response: s("payResponse"), promisedOn: s("promisedOn") || null });
  } else if (kind === "pf") {
    title = "Payment follow-up";
    forPerson = customer!.name;
    summary = `${quotation!.number} · ${customer!.name} · ${s("channel")} · ${s("payResponse")}${s("promisedOn") ? ` · promised ${s("promisedOn")}` : ""}`;
    Object.assign(details, { quotationNumber: quotation!.number, channel: s("channel"), response: s("payResponse"), promisedOn: s("promisedOn") || null });
  } else if (kind === "cc") {
    const amount = amountOf("amount");
    if (!amount || amount <= 0) return { error: "Enter the amount in AED." };
    title = s("ccType") || "Cheque or cash";
    summary = `${title} · ${aed(amount)}${s("bank") ? ` · ${s("bank")}` : ""}${s("reference") ? ` · ${s("reference")}` : ""}`;
    Object.assign(details, { type: title, amount, bank: s("bank") || null, reference: s("reference") || null });
  } else {
    title = s("acType") || "Accounts entry";
    summary = `${title}${s("reference") ? ` · ${s("reference")}` : ""}`;
    Object.assign(details, { type: title, reference: s("reference") || null });
  }
  if (discussed.length) {
    summary += ` · Discussed: ${discussed.map((d) => `${d.label}${d.option ? ` (${d.option}${d.detail ? `, ${d.detail}` : ""})` : d.detail ? ` (${d.detail})` : ""}`).join("; ")}`;
  }
  if (s("outcome")) summary += ` · ${s("outcome")}`;

  // Next step: a follow-up of their own, or a hand-over (Manu: purchase, Jintu: payment) carrying the quotation number.
  const next = s("nextStep") || "none";
  let dueAt: Date | null = null;
  if (next !== "none") {
    if (!profile.next.some((n) => n.v === next)) return { error: "Choose a valid next step." };
    if (!s("dueAt")) return { error: "Choose when the next step is due." };
    dueAt = dubaiInputToDate(s("dueAt"));
    if (isNaN(dueAt.getTime())) return { error: "The next-step date is not valid." };
    if ((next === "manu" || next === "jintu") && !quotation) return { error: "Hand-overs need a quotation. Choose or add one first." };
  }

  const parentTitle = parentOverride || profile.parent[kind];
  let parent = await prisma.task.findFirst({ where: { assignedToId: m.id, parentTaskId: null, title: { equals: parentTitle, mode: "insensitive" } } });
  // Calls & Emails is shared by everyone and created the first time it is used.
  if (!parent) {
    parent = await prisma.task.create({
      data: {
        companyId: m.companyId,
        title: parentTitle,
        category: parentTitle,
        description: `${parentTitle} work, from ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai" })}.`,
        assignedToId: m.id,
        assignedById: m.managerId ?? m.id,
        status: "IN_PROGRESS",
      },
    });
  }
  if (!parent) return { error: `Your “${parentTitle}” category was not found.` };

  const task = await prisma.task.create({
    data: {
      companyId: m.companyId,
      title,
      description: summary,
      assignedToId: m.id,
      assignedById: m.id,
      parentTaskId: parent.id,
      category: parent.category ?? parent.title,
      status: "COMPLETED",
      progress: 100,
      completedAt: eventAt,
      taskFor: "OTHERS",
      forDepartment: mdKind?.dept ?? DEPT[kind],
      forPerson: forPerson.slice(0, 200) || null,
      workedForCompany: slug,
      quotationId: quotation?.id ?? null,
      customerId: customer ? (customer as Cust).id : quotation?.customerId ?? null,
      logKind: mdKind?.code ?? KIND_CODE[kind],
      eventAt,
      enteredLater,
      backdateReason,
      details: details as object,
    },
  });
  if (docUrl) await prisma.taskLink.create({ data: { taskId: task.id, url: docUrl, label: `${quotation?.number ?? "Quotation"} PDF`, addedById: m.id } });

  if (dueAt && next === "followup") {
    const followParent =
      (await prisma.task.findFirst({ where: { assignedToId: m.id, parentTaskId: null, title: { in: [profile.parent.f ?? "", profile.parent.pf ?? ""].filter(Boolean) } } })) ?? parent;
    await prisma.task.create({
      data: {
        companyId: m.companyId,
        title: "Follow up",
        description: `${quotation?.number ?? (customer ? (customer as Cust).name : title)}: ${summary}`.slice(0, 500),
        assignedToId: m.id,
        assignedById: m.id,
        parentTaskId: followParent.id,
        category: followParent.category ?? followParent.title,
        status: "NOT_STARTED",
        deadline: dueAt,
        followUpAt: dueAt,
        quotationId: quotation?.id ?? null,
        customerId: customer ? (customer as Cust).id : quotation?.customerId ?? null,
        logKind: "FOLLOW_UP",
        workedForCompany: slug,
        eventAt: new Date(),
      },
    });
  }
  if (dueAt && (next === "manu" || next === "jintu") && quotation) {
    await createHandOver({ to: next, quotationId: quotation.id, assignedById: m.id, dueAt, companySlug: slug });
  }

  if (dueAt && next.startsWith("f_")) {
    await createFinanceHandOver({ to: next.slice(2), ref: mdRef || title, description: summary, assignedById: m.id, dueAt, companySlug: slug });
  }

  if (dueAt && (next === "flexie" || next === "hashim")) {
    await createMaintenanceHandOver({ to: next, ref: mdRef, description: summary, assignedById: m.id, dueAt, companySlug: slug });
  }

  // Keep the quotation's stage in step with what was just logged.
  if (quotation) {
    let advance: string | null = null;
    if (next === "manu" && ["SENT", "REVISED", "REVIEWING", "NEGOTIATING"].includes(quotation.status)) advance = "ORDER_RECEIVED";
    if (kind === "imp" && s("importStage") === "Delivered" && quotation.status === "ORDER_RECEIVED") advance = "DELIVERED";
    if (next === "jintu" && quotation.status === "ORDER_RECEIVED") advance = "DELIVERED";
    if (kind === "pr" && s("payType") === "Full payment") advance = "PAID";
    if (advance && advance !== quotation.status) {
      await prisma.quotation.update({ where: { id: quotation.id }, data: { status: advance } });
      if (advance === "PAID") {
        await prisma.task.updateMany({
          where: { quotationId: quotation.id, logKind: "HANDOVER", status: { not: "COMPLETED" } },
          data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
        });
      }
    }
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/quotations");
  return { ok: quotation ? `Saved ${quotation.number}` : kind === "sr" && mdRef ? `Saved ${mdRef.split(" · ")[0]}` : "Saved" };
}

async function resolveEmployee(s: Fd, companyId: string): Promise<{ name: string } | { error: string }> {
  const eid = s("employeeId");
  if (eid === "__new__") {
    const name = s("newEmployee");
    if (!name) return { error: "Type the employee’s name." };
    const e = await prisma.employee.upsert({ where: { companyId_name: { companyId, name } }, update: {}, create: { companyId, name } });
    return { name: e.name };
  }
  const e = eid ? await prisma.employee.findFirst({ where: { id: eid, companyId } }) : null;
  return e ? { name: e.name } : { error: "Choose the employee." };
}
