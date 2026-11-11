"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership, hasCompanyAccess } from "@/lib/auth";
import { cleanLink } from "@/lib/links";
import { LOG_FORM_EMAILS, BACKDATE_DAYS, QUOTE_STATUS, statusLabel } from "@/lib/logOptions";
import { dubaiInputToDate, createQuotationNumbered, createHandOver, DUBAI_MS } from "@/lib/quotations";

export type LogState = { error?: string; needsConfirm?: boolean; ok?: string };

const KIND_PARENT = {
  q: "Sales — Quotations",
  f: "Sales — Follow-ups",
  v: "Sales — Customer Visits",
  pro: "PRO — Government & Admin",
  hr: "HR — Staff & Insurance",
} as const;
const DEPT = { q: "Sales", f: "Sales", v: "Sales", pro: "PRO", hr: "HR" } as const;
const KIND_CODE = { q: "QUOTATION", f: "FOLLOW_UP", v: "VISIT", pro: "PRO", hr: "HR" } as const;

/** One structured work-log entry: who, when it happened, what was discussed, the outcome and the next step. */
export async function createLogEntryAction(_prev: LogState | undefined, formData: FormData): Promise<LogState> {
  const m = await getCurrentMembership();
  if (!m) return { error: "Not signed in." };
  if (!LOG_FORM_EMAILS.includes(m.user.email.toLowerCase())) return { error: "This form is not set up for you." };
  const s = (k: string) => String(formData.get(k) || "").trim();

  const kind = s("kind") as keyof typeof KIND_PARENT;
  if (!(kind in KIND_PARENT)) return { error: "Choose the kind of work." };

  const company = await prisma.company.findUnique({ where: { slug: s("company") } });
  if (!company || !(await hasCompanyAccess(m, company.id))) return { error: "Choose the company you are working for." };

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

  // What was discussed: a topic, the picked detail, and the typed detail.
  let discussed: { key: string; label: string; option: string; detail: string }[] = [];
  try {
    const parsed = JSON.parse(s("discussed") || "[]");
    if (Array.isArray(parsed)) discussed = parsed.slice(0, 12);
  } catch {
    discussed = [];
  }

  // Customer (quotations, visits) — picked, or a new one typed once.
  let customer: { id: string; name: string } | null = null;
  let quotation: { id: string; number: string; customerId: string; product: string; value: number | null; status: string } | null = null;
  if (kind === "q" || kind === "v") {
    const cid = s("customerId");
    if (cid === "__new__") {
      const name = s("newCustomer");
      if (!name) return { error: "Type the new customer’s name." };
      customer = await prisma.customer.upsert({
        where: { companyId_name: { companyId: company.id, name } },
        update: {},
        create: { companyId: company.id, name },
      });
    } else if (cid) {
      customer = await prisma.customer.findFirst({ where: { id: cid, companyId: company.id } });
    }
    if (!customer) return { error: "Choose the customer." };
  }
  if (kind === "f") {
    const qid = s("quotationId");
    if (!qid) return { error: "Choose which quotation this is about." };
    const q = await prisma.quotation.findUnique({ where: { id: qid }, include: { customer: true } });
    if (!q) return { error: "That quotation was not found." };
    quotation = q;
    customer = q.customer;
  }
  const contactName = s("contact");
  if (customer && contactName) {
    await prisma.contact.upsert({
      where: { customerId_name: { customerId: customer.id, name: contactName } },
      update: {},
      create: { customerId: customer.id, name: contactName },
    });
  }

  let title = "";
  let forPerson = "";
  let summary = "";
  const details: Record<string, unknown> = { discussed, outcome: s("outcome"), contact: contactName || null };
  let docUrl: string | null = null;

  if (kind === "q") {
    const category = s("productCategory");
    let product = s("product");
    if (category === "Other product") product = s("productOther");
    if (!category || !product) return { error: "Choose the product." };
    const value = Number(s("value").replace(/,/g, ""));
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
        return {
          needsConfirm: true,
          error: `${dup.number} was already made for this customer and product in the last week. If this is a new quotation, tick “This is a new quotation” and save again.`,
        };
      }
    }
    const year = new Date(eventAt.getTime() + DUBAI_MS).getUTCFullYear();
    const prefix = company.slug === "gasneeds" ? "GN" : "FT";
    const base = {
      companyId: company.id,
      customerId: customer!.id,
      contactName: contactName || null,
      productCategory: category,
      product,
      quantity: s("quantity") || null,
      value,
      status,
      docUrl,
      createdById: m.id,
    };
    if (existing) {
      const taken = await prisma.quotation.findUnique({ where: { number: existing } });
      if (taken) return { error: `${existing} is already in the system.` };
      quotation = await prisma.quotation.create({ data: { ...base, number: existing, year, seq: null, legacy: true } });
    } else {
      quotation = await createQuotationNumbered(base, prefix, year);
    }
    title = status === "SENT" ? "Product quotation sent" : status === "REVISED" ? "Quotation revised" : "Quotation update";
    forPerson = customer!.name;
    summary = `${quotation.number} · ${customer!.name} · ${product}${s("quantity") ? ` × ${s("quantity")}` : ""} · AED ${value.toLocaleString("en-US")} · ${statusLabel(status)}`;
    Object.assign(details, { quotationNumber: quotation.number, productCategory: category, product, quantity: s("quantity") || null, value, status });
  } else if (kind === "f") {
    title = "Quotation follow-up";
    forPerson = customer!.name;
    summary = `${quotation!.number} · ${customer!.name} · ${s("channel") || "Follow-up"} · ${s("response") || ""}`.trim();
    Object.assign(details, { quotationNumber: quotation!.number, channel: s("channel"), response: s("response") });
  } else if (kind === "v") {
    const from = s("meetFrom");
    const to = s("meetTo");
    if (!from || !to) return { error: "Choose the meeting start and end time." };
    title = "Customer visit";
    forPerson = customer!.name;
    const relId = s("relatedQuotationId");
    if (relId) {
      const q = await prisma.quotation.findUnique({ where: { id: relId }, include: { customer: true } });
      if (q) quotation = q;
    }
    summary = `${customer!.name} · ${s("purpose") || "Visit"} · ${from}–${to}${quotation ? ` · ${quotation.number}` : ""}`;
    Object.assign(details, { meetFrom: from, meetTo: to, purpose: s("purpose"), quotationNumber: quotation?.number ?? null });
  } else if (kind === "pro") {
    let agency = s("agencyId");
    if (agency === "__new__") {
      const name = s("newAgency");
      if (!name) return { error: "Type the PRO agency name." };
      const a = await prisma.proAgency.upsert({ where: { name }, update: {}, create: { name } });
      agency = a.id;
    }
    const agencyRow = agency ? await prisma.proAgency.findUnique({ where: { id: agency } }) : null;
    if (!agencyRow) return { error: "Choose the PRO agency." };
    const who = await resolveEmployee(s, company.id);
    if ("error" in who) return { error: who.error };
    const txn = s("txnNo");
    if (!txn) return { error: "Type the transaction or application number." };
    title = s("proService") || "PRO work";
    forPerson = `${agencyRow.name} · ${who.name}`;
    summary = `${agencyRow.name} · ${title} · ${who.name} · ${txn}${s("fees") ? ` · AED ${s("fees")}` : ""} · ${s("proStage")}`;
    Object.assign(details, { agency: agencyRow.name, service: title, employee: who.name, transaction: txn, fees: s("fees") || null, stage: s("proStage") });
  } else {
    const who = await resolveEmployee(s, company.id);
    if ("error" in who) return { error: who.error };
    title = s("hrTopic") || "HR work";
    forPerson = who.name;
    summary = `${who.name} · ${title} · ${s("hrAction")}`;
    Object.assign(details, { employee: who.name, topic: title, action: s("hrAction"), confidential: s("confidential") === "yes" });
  }
  if (discussed.length) {
    summary += ` · Discussed: ${discussed.map((d) => `${d.label}${d.option ? ` (${d.option}${d.detail ? `, ${d.detail}` : ""})` : d.detail ? ` (${d.detail})` : ""}`).join("; ")}`;
  }
  if (s("outcome")) summary += ` · ${s("outcome")}`;

  // Next step: a follow-up of his own, or a hand-over to Manu (purchase) or Jintu (payment) with the quotation number.
  const next = s("nextStep") || "none";
  let dueAt: Date | null = null;
  if (next !== "none") {
    if (!s("dueAt")) return { error: "Choose when the next step is due." };
    dueAt = dubaiInputToDate(s("dueAt"));
    if (isNaN(dueAt.getTime())) return { error: "The next-step date is not valid." };
    if ((next === "manu" || next === "jintu") && !quotation) return { error: "Hand-overs need a quotation. Choose or add one first." };
  }

  const parent = await prisma.task.findFirst({
    where: { assignedToId: m.id, parentTaskId: null, title: KIND_PARENT[kind] },
  });
  if (!parent) return { error: `Your “${KIND_PARENT[kind]}” category was not found.` };

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
      forDepartment: DEPT[kind],
      forPerson: forPerson.slice(0, 200),
      workedForCompany: company.slug,
      quotationId: quotation?.id ?? null,
      customerId: customer?.id ?? quotation?.customerId ?? null,
      logKind: KIND_CODE[kind],
      eventAt,
      enteredLater,
      backdateReason,
      details: details as object,
    },
  });
  if (docUrl) await prisma.taskLink.create({ data: { taskId: task.id, url: docUrl, label: `${quotation?.number ?? "Quotation"} PDF`, addedById: m.id } });

  if (dueAt && next === "followup") {
    await prisma.task.create({
      data: {
        companyId: m.companyId,
        title: "Follow up",
        description: `${quotation?.number ?? customer?.name ?? title}: ${summary}`.slice(0, 500),
        assignedToId: m.id,
        assignedById: m.id,
        parentTaskId: (await prisma.task.findFirst({ where: { assignedToId: m.id, parentTaskId: null, title: KIND_PARENT.f } }))?.id ?? parent.id,
        category: KIND_PARENT.f,
        status: "NOT_STARTED",
        deadline: dueAt,
        followUpAt: dueAt,
        quotationId: quotation?.id ?? null,
        customerId: customer?.id ?? quotation?.customerId ?? null,
        logKind: "FOLLOW_UP",
        workedForCompany: company.slug,
        eventAt: new Date(),
      },
    });
  }
  if (dueAt && (next === "manu" || next === "jintu") && quotation) {
    await createHandOver({ to: next, quotationId: quotation.id, assignedById: m.id, dueAt, companySlug: company.slug });
    const advance = next === "manu" ? (["SENT", "REVISED", "REVIEWING", "NEGOTIATING"].includes(quotation.status) ? "ORDER_RECEIVED" : null) : quotation.status === "ORDER_RECEIVED" ? "DELIVERED" : null;
    if (advance) await prisma.quotation.update({ where: { id: quotation.id }, data: { status: advance } });
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/quotations");
  return { ok: quotation ? `Saved ${quotation.number}` : "Saved" };
}

async function resolveEmployee(s: (k: string) => string, companyId: string): Promise<{ name: string } | { error: string }> {
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
