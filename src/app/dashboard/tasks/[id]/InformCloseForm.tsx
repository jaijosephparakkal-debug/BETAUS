"use client";

import { useFormState, useFormStatus } from "react-dom";
import { closeInformTaskAction } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
      {pending ? "Saving…" : "Close task"}
    </button>
  );
}

const box = "mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-[19px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

/** Closing an "Inform Abraham sir" task needs both: what was informed, and what Abraham sir decided. */
export default function InformCloseForm({ taskId }: { taskId: string }) {
  const [state, action] = useFormState(closeInformTaskAction.bind(null, taskId), {});
  return (
    <form action={action} className="space-y-3">
      <p className="text-[17px] text-slate-500">This task closes only once you have informed Abraham sir and written down what he decided.</p>
      <div>
        <label className="block text-[19px] font-medium text-slate-700">What was informed to Abraham sir</label>
        <textarea name="informed" rows={3} required className={box} placeholder="e.g. Visited the printer, quote is AED 4,200 for 500 catalogues, delivery in 7 days" />
      </div>
      <div>
        <label className="block text-[19px] font-medium text-slate-700">Decision taken by Abraham sir</label>
        <textarea name="decision" rows={3} required className={box} placeholder="e.g. Approved, go ahead with the printer; keep the budget under AED 4,500" />
      </div>
      <div>
        <label className="block text-[19px] font-medium text-slate-700">When he was informed</label>
        <input type="datetime-local" name="when" className={box} />
      </div>
      {state.error && <p className="text-[19px] text-red-600">{state.error}</p>}
      <Submit />
    </form>
  );
}
