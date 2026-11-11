"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createProjectLogAction } from "./projectLogActions";
import { SITE_STAGES, OTHER_STAGE, stageOf, NEW_ESTIMATE, type PField, type PProfile } from "@/lib/projectLogOptions";

export type ProjectLogData = {
  profile: PProfile;
  projects: { id: string; name: string; number: string | null; sites: { id: string; title: string; progress: number; weight: number | null }[] }[];
  customers: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  /** Names used before (people met, emailed, inspectors), offered as suggestions. */
  names: string[];
  /** Saroj: estimation numbers already given (newest first), and the next one. */
  estimates: { number: string; label: string }[];
  nextEstimate: string;
  /** Saroj: potential projects (tenders) already named, newest first. */
  potentials: string[];
};

const sel = "w-full rounded-md border border-brand-300 px-2 py-1.5 text-[17px]";
const BACKDATE_REASONS = ["Forgot to log it", "Was on site with no network", "Was away from the office", "Other"];
const dubaiNow = () => new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[14px] text-slate-600">{label}</label>
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
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

/** Flaretech project team form: project → site task (from that project's own list) → what was done, all picked. */
export function ProjectLogForm({ data }: { data: ProjectLogData }) {
  const [state, formAction] = useFormState(createProjectLogAction, {});
  const { profile } = data;
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  const [kindV, setKindV] = useState(profile.kinds[0].v);
  const kind = profile.kinds.find((k) => k.v === kindV)!;
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? "none");
  const [stage, setStage] = useState("");
  const [siteId, setSiteId] = useState("");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [eventAt, setEventAt] = useState(dubaiNow());
  const [next, setNext] = useState("none");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [saved, setSaved] = useState("");
  const [newPot, setNewPot] = useState("");

  const project = data.projects.find((p) => p.id === projectId) ?? null;
  const potentialMode = kind.project === "potential";
  const allowed = kind.stages ?? [];
  // Stages offered: the kind's stages that this project actually has tasks in, in the kind's order.
  const stages = useMemo(() => {
    if (!project) return [];
    const has = new Set(project.sites.map((x) => stageOf(x.title)));
    return allowed.filter((st) => has.has(st));
  }, [project, allowed]);
  const order = useMemo(() => new Map(SITE_STAGES.flatMap((st) => st.tasks.map((t, i) => [t, i] as const))), []);
  const siteList = project ? project.sites.filter((x) => stageOf(x.title) === stage).sort((a, b) => (order.get(a.title) ?? 99) - (order.get(b.title) ?? 99)) : [];
  const site = project?.sites.find((x) => x.id === siteId) ?? null;
  const recentSites = project ? recent.map((id) => project.sites.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x && allowed.includes(stageOf(x.title))) : [];
  const old = Date.now() + 4 * 3600 * 1000 - new Date(`${eventAt}:00Z`).getTime() > 7 * 86400000;

  // Defaults for the picked fields whenever the kind or site task changes.
  useEffect(() => {
    const v: Record<string, string> = {};
    for (const f of kind.fields) {
      if ((f.type === "chips" || f.type === "select" || f.type === "who") && f.options?.length && !f.optional) v[f.k] = f.options[0];
      if (f.type === "progress") v[f.k] = String(Math.min((site?.progress ?? 0) + 10, 100));
      if (f.type === "estimate") v[f.k] = kindV !== "est" && data.estimates.length ? data.estimates[0].number : NEW_ESTIMATE;
    }
    setVals(v);
  }, [kindV, siteId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Switching between potential-project kinds and the others keeps the project choice valid.
  useEffect(() => {
    const isPot = projectId === "__newpot__" || projectId.startsWith("pot:");
    if (potentialMode && !isPot) setProjectId(data.potentials[0] ? `pot:${data.potentials[0]}` : "__newpot__");
    if (!potentialMode && isPot) setProjectId(data.projects[0]?.id ?? "none");
  }, [kindV]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (kind.site === "optional") setStage("");
    else if (!stages.includes(stage)) setStage(stages[0] ?? "");
    setSiteId("");
  }, [projectId, kindV]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember the last project, kind and site tasks on this device.
  const store = `projectLog:${profile.name}`;
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(store) || "{}");
      if (p.kind && profile.kinds.some((k) => k.v === p.kind)) setKindV(p.kind);
      if (p.project && (data.projects.some((x) => x.id === p.project) || data.potentials.some((n) => `pot:${n}` === p.project))) setProjectId(p.project);
      if (Array.isArray(p.recent)) setRecent(p.recent.slice(0, 5));
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!state.ok) return;
    const r = siteId ? [siteId, ...recent.filter((x) => x !== siteId)].slice(0, 5) : recent;
    // A potential project just added becomes the selected one next time.
    const used = projectId === "__newpot__" && newPot.trim() ? `pot:${newPot.replace(/\s+/g, " ").trim()}` : projectId;
    if (used !== projectId) setProjectId(used);
    setNewPot("");
    try {
      localStorage.setItem(store, JSON.stringify({ kind: kindV, project: used, recent: r }));
    } catch {}
    setRecent(r);
    setSaved(state.ok);
    setOpen(false);
    setSiteId("");
    setNext("none");
    setEventAt(dubaiNow());
    setKey((k) => k + 1);
    const t = setTimeout(() => setSaved(""), 3000);
    return () => clearTimeout(t);
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) {
    return (
      <>
        {saved && <div className="toast-in fixed left-1/2 top-4 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-[17px] font-medium text-white shadow-lg">✓ {saved}</div>}
        <button type="button" onClick={() => setOpen(true)} className="text-[19px] text-brand-600 hover:underline">
          + Log project work
        </button>
      </>
    );
  }

  const setV = (k: string, v: string) => setVals((p) => ({ ...p, [k]: v }));
  const needsProject = (kind.project ?? "required") === "required";

  return (
    <form key={key} action={formAction} className="space-y-4 rounded-lg border border-brand-200 p-3">
      <input type="hidden" name="kind" value={kindV} />
      <input type="hidden" name="siteTaskId" value={siteId} />
      {Object.entries(vals).map(([k, v]) => <input key={k} type="hidden" name={`f_${k}`} value={v} />)}

      <div className="text-[15px] text-slate-500">{profile.name} · {profile.role}</div>

      <Field label="1. What did you do">
        <div className="flex flex-wrap gap-2">
          {profile.kinds.map((k) => <Chip key={k.v} on={kindV === k.v} onClick={() => setKindV(k.v)}>{k.l}</Chip>)}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        {potentialMode ? (
          <Field label="2. Potential project (or an existing project, for a variation)">
            <select name="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={sel}>
              <optgroup label="Potential projects — not a project yet">
                {data.potentials.map((n) => <option key={n} value={`pot:${n}`}>{n}</option>)}
                <option value="__newpot__">+ Add potential project</option>
              </optgroup>
              <optgroup label="Existing projects">
                {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.number ? ` · ${p.number}` : ""}</option>)}
              </optgroup>
            </select>
            {projectId === "__newpot__" && <input name="newPotential" required maxLength={120} value={newPot} onChange={(e) => setNewPot(e.target.value)} placeholder="Name of the potential project, e.g. Al Barsha Villas" className={`${sel} mt-1`} />}
          </Field>
        ) : (
        <Field label="2. Project">
          <select name="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={sel}>
            {!needsProject && <option value="none">Not a project yet (tender or enquiry)</option>}
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.number ? ` · ${p.number}` : ""}</option>)}
          </select>
        </Field>
        )}
        {!project && !needsProject && !potentialMode && (
          <Field label="Client or tender">
            <select name="customerId" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={sel}>
              <option value="">Not needed</option>
              {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new__">+ Add client</option>
            </select>
            {customerId === "__new__" && <input name="newCustomer" required placeholder="Client or tender name" className={`${sel} mt-1`} />}
          </Field>
        )}
      </div>

      {kind.site !== "none" && project && (
        <div className="space-y-2">
          <Field label={`3. Site task${kind.site === "optional" ? " (optional)" : ""} — from ${project.name}'s list`}>
            {recentSites.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-[14px] text-slate-500">Recent:</span>
                {recentSites.map((x) => <Chip key={x.id} on={siteId === x.id} onClick={() => { setStage(stageOf(x.title)); setSiteId(x.id); }}>{x.title}</Chip>)}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {kind.site === "optional" && <Chip on={!siteId && stage === ""} onClick={() => { setStage(""); setSiteId(""); }}>Whole project</Chip>}
              {stages.map((st) => (
                <Chip key={st} on={stage === st} onClick={() => { setStage(st); setSiteId(""); }}>
                  {st} · {project.sites.filter((x) => stageOf(x.title) === st).length}
                </Chip>
              ))}
            </div>
          </Field>
          {stage && (
            <div className="max-h-72 overflow-y-auto rounded-md border border-brand-100">
              {siteList.map((x) => (
                <button
                  type="button"
                  key={x.id}
                  onClick={() => setSiteId(x.id)}
                  className={`flex w-full items-center justify-between gap-2 border-b border-brand-50 px-3 py-2 text-left text-[16px] ${siteId === x.id ? "bg-brand-100 text-brand-800" : "hover:bg-brand-50/50"}`}
                >
                  <span>{x.title}</span>
                  <span className="shrink-0 text-[14px] text-slate-500">{x.progress}%{x.weight != null ? ` · weight ${x.weight}%` : ""}</span>
                </button>
              ))}
              {stage === OTHER_STAGE && siteList.length === 0 && <p className="p-3 text-[15px] text-slate-500">No other tasks on this project.</p>}
            </div>
          )}
        </div>
      )}
      {kind.site === "required" && !project && <p className="text-[15px] text-amber-700">Choose a project to see its site tasks.</p>}

      {(kind.site === "none" || site || kind.site === "optional") && (
        <div className="grid gap-3 sm:grid-cols-2">
          {kind.fields.map((f) => <FieldInput key={f.k} f={f} vals={vals} setV={setV} site={site} suppliers={data.suppliers} supplierId={supplierId} setSupplierId={setSupplierId} estimates={data.estimates} nextEstimate={data.nextEstimate} />)}
          <datalist id="pl-names">{data.names.map((n) => <option key={n} value={n} />)}</datalist>
        </div>
      )}

      <div className="grid gap-3 border-t border-brand-100 pt-3 sm:grid-cols-2">
        <Field label="When (Dubai time)">
          <input type="datetime-local" name="eventAt" required value={eventAt} onChange={(e) => setEventAt(e.target.value)} className={sel} />
        </Field>
        {old && (
          <Field label="Why is it entered late?">
            <select name="reason" required defaultValue="" className={sel}>
              <option value="" disabled>Choose…</option>
              {BACKDATE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
        )}
        <Field label="Next step">
          <select name="nextStep" value={next} onChange={(e) => setNext(e.target.value)} className={sel}>
            <option value="none">None</option>
            <option value="followup">Follow up myself</option>
          </select>
        </Field>
        {next === "followup" && (
          <Field label="Follow up on">
            <input type="datetime-local" name="dueAt" required className={sel} />
          </Field>
        )}
        <div className="sm:col-span-2">
          <Field label="Note (optional, one line)">
            <input name="note" maxLength={200} placeholder="Only if the next person needs to know something" className={sel} />
          </Field>
        </div>
      </div>

      {state.error && <p className="text-[17px] text-red-600">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Submit />
        <button type="button" onClick={() => setOpen(false)} className="text-[18px] text-slate-500 hover:text-slate-700">Cancel</button>
      </div>
    </form>
  );
}

function FieldInput({
  f, vals, setV, site, suppliers, supplierId, setSupplierId, estimates, nextEstimate,
}: {
  estimates: { number: string; label: string }[];
  nextEstimate: string;
  f: PField;
  vals: Record<string, string>;
  setV: (k: string, v: string) => void;
  site: { progress: number } | null;
  suppliers: { id: string; name: string }[];
  supplierId: string;
  setSupplierId: (v: string) => void;
}) {
  if (f.showIf && !f.showIf.in.includes(vals[f.showIf.k] ?? "")) return null;
  const label = `${f.label}${f.optional ? " (optional)" : ""}`;
  if (f.type === "chips") {
    return (
      <div className="sm:col-span-2">
        <Field label={label}>
          <div className="flex flex-wrap gap-2">
            {f.options!.map((o) => <Chip key={o} on={vals[f.k] === o} onClick={() => setV(f.k, o)}>{o}</Chip>)}
          </div>
        </Field>
      </div>
    );
  }
  if (f.type === "select") {
    return (
      <Field label={label}>
        <select value={vals[f.k] ?? ""} onChange={(e) => setV(f.k, e.target.value)} className={sel}>
          {f.optional && <option value="">—</option>}
          {f.options!.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
    );
  }
  if (f.type === "estimate") {
    return (
      <Field label={f.label}>
        <select value={vals[f.k] ?? NEW_ESTIMATE} onChange={(e) => setV(f.k, e.target.value)} className={sel}>
          <option value={NEW_ESTIMATE}>New number — {nextEstimate} (given when saved)</option>
          {estimates.map((e) => <option key={e.number} value={e.number}>{e.number} · {e.label}</option>)}
        </select>
      </Field>
    );
  }
  if (f.type === "who") {
    return (
      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
        <Field label={label}>
          <select value={vals[f.k] ?? ""} onChange={(e) => setV(f.k, e.target.value)} className={sel}>
            {f.optional && <option value="">—</option>}
            {f.options!.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label={`Name${f.nameOptional ? " (optional)" : ""}`}>
          <input
            list="pl-names"
            required={!f.nameOptional}
            value={vals[`${f.k}Name`] ?? ""}
            onChange={(e) => setV(`${f.k}Name`, e.target.value)}
            placeholder="Pick a saved name or type it once"
            className={sel}
          />
        </Field>
      </div>
    );
  }
  if (f.type === "progress") {
    if (!site) return null;
    const done = vals.work === "Completed";
    const v = done ? 100 : Number(vals[f.k] ?? site.progress);
    return (
      <div className="sm:col-span-2">
        <Field label={`${f.label}: ${v}% (was ${site.progress}%)`}>
          <input type="range" min={0} max={100} step={5} value={v} disabled={done} onChange={(e) => setV(f.k, e.target.value)} className="w-full" />
        </Field>
      </div>
    );
  }
  if (f.type === "supplier") {
    return (
      <Field label={label}>
        <select name="supplierId" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={sel}>
          <option value="">{f.optional ? "—" : "Choose supplier…"}</option>
          {suppliers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          <option value="__new__">+ Add supplier</option>
        </select>
        {supplierId === "__new__" && <input name="newSupplier" required placeholder="Supplier name" className={`${sel} mt-1`} />}
      </Field>
    );
  }
  const type = f.type === "date" ? "date" : "text";
  return (
    <Field label={label}>
      <input
        type={type}
        inputMode={f.type === "amount" || f.type === "number" ? "decimal" : undefined}
        required={!f.optional}
        value={vals[f.k] ?? ""}
        onChange={(e) => setV(f.k, e.target.value)}
        placeholder={f.placeholder ?? (f.type === "amount" ? "12500" : f.type === "number" ? "8" : undefined)}
        className={sel}
      />
    </Field>
  );
}
