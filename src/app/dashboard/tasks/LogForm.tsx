"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createLogEntryAction } from "./logActions";
import { PRODUCTS } from "@/lib/products";
import {
  FORM_STATUS, CHANNELS, RESPONSES, PURPOSES, OUTCOMES, DISCUSS, HR_TOPICS, HR_ACTIONS,
  PRO_SERVICES, PRO_STAGES, BACKDATE_REASONS, BACKDATE_DAYS, ENQ_STATUS, PO_STATUS, IMPORT_STAGES, FOR_GROUPS,
  PAY_METHODS, PAY_RESPONSES, CC_TYPES, AC_TYPES, FOLLOW_TOPICS, FOLLOW_WITH, BANKS, PAY_FOR, LEAD_SOURCES, GENERIC, UNIT_TYPES, PRO_VISITS } from "@/lib/logOptions";

export type LogData = {
  companies: { id: string; slug: string; name: string }[];
  customers: { id: string; companyId: string; name: string }[];
  contacts: { customerId: string; name: string }[];
  employees: { id: string; companyId: string; name: string }[];
  agencies: { id: string; name: string }[];
  quotations: { id: string; number: string; companyId: string; customerId: string; customerName: string; value: number | null; createdAt: string }[];
  suppliers: { id: string; companyId: string; name: string }[];
  buildings: { id: string; group?: string; code: string | null; name: string; cycle: string | null; rate: number | null; pf: number | null; monthly: number | null; first: number | null; deposit: number | null; connection: number | null; disconnection: number | null }[];
  units: { id: string; buildingId: string; flat: string; tenant: string | null; status: string }[];
  projects?: { id: string; name: string; number: string | null }[];
  /** What this person's form offers: kinds of work, the companies they can log for, and their next-step choices. */
  profile: { kinds: { v: string; l: string }[]; companies: string[]; next: { v: string; l: string }[]; tabs?: { l: string; kinds: string[] }[] };
  nextNumbers: Record<string, string>;
  prefill?: { kind?: string; quotationId?: string };
};

const sel = "w-full rounded-md border border-brand-300 px-2 py-1.5 text-[17px]";

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
      className={`rounded-full border px-3 py-1 text-[16px] ${on ? "border-accent bg-accent text-on-accent shadow-md" : "border-slate-300 bg-white text-slate-700 hover:border-accent"}`}
    >
      {children}
    </button>
  );
}
function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-xl bg-accent px-5 py-2.5 text-[19px] font-semibold text-on-accent shadow-md hover:opacity-90 disabled:opacity-60">
      {pending ? "Saving…" : "Add task"}
    </button>
  );
}

const dubaiNow = () => new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16);
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" });

export function LogForm({ data }: { data: LogData }) {
  const [state, formAction] = useFormState(createLogEntryAction, {});
  const [proService, setProService] = useState(PRO_SERVICES[0]);
  const [open, setOpen] = useState(!!(data.prefill?.quotationId || data.prefill?.kind));
  const [key, setKey] = useState(0);
  const KINDS = data.profile.kinds;
  const myCompanies = data.companies.filter((c) => data.profile.companies.includes(c.slug));
  const [company, setCompany] = useState(myCompanies.find((c) => c.slug === "gasneeds")?.slug ?? myCompanies[0].slug);
  const [kind, setKind] = useState(data.prefill?.kind ?? KINDS[0].v);
  const tabs = data.profile.tabs;
  const [tab, setTab] = useState(() => Math.max(0, tabs?.findIndex((t) => t.kinds.includes(data.prefill?.kind ?? KINDS[0].v)) ?? 0));
  const [supplierId, setSupplierId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [unitType, setUnitType] = useState("Apartment");
  const [unitId, setUnitId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [quotationId, setQuotationId] = useState(data.prefill?.quotationId ?? "");
  // Follow-ups: about a quotation, or about anything else (topic + who).
  const [followAbout, setFollowAbout] = useState<"quote" | "other">("quote");
  const [followTopic, setFollowTopic] = useState(FOLLOW_TOPICS[0]);
  const [followWith, setFollowWith] = useState("customer");
  const [eventAt, setEventAt] = useState(dubaiNow());
  const [pcat, setPcat] = useState(Object.keys(PRODUCTS)[0]);
  const [existing, setExisting] = useState(false);
  const [next, setNext] = useState("none");
  const [picked, setPicked] = useState<Record<string, { option: string; detail: string }>>({});
  const [agencyId, setAgencyId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [forGroup, setForGroup] = useState("");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState("");

  const companyRow = data.companies.find((c) => c.slug === company)!;
  const suppliers = data.suppliers.filter((x) => x.companyId === companyRow.id);
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
      if (p.company && myCompanies.some((c) => c.slug === p.company)) setCompany(p.company);
      if (p.kind && !data.prefill?.kind && KINDS.some((k) => k.v === p.kind)) setKind(p.kind);
    } catch {}
  }, [data.companies, data.prefill?.kind]); // eslint-disable-line react-hooks/exhaustive-deps
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
      setFollowAbout("quote");
      setFollowTopic(FOLLOW_TOPICS[0]);
      setFollowWith("customer");
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
          {myCompanies.map((c) => (
            <Chip key={c.slug} on={company === c.slug} onClick={() => { setCompany(c.slug); setCustomerId(""); setQuotationId(""); setEmployeeId(""); setSupplierId(""); }}>
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

      {tabs && (
        <div className="flex gap-1 border-b border-brand-200">
          {tabs.map((t, i) => (
            <button
              type="button"
              key={t.l}
              onClick={() => { setTab(i); setKind(t.kinds[0]); setCustomerId(""); }}
              className={`-mb-px rounded-t-md border px-4 py-1.5 text-[17px] font-medium ${tab === i ? "border-brand-300 border-b-white bg-white text-brand-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {t.l}
            </button>
          ))}
        </div>
      )}
      <Field label="Kind of work" tag="pick">
        <div className="flex flex-wrap gap-2">
          {KINDS.filter((k) => !tabs || tabs[tab].kinds.includes(k.v)).map((k) => (
            <Chip key={k.v} on={kind === k.v} onClick={() => { setKind(k.v); setCustomerId(""); setFollowAbout("quote"); }}>{k.l}</Chip>
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
          <div className="sm:col-span-2"><ProductLines /></div>
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
        <div className="space-y-3">
          <Field label="About" tag="pick">
            <input type="hidden" name="followAbout" value={followAbout} />
            <div className="flex flex-wrap gap-2">
              <Chip on={followAbout === "quote"} onClick={() => setFollowAbout("quote")}>A quotation</Chip>
              <Chip on={followAbout === "other"} onClick={() => { setFollowAbout("other"); setQuotationId(""); }}>Something else</Chip>
            </div>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {followAbout === "quote" ? (
              <QuotePick customers={customers} quotes={quotes} value={quotationId} onChange={setQuotationId} label="About which quotation" />
            ) : (
              <>
                <Field label="Topic" tag="pick">
                  <select name="followTopic" value={followTopic} onChange={(e) => setFollowTopic(e.target.value)} className={sel}>
                    {FOLLOW_TOPICS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  {followTopic === "Other" && <input name="followTopicOther" required placeholder="What is it about?" className={`${sel} mt-1`} />}
                </Field>
                <WithPicker
                  value={followWith}
                  onChange={(v) => { setFollowWith(v); setCustomerId(""); setSupplierId(""); }}
                  customers={customers}
                  suppliers={suppliers}
                  customerId={customerId}
                  setCustomerId={setCustomerId}
                  supplierId={supplierId}
                  setSupplierId={setSupplierId}
                />
              </>
            )}
            <Field label="How you were in touch" tag="pick">
              <select name="channel" className={sel}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            {(followAbout === "quote" || followWith === "customer") && <ContactInput list={contactList} label="Spoke to" />}
            <Field label="Their answer" tag="pick">
              <select name="response" className={sel}>{RESPONSES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
          </div>
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
              <option value="">No quotation — other payment</option>
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
          <Field label="Service" tag="pick"><select name="proService" value={proService} onChange={(e) => setProService(e.target.value)} className={sel}>{PRO_SERVICES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <ForWhom employees={employees} value={employeeId} onChange={setEmployeeId} group={forGroup} setGroup={setForGroup} />
          <Field label="Transaction no." tag="type"><input name="txnNo" required={!PRO_VISITS.includes(proService)} placeholder={PRO_VISITS.includes(proService) ? "Not needed for a visit" : "From the agency"} className={sel} /></Field>
          <Field label="Fees (AED)" tag="type"><input name="fees" inputMode="decimal" placeholder="650" className={sel} /></Field>
          <Field label="Stage" tag="pick"><select name="proStage" className={sel}>{PRO_STAGES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
      )}

      {kind === "hr" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ForWhom employees={employees} value={employeeId} onChange={setEmployeeId} group={forGroup} setGroup={setForGroup} />
          <Field label="Topic" tag="pick"><select name="hrTopic" className={sel}>{HR_TOPICS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Action" tag="pick"><select name="hrAction" className={sel}>{HR_ACTIONS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Confidential" tag="pick">
            <select name="confidential" className={sel}><option value="no">No</option><option value="yes">Yes — management only</option></select>
          </Field>
        </div>
      )}

      {kind === "enq" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <CustomerPick customers={customers} value={customerId} onChange={setCustomerId} />
          <ContactInput list={contactList} />
          <div className="sm:col-span-2"><ProductLines /></div>
          <Field label="How it came in" tag="pick"><select name="channel" className={sel}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Lead source" tag="pick"><select name="leadSource" className={sel}>{LEAD_SOURCES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Where it stands" tag="pick"><select name="enqStatus" className={sel}>{ENQ_STATUS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
      )}

      {kind === "po" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SupplierPick suppliers={suppliers} value={supplierId} onChange={setSupplierId} />
          <QuotePick customers={customers} quotes={quotes} value={quotationId} onChange={setQuotationId} label="For quotation" optional />
          <Field label="PO number" tag="type"><input name="poNo" required placeholder="Your PO number" className={sel} /></Field>
          <Field label="Amount (AED)" tag="type"><input name="amount" required inputMode="decimal" placeholder="12000" className={sel} /></Field>
          <Field label="Where it stands" tag="pick"><select name="poStatus" className={sel}>{PO_STATUS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Expected on" tag="pick"><input type="date" name="expectedOn" className={sel} /></Field>
        </div>
      )}

      {kind === "imp" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SupplierPick suppliers={suppliers} value={supplierId} onChange={setSupplierId} />
          <QuotePick customers={customers} quotes={quotes} value={quotationId} onChange={setQuotationId} label="For quotation" optional />
          <Field label="Shipment stage" tag="pick"><select name="importStage" className={sel}>{IMPORT_STAGES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Shipment or tracking reference" tag="type"><input name="shipRef" placeholder="Only if you have it" className={sel} /></Field>
          <Field label="Expected arrival" tag="pick"><input type="date" name="etaOn" className={sel} /></Field>
        </div>
      )}

      {kind === "pr" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <QuotePick customers={customers} quotes={quotes} value={quotationId} onChange={setQuotationId} label="Payment for quotation" optional />
          {!quotationId && <CustomerPick customers={customers} value={customerId} onChange={setCustomerId} />}
          {!quotationId && <Field label="Payment is for" tag="pick"><select name="payFor" className={sel}>{PAY_FOR.map((c) => <option key={c}>{c}</option>)}</select></Field>}
          {!quotationId && <Field label="Invoice no." tag="type"><input name="invoiceNo" placeholder="Only if you have it" className={sel} /></Field>}
          <Field label="Amount received (AED)" tag="type"><input name="amount" required inputMode="decimal" placeholder="5000" className={sel} /></Field>
          <Field label="Paid by" tag="pick"><select name="method" className={sel}>{PAY_METHODS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Reference or cheque no." tag="type"><input name="reference" placeholder="Only if you have it" className={sel} /></Field>
          <Field label="This payment is" tag="pick"><select name="payType" className={sel}><option>Part payment</option><option>Full payment</option></select></Field>
        </div>
      )}

      {kind === "pm" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SupplierPick suppliers={suppliers} value={supplierId} onChange={setSupplierId} />
          <Field label="PO number" tag="type"><input name="poNo" placeholder="Only if it is for a PO" className={sel} /></Field>
          <Field label="Amount paid (AED)" tag="type"><input name="amount" required inputMode="decimal" placeholder="12000" className={sel} /></Field>
          <Field label="Paid by" tag="pick"><select name="method" className={sel}>{PAY_METHODS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Reference or cheque no." tag="type"><input name="reference" placeholder="Only if you have it" className={sel} /></Field>
        </div>
      )}

      {kind === "pf" && (
        <div className="space-y-3">
          <Field label="About" tag="pick">
            <input type="hidden" name="followAbout" value={followAbout} />
            <div className="flex flex-wrap gap-2">
              <Chip on={followAbout === "quote"} onClick={() => setFollowAbout("quote")}>A quotation</Chip>
              <Chip on={followAbout === "other"} onClick={() => { setFollowAbout("other"); setQuotationId(""); }}>An invoice or other</Chip>
            </div>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {followAbout === "quote" ? (
              <QuotePick customers={customers} quotes={quotes} value={quotationId} onChange={setQuotationId} label="Payment for quotation" />
            ) : (
              <>
                <WithPicker
                  value={followWith}
                  onChange={(v) => { setFollowWith(v); setCustomerId(""); setSupplierId(""); }}
                  customers={customers}
                  suppliers={suppliers}
                  customerId={customerId}
                  setCustomerId={setCustomerId}
                  supplierId={supplierId}
                  setSupplierId={setSupplierId}
                />
                <Field label="Invoice no." tag="type"><input name="invoiceNo" placeholder="Optional" className={sel} /></Field>
                <Field label="Amount (AED)" tag="type"><input name="amount" inputMode="decimal" placeholder="Optional" className={sel} /></Field>
              </>
            )}
            <Field label="How you were in touch" tag="pick"><select name="channel" className={sel}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></Field>
            {(followAbout === "quote" || followWith === "customer") && <ContactInput list={contactList} label="Spoke to" />}
            <Field label="Their answer" tag="pick"><select name="payResponse" className={sel}>{PAY_RESPONSES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="They promised to pay by" tag="pick"><input type="date" name="promisedOn" className={sel} /></Field>
          </div>
        </div>
      )}
      {kind === "cc" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="What was done" tag="pick"><select name="ccType" className={sel}>{CC_TYPES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Amount (AED)" tag="type"><input name="amount" required inputMode="decimal" placeholder="5000" className={sel} /></Field>
          <BankPick />
          <Field label="Cheque or slip no." tag="type"><input name="reference" placeholder="Only if you have it" className={sel} /></Field>
        </div>
      )}

      {kind === "ac" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="What was done" tag="pick"><select name="acType" className={sel}>{AC_TYPES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Reference" tag="type"><input name="reference" placeholder="Only if needed" className={sel} /></Field>
        </div>
      )}

      {GENERIC[kind] && (
        <div className="grid gap-3 sm:grid-cols-2">
          {GENERIC[kind].building && (
            <BuildingUnit
              data={data}
              required={GENERIC[kind].building === "req"}
              noUnit={!!GENERIC[kind].noUnit}
              buildingId={buildingId}
              setBuildingId={(v) => { setBuildingId(v); setUnitId(""); }}
              unitType={unitType}
              setUnitType={(v) => { setUnitType(v); setUnitId(""); }}
              unitId={unitId}
              setUnitId={setUnitId}
            />
          )}
          {GENERIC[kind].fields.map((f) => f.t === "customer" ? (
            <CustomerPick key={`${kind}-${f.n}`} customers={customers} value={customerId} onChange={setCustomerId} />
          ) : f.t === "supplier" ? (
            <SupplierPick key={`${kind}-${f.n}`} suppliers={suppliers} value={supplierId} onChange={setSupplierId} />
          ) : f.t === "staff" ? (
            <Field key={`${kind}-${f.n}`} label={f.l} tag="pick">
              <select name={f.n} required={f.req} className={sel} defaultValue="">
                <option value="" disabled={!!f.req}>{f.req ? "Choose from the staff directory…" : "Myself or not needed"}</option>
                {data.employees.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            </Field>
          ) : f.t === "project" ? (
            <Field key={`${kind}-${f.n}`} label={f.l} tag="pick">
              <select name={f.n} required={f.req} className={sel} defaultValue="">
                <option value="" disabled={!!f.req}>{f.req ? "Choose project…" : "No project"}</option>
                {(data.projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}{p.number ? ` · ${p.number}` : ""}</option>)}
              </select>
            </Field>
          ) : (
            <Field key={`${kind}-${f.n}`} label={f.l} tag={f.t === "type" ? "type" : "pick"}>
              {f.t === "pick" ? (
                <select name={f.n} className={sel}>{(f.o ?? []).map((o) => <option key={o}>{o}</option>)}</select>
              ) : f.t === "date" ? (
                <input type="date" name={f.n} required={f.req} className={sel} />
              ) : f.t === "month" ? (
                <input type="month" name={f.n} required={f.req} defaultValue={new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 7)} className={sel} />
              ) : (
                <input name={f.n} required={f.req} placeholder={f.ph} className={sel} />
              )}
            </Field>
          ))}
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
            {data.profile.next.map((n) => <option key={n.v} value={n.v}>{n.l}</option>)}
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

/** Who a follow-up was with: a customer, a supplier, or someone else typed by name. */
function WithPicker({
  value, onChange, customers, suppliers, customerId, setCustomerId, supplierId, setSupplierId,
}: {
  value: string;
  onChange: (v: string) => void;
  customers: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  customerId: string;
  setCustomerId: (v: string) => void;
  supplierId: string;
  setSupplierId: (v: string) => void;
}) {
  return (
    <>
      <Field label="With" tag="pick">
        <input type="hidden" name="followWith" value={value} />
        <div className="flex flex-wrap gap-2">
          {FOLLOW_WITH.map((w) => (
            <Chip key={w.v} on={value === w.v} onClick={() => onChange(w.v)}>{w.l}</Chip>
          ))}
        </div>
      </Field>
      {value === "customer" && <CustomerPick customers={customers} value={customerId} onChange={setCustomerId} />}
      {value === "supplier" && <SupplierPick suppliers={suppliers} value={supplierId} onChange={setSupplierId} />}
      {value === "someone" && (
        <Field label="Who" tag="type">
          <input name="followWho" required placeholder="Name and company / office" className={sel} />
        </Field>
      )}
    </>
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
  const [v, setV] = useState("");
  return (
    <Field label={label} tag="pick">
      <select value={v} onChange={(e) => setV(e.target.value)} className={sel}>
        <option value="">Not needed</option>
        {list.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        <option value="__new__">+ Someone else — type the name</option>
      </select>
      {v && v !== "__new__" && <input type="hidden" name="contact" value={v} />}
      {v === "__new__" && <input name="contact" required placeholder="Name" className={`${sel} mt-1`} />}
    </Field>
  );
}

function BankPick() {
  const [v, setV] = useState("");
  return (
    <Field label="Bank" tag="pick">
      <select value={v} onChange={(e) => setV(e.target.value)} className={sel}>
        <option value="">Not needed</option>
        {BANKS.map((b) => <option key={b}>{b}</option>)}
      </select>
      {v && v !== "Other bank" && <input type="hidden" name="bank" value={v} />}
      {v === "Other bank" && <input name="bank" required placeholder="Bank name" className={`${sel} mt-1`} />}
    </Field>
  );
}

type ProductLine = { cat: string; name: string; qty: string };
let catalogLoad: Promise<[string, string][]> | null = null;
const loadCatalog = () => (catalogLoad ??= fetch("/api/catalog").then((r) => (r.ok ? r.json() : [])).catch(() => []));

/** One or more products: pick a category, then type the product name; matching names appear only once you type. */
function ProductLines() {
  const cats = Object.keys(PRODUCTS);
  const [lines, setLines] = useState<ProductLine[]>([{ cat: cats[0], name: "", qty: "" }]);
  const [catalog, setCatalog] = useState<[string, string][]>([]);
  const [openRow, setOpenRow] = useState<number | null>(null);
  useEffect(() => { loadCatalog().then(setCatalog); }, []);
  const upd = (i: number, patch: Partial<ProductLine>) => setLines((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const suggestions = (l: ProductLine) => {
    const words = l.name.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (l.name.trim().length < 2 || l.cat === "Other product") return [];
    return catalog.filter(([c, t]) => c === l.cat && words.every((w) => t.toLowerCase().includes(w))).slice(0, 8).map(([, t]) => t);
  };
  return (
    <div className="space-y-2">
      <input type="hidden" name="items" value={JSON.stringify(lines)} />
      <div className="text-[15px] font-medium text-slate-700">Products <span className="text-[12px] font-normal text-slate-500">(pick the category, then type the product name)</span></div>
      {lines.map((l, i) => {
        const sug = openRow === i ? suggestions(l) : [];
        return (
          <div key={i} className="grid gap-2 sm:grid-cols-[210px_1fr_110px_auto]">
            <select value={l.cat} onChange={(e) => upd(i, { cat: e.target.value })} className={sel} aria-label="Product category">
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="relative">
              <input
                value={l.name}
                required={i === 0}
                onChange={(e) => { upd(i, { name: e.target.value }); setOpenRow(i); }}
                onFocus={() => setOpenRow(i)}
                onBlur={() => setTimeout(() => setOpenRow((r) => (r === i ? null : r)), 150)}
                placeholder="Type the product name"
                autoComplete="off"
                className={sel}
              />
              {sug.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-300 bg-white py-1 text-[15px] text-slate-900 shadow-lg">
                  {sug.map((t) => (
                    <li key={t}>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { upd(i, { name: t }); setOpenRow(null); }} className="block w-full px-3 py-1 text-left hover:bg-slate-100">{t}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input value={l.qty} onChange={(e) => upd(i, { qty: e.target.value })} placeholder="Qty" className={sel} aria-label="Quantity" />
            {lines.length > 1 ? (
              <button type="button" onClick={() => setLines((x) => x.filter((_, j) => j !== i))} className="px-2 text-[20px] text-slate-500 hover:text-red-600" aria-label="Remove product">×</button>
            ) : <span />}
          </div>
        );
      })}
      <button type="button" onClick={() => setLines((x) => [...x, { cat: x[x.length - 1].cat, name: "", qty: "" }])} className="text-[16px] font-medium text-brand-600 hover:underline">+ Add another product</button>
    </div>
  );
}

/** "Who is it for": one employee from the directory, or a whole group of staff. */
function ForWhom({ employees, value, onChange, group, setGroup }: { employees: { id: string; name: string }[]; value: string; onChange: (v: string) => void; group: string; setGroup: (v: string) => void }) {
  return (
    <>
      <Field label="Who is it for" tag="pick">
        <select name="forGroup" value={group} onChange={(e) => setGroup(e.target.value)} className={sel}>
          <option value="">One employee</option>
          {FOR_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </Field>
      {!group && <EmployeePick employees={employees} value={value} onChange={onChange} label="Employee" />}
    </>
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

function SupplierPick({ suppliers, value, onChange }: { suppliers: { id: string; name: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Supplier" tag="pick">
      <select name="supplierId" required value={value} onChange={(e) => onChange(e.target.value)} className={sel}>
        <option value="" disabled>Choose supplier…</option>
        {suppliers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        <option value="__new__">+ Add supplier</option>
      </select>
      {value === "__new__" && <input name="newSupplier" required placeholder="Supplier name" className={`${sel} mt-1`} />}
    </Field>
  );
}

function QuotePick({
  quotes, value, onChange, label, optional, customers,
}: {
  quotes: { id: string; number: string; customerName: string; value: number | null; createdAt: string }[];
  value: string; onChange: (v: string) => void; label: string; optional?: boolean;
  customers?: { id: string; name: string }[];
}) {
  const [cust, setCust] = useState("");
  return (
    <>
      <Field label={label} tag="pick">
        <select name="quotationId" required={!optional} value={value} onChange={(e) => onChange(e.target.value)} className={sel}>
          {optional ? <option value="">No quotation — other payment</option> : <option value="" disabled>Choose quotation…</option>}
          {quotes.map((q) => (
            <option key={q.id} value={q.id}>{q.number} · {q.customerName}{q.value ? ` · AED ${q.value.toLocaleString("en-US")}` : ""} · {fmt(q.createdAt)}</option>
          ))}
          <option value="__old__">Earlier quotation — raised before 11 Nov</option>
        </select>
      </Field>
      {value === "__old__" && (
        <>
          <Field label="Earlier quotation no." tag="type"><input name="oldNumber" required placeholder="Exactly as on the quotation" className={sel} /></Field>
          {customers && (
            <Field label="Customer" tag="pick">
              <select name="customerId" required value={cust} onChange={(e) => setCust(e.target.value)} className={sel}>
                <option value="" disabled>Choose customer…</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new__">+ Add customer</option>
              </select>
              {cust === "__new__" && <input name="newCustomer" required placeholder="Customer name" className={`${sel} mt-1`} />}
            </Field>
          )}
          <Field label="Value (AED)" tag="type"><input name="oldValue" inputMode="decimal" placeholder="Only if you know it" className={sel} /></Field>
        </>
      )}
    </>
  );
}

function BuildingUnit({
  data, required, noUnit, buildingId, setBuildingId, unitType, setUnitType, unitId, setUnitId,
}: {
  data: LogData; required: boolean; noUnit?: boolean; buildingId: string; setBuildingId: (v: string) => void;
  unitType: string; setUnitType: (v: string) => void; unitId: string; setUnitId: (v: string) => void;
}) {
  const b = data.buildings.find((x) => x.id === buildingId);
  const units = data.units.filter((u) => u.buildingId === buildingId);
  const label = UNIT_TYPES.find((u) => u.v === unitType)?.label ?? "";
  const chosen = units.find((u) => u.id === unitId);
  const aed = (n: number | null) => (n == null ? "—" : `AED ${n.toLocaleString("en-US")}`);
  return (
    <>
      <Field label={noUnit ? "Site" : "Building"} tag="pick">
        <select name="buildingId" required={required} value={buildingId} onChange={(e) => setBuildingId(e.target.value)} className={sel}>
          <option value="">{required ? "Choose building or site…" : "No building"}</option>
          {Array.from(new Set(data.buildings.map((x) => x.group ?? "Buildings"))).map((g) => (
            <optgroup key={g} label={g}>
              {data.buildings.filter((x) => (x.group ?? "Buildings") === g).map((x) => <option key={x.id} value={x.id}>{g === "Buildings" && x.code ? `${x.code} · ` : ""}{x.name}</option>)}
            </optgroup>
          ))}
        </select>
      </Field>
      {!noUnit && !b?.id.startsWith("site:") && (
      <Field label="Bill cycle and charges" tag="auto">
        <div className="rounded-md bg-slate-50 px-2 py-1.5 text-[14px] text-slate-600">
          {b ? (
            b.cycle ? (
              <>
                {b.cycle} · rate {b.rate ?? "—"}/m³ · pressure {b.pf ?? "—"} · monthly {aed(b.monthly)} · first bill {aed(b.first)}
                <br />
                Deposit {aed(b.deposit)} · connection {aed(b.connection)} · disconnection {aed(b.disconnection)}
              </>
            ) : (
              "No charges on the sheet for this building"
            )
          ) : (
            "Pick a building"
          )}
        </div>
      </Field>
      )}
      {b && !noUnit && !b.id.startsWith("site:") && (
        <>
          <input type="hidden" name="unitType" value={unitType} />
          <div className="sm:col-span-2">
            <Field label="Unit type" tag="pick">
              <div className="flex flex-wrap gap-2">
                {UNIT_TYPES.map((u) => <Chip key={u.v} on={unitType === u.v} onClick={() => setUnitType(u.v)}>{u.v === "Whole building" ? "Whole building / common" : u.v}</Chip>)}
              </div>
            </Field>
          </div>
          {unitType === "Apartment" && units.length > 0 && (
            <Field label="Flat" tag="pick">
              <select name="unitId" value={unitId} onChange={(e) => setUnitId(e.target.value)} className={sel}>
                <option value="">Choose flat…</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.flat} · {u.tenant ?? "vacant"}{u.status === "REFUND_PENDING" ? " · refund pending" : ""}</option>)}
                <option value="__typed__">Not on the list — type it</option>
              </select>
              {chosen && <p className="mt-0.5 text-[13px] text-slate-500">{chosen.tenant ?? "Vacant"}{chosen.status === "REFUND_PENDING" ? " · refund pending" : ""}</p>}
            </Field>
          )}
          {unitType !== "Whole building" && (unitType !== "Apartment" || units.length === 0 || unitId === "__typed__") && (
            <Field label={label || "Unit"} tag="type">
              <input name="unitText" required placeholder={unitType === "Kitchen" ? "e.g. Kitchen 3" : "e.g. 1204"} className={sel} />
            </Field>
          )}
        </>
      )}
    </>
  );
}
