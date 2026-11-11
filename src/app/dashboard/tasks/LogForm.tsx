"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createLogEntryAction } from "./logActions";
import { PRODUCTS } from "@/lib/products";
import {
  FORM_STATUS, CHANNELS, RESPONSES, PURPOSES, OUTCOMES, NEXT_STEPS, DISCUSS, HR_TOPICS, HR_ACTIONS,
  PRO_SERVICES, PRO_STAGES, BACKDATE_REASONS, BACKDATE_DAYS,
} from "@/lib/logOptions";

export type LogData = {
  companies: { id: string; slug: string; name: string }[];
  customers: { id: string; companyId: string; name: string }[];
  contacts: { customerId: string; name: string }[];
  employees: { id: string; companyId: string; name: string }[];
  agencies: { id: string; name: string }[];
  quotations: { id: string; number: string; companyId: string; customerId: string; customerName: string; value: number | null; createdAt: string }[];
  nextNumbers: Record<string, string>;
  prefill?: { kind?: string; quotationId?: string };
};

const sel = "w-full rounded-md border border-brand-300 px-2 py-1.5 text-[17px]";
const KINDS = [
  { v: "q", l: "Quotation" },
  { v: "f", l: "Follow-up" },
  { v: "v", l: "Customer visit" },
  { v: "pro", l: "PRO" },
  { v: "hr", l: "HR" },
];

function Tag({ t }: { t: "pick" | "type" | "auto" }) {
  const cls = t === "pick" ? "bg-emerald-100 text-emerald-800" : t === "type" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800";
  return <span className={`rounded-full px-1.5 text-[11px] ${cls}`}>{t === "pick" ? "Pick" : t === "type" ? "Type" : "Auto"}</span>;
}
function Field({ label, tag, children }: { label: string; tag?: "pick" | "type" | "auto"; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 flex items-center gap-1.5 text-[14px] text-slate-600">
        {label} {tag && <Tag t={tag} />}
      </label>
      {children}
    </div>
  );
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[16px] ${on ? "border-brand-500 bg-brand-100 text-brand-800" : "border-slate-300 bg-white text-slate-700"}`}
    >
      {children}
    </button>
  );
}
function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
      {pending ? "Saving…" : "Add task"}
    </button>
  );
}

const dubaiNow = () => new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16);
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" });

export function LogForm({ data }: { data: LogData }) {
  const [state, formAction] = useFormState(createLogEntryAction, {});
  const [open, setOpen] = useState(!!data.prefill?.quotationId);
  const [key, setKey] = useState(0);
  const [company, setCompany] = useState(data.companies.find((c) => c.slug === "gasneeds")?.slug ?? data.companies[0].slug);
  const [kind, setKind] = useState(data.prefill?.kind ?? "q");
  const [customerId, setCustomerId] = useState("");
  const [quotationId, setQuotationId] = useState(data.prefill?.quotationId ?? "");
  const [eventAt, setEventAt] = useState(dubaiNow());
  const [pcat, setPcat] = useState(Object.keys(PRODUCTS)[0]);
  const [existing, setExisting] = useState(false);
  const [next, setNext] = useState("none");
  const [picked, setPicked] = useState<Record<string, { option: string; detail: string }>>({});
  const [agencyId, setAgencyId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState("");

  const companyRow = data.companies.find((c) => c.slug === company)!;
  const customers = data.customers.filter((c) => c.companyId === companyRow.id);
  const employees = data.employees.filter((e) => e.companyId === companyRow.id);
  const quotes = data.quotations.filter((q) => q.companyId === companyRow.id);
  const contactList = data.contacts.filter((c) => c.customerId === (customerId || quotes.find((q) => q.id === quotationId)?.customerId));
  const old = useMemo(() => Date.now() - new Date(`${eventAt}:00Z`).getTime() + 4 * 3600 * 1000 > BACKDATE_DAYS * 86400000, [eventAt]);
  const discussed = JSON.stringify(
    DISCUSS.filter((d) => picked[d.key]).map((d) => ({ key: d.key, label: d.label, option: picked[d.key].option, detail: picked[d.key].detail }))
  );

  // Remember the last choices.
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("logFormPrefs") || "{}");
      if (p.company && data.companies.some((c) => c.slug === p.company)) setCompany(p.company);
      if (p.kind && !data.prefill?.kind) setKind(p.kind);
    } catch {}
  }, [data.companies, data.prefill?.kind]);
  useEffect(() => {
    if (state.ok) {
      try {
        localStorage.setItem("logFormPrefs", JSON.stringify({ company, kind }));
      } catch {}
      setSaved(state.ok);
      setOpen(false);
      setPicked({});
      setNext("none");
      setCustomerId("");
      setQuotationId("");
      setEventAt(dubaiNow());
      setKey((k) => k + 1);
      const t = setTimeout(() => setSaved(""), 3000);
      return () => clearTimeout(t);
    }
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) {
    return (
      <>
        {saved && <div className="toast-in fixed left-1/2 top-4 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-[17px] font-medium text-white shadow-lg">✓ {saved}</div>}
        <button type="button" onClick={() => setOpen(true)} className="text-[19px] text-brand-600 hover:underline">
          + Add task
        </button>
      </>
    );
  }

  return (
    <form key={key} action={formAction} className="space-y-3 rounded-lg border border-brand-200 p-3">
      <input type="hidden" name="company" value={company} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="discussed" value={discussed} />

      <Field label="Working for" tag="pick">
        <div className="flex gap-2">
          {data.companies.map((c) => (
            <Chip key={c.slug} on={company === c.slug} onClick={() => { setCompany(c.slug); setCustomerId(""); setQuotationId(""); setEmployeeId(""); }}>
              {c.name}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="When it happened (Dubai time)" tag="pick">
          <input type="datetime-local" name="eventAt" required value={eventAt} onChange={(e) => setEventAt(e.target.value)} className={sel} />
          <p className="mt-0.5 text-[13px] text-slate-500">Today by default. Choose an earlier time to back-date; it is recorded as entered later.</p>
        </Field>
        {old ? (
          <Field label={`Why is it entered late? (older than ${BACKDATE_DAYS} days)`} tag="pick">
            <select name="reason" required value={reason} onChange={(e) => setReason(e.target.value)} className={sel}>
              <option value="" disabled>Choose…</option>
              {BACKDATE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            {reason === "Other" && <input name="reasonText" required placeholder="Type the reason" className={`${sel} mt-1`} />}
          </Field>
        ) : (
          <Field label="Logged on" tag="auto">
            <input readOnly value="Set when you save" className={`${sel} bg-slate-50`} />
          </Field>
        )}
      </div>

      <Field label="Kind of work" tag="pick">
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Chip key={k.v} on={kind === k.v} onClick={() => { setKind(k.v); setCustomerId(""); }}>{k.l}</Chip>
          ))}
        </div>
      </Field>

      {kind === "q" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Quotation no." tag="auto">
            {existing ? (
              <input name="existingNumber" required placeholder="Type the old number once" className={sel} />
            ) : (
              <input readOnly value={data.nextNumbers[company] ?? "Numbered when saved"} className={`${sel} bg-slate-50`} />
            )}
            <label className="mt-1 flex items-center gap-1.5 text-[14px] text-slate-600">
              <input type="checkbox" checked={existing} onChange={(e) => setExisting(e.target.checked)} /> Existing quotation (bring in an old one)
            </label>
          </Field>
          <CustomerPick customers={customers} value={customerId} onChange={setCustomerId} />
          <ContactInput list={contactList} />
          <Field label="Product category" tag="pick">
            <select name="productCategory" value={pcat} onChange={(e) => setPcat(e.target.value)} className={sel}>
              {Object.keys(PRODUCTS).map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Product" tag="pick">
            {pcat === "Other product" ? (
              <input name="productOther" required placeholder="Type the product name" className={sel} />
            ) : (
              <select name="product" className={sel}>{PRODUCTS[pcat].map((p) => <option key={p}>{p}</option>)}</select>
            )}
          </Field>
          <Field label="Quantity" tag="type"><input name="quantity" placeholder="e.g. 10" className={sel} /></Field>
          <Field label="Value (AED)" tag="type"><input name="value" required inputMode="decimal" placeholder="18500" className={sel} /></Field>
          <Field label="Where it stands" tag="pick">
            <select name="status" className={sel}>{FORM_STATUS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
          </Field>
          <Field label="Link to the quotation PDF (Drive)" tag="type">
            <input name="docUrl" placeholder="https://drive.google.com/…" className={sel} />
          </Field>
          {state.needsConfirm && (
            <label className="flex items-center gap-2 text-[16px] text-amber-800 sm:col-span-2">
              <input type="checkbox" name="confirmNew" value="1" /> This is a new quotation, not a duplicate
            </label>
          )}
        </div>
      )}

      {kind === "f" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="About which quotation" tag="pick">
            <select name="quotationId" required value={quotationId} onChange={(e) => setQuotationId(e.target.value)} className={sel}>
              <option value="" disabled>Choose quotation…</option>
              {quotes.map((q) => (
                <option key={q.id} value={q.id}>{q.number} · {q.customerName}{q.value ? ` · AED ${q.value.toLocaleString("en-US")}` : ""} · {fmt(q.createdAt)}</option>
              ))}
            </select>
          </Field>
          <Field label="How you were in touch" tag="pick">
            <select name="channel" className={sel}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <ContactInput list={contactList} label="Spoke to" />
          <Field label="Their answer" tag="pick">
            <select name="response" className={sel}>{RESPONSES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
        </div>
      )}

      {kind === "v" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <CustomerPick customers={customers} value={customerId} onChange={setCustomerId} />
          <ContactInput list={contactList} label="Met with" />
          <Field label="Meeting from" tag="pick"><input type="time" name="meetFrom" required className={sel} /></Field>
          <Field label="Meeting until" tag="pick"><input type="time" name="meetTo" required className={sel} /></Field>
          <Field label="Purpose" tag="pick">
            <select name="purpose" className={sel}>{PURPOSES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Related quotation" tag="pick">
            <select name="relatedQuotationId" className={sel}>
              <option value="">None</option>
              {quotes.map((q) => <option key={q.id} value={q.id}>{q.number} · {q.customerName}</option>)}
            </select>
          </Field>
        </div>
      )}

      {kind === "pro" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="PRO agency" tag="pick">
            <select name="agencyId" required value={agencyId} onChange={(e) => setAgencyId(e.target.value)} className={sel}>
              <option value="" disabled>Choose agency…</option>
              {data.agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              <option value="__new__">+ Add agency</option>
            </select>
            {agencyId === "__new__" && <input name="newAgency" required placeholder="Agency name" className={`${sel} mt-1`} />}
          </Field>
          <Field label="Service" tag="pick"><select name="proService" className={sel}>{PRO_SERVICES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <EmployeePick employees={employees} value={employeeId} onChange={setEmployeeId} label="For" />
          <Field label="Transaction no." tag="type"><input name="txnNo" required placeholder="From the agency" className={sel} /></Field>
          <Field label="Fees (AED)" tag="type"><input name="fees" inputMode="decimal" placeholder="650" className={sel} /></Field>
          <Field label="Stage" tag="pick"><select name="proStage" className={sel}>{PRO_STAGES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
      )}

      {kind === "hr" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <EmployeePick employees={employees} value={employeeId} onChange={setEmployeeId} label="Employee" />
          <Field label="Topic" tag="pick"><select name="hrTopic" className={sel}>{HR_TOPICS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Action" tag="pick"><select name="hrAction" className={sel}>{HR_ACTIONS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Confidential" tag="pick">
            <select name="confidential" className={sel}><option value="no">No</option><option value="yes">Yes — directors only</option></select>
          </Field>
        </div>
      )}

      <div className="border-t border-brand-100 pt-3">
        <Field label="What was discussed — tap a topic, then pick the detail" tag="pick">
          <div className="flex flex-wrap gap-2">
            {DISCUSS.map((d) => (
              <Chip
                key={d.key}
                on={!!picked[d.key]}
                onClick={() =>
                  setPicked((p) => {
                    const n = { ...p };
                    if (n[d.key]) delete n[d.key];
                    else n[d.key] = { option: d.options[0] ?? "", detail: "" };
                    return n;
                  })
                }
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </Field>
        {DISCUSS.filter((d) => picked[d.key]).map((d) => (
          <div key={d.key} className="mt-2 grid gap-2 rounded-md border border-brand-100 p-2 sm:grid-cols-2">
            {d.options.length > 0 && (
              <Field label={d.heading} tag="pick">
                <select value={picked[d.key].option} onChange={(e) => setPicked((p) => ({ ...p, [d.key]: { ...p[d.key], option: e.target.value } }))} className={sel}>
                  {d.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
            )}
            <Field label={d.options.length ? "Details" : d.heading} tag="type">
              <input value={picked[d.key].detail} placeholder={d.placeholder} onChange={(e) => setPicked((p) => ({ ...p, [d.key]: { ...p[d.key], detail: e.target.value } }))} className={sel} />
            </Field>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="How it ended" tag="pick"><select name="outcome" className={sel}>{OUTCOMES.map((o) => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Next step needed" tag="pick">
          <select name="nextStep" value={next} onChange={(e) => setNext(e.target.value)} className={sel}>
            {NEXT_STEPS.map((n) => <option key={n.v} value={n.v}>{n.l}</option>)}
          </select>
        </Field>
        {next !== "none" && (
          <Field label="Do it by" tag="pick"><input type="datetime-local" name="dueAt" required className={sel} /></Field>
        )}
      </div>

      {state.error && <p className="text-[17px] text-red-600">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Submit />
        <button type="button" onClick={() => setOpen(false)} className="text-[18px] text-slate-500 hover:text-slate-700">Cancel</button>
      </div>
    </form>
  );
}

function CustomerPick({ customers, value, onChange }: { customers: { id: string; name: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Customer" tag="pick">
      <select name="customerId" required value={value} onChange={(e) => onChange(e.target.value)} className={sel}>
        <option value="" disabled>Choose customer…</option>
        {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        <option value="__new__">+ Add customer</option>
      </select>
      {value === "__new__" && <input name="newCustomer" required placeholder="Customer name" className={`${sel} mt-1`} />}
    </Field>
  );
}

function ContactInput({ list, label = "Contact person" }: { list: { name: string }[]; label?: string }) {
  return (
    <Field label={label}>
      <span className="ml-1"><Tag t="pick" /> <Tag t="type" /></span>
      <input name="contact" list="contact-list" placeholder="Pick a saved contact or type a name" className={sel} />
      <datalist id="contact-list">{list.map((c) => <option key={c.name} value={c.name} />)}</datalist>
    </Field>
  );
}

function EmployeePick({ employees, value, onChange, label }: { employees: { id: string; name: string }[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label} tag="pick">
      <select name="employeeId" required value={value} onChange={(e) => onChange(e.target.value)} className={sel}>
        <option value="" disabled>Choose employee…</option>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        <option value="__new__">+ Add employee</option>
      </select>
      {value === "__new__" && <input name="newEmployee" required placeholder="Employee name" className={`${sel} mt-1`} />}
    </Field>
  );
}
