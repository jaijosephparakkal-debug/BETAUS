"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestContentAction } from "./requestActions";
import { REQUEST_TYPES, MKT_FOR } from "@/lib/logOptions";

const sel = "w-full rounded-md border border-brand-300 px-2 py-1.5 text-[17px]";

function Send() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-brand-600 px-4 py-2 text-[17px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
      {pending ? "Sending…" : "Send request"}
    </button>
  );
}

export function RequestContent({ projects }: { projects: { id: string; name: string; number: string | null }[] }) {
  const [state, action] = useFormState(requestContentAction, {});
  return (
    <details className="rounded-lg border border-brand-200 bg-white p-3">
      <summary className="cursor-pointer text-[19px] font-semibold text-slate-900">Need a design, video or content? Ask Jai</summary>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-[16px] text-slate-600">What you need
          <select name="type" className={sel}>{REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="block text-[16px] text-slate-600">For
          <select name="for" className={sel}>{MKT_FOR.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="block text-[16px] text-slate-600">Project (if it is for one)
          <select name="projectId" className={sel} defaultValue="">
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.number ? ` · ${p.number}` : ""}</option>)}
          </select>
        </label>
        <label className="block text-[16px] text-slate-600">Needed by
          <input type="date" name="needBy" required className={sel} />
        </label>
        <label className="block text-[16px] text-slate-600">Link to the brief or files (Drive, Zoho…)
          <input name="link" placeholder="Optional" className={sel} />
        </label>
        <label className="block text-[16px] text-slate-600">Note (one line)
          <input name="note" maxLength={200} placeholder="Optional" className={sel} />
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Send />
          {state.error && <span className="text-[16px] text-red-600">{state.error}</span>}
          {state.ok && <span className="text-[16px] text-green-700">{state.ok}</span>}
        </div>
      </form>
    </details>
  );
}
