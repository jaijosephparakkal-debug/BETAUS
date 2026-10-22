"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import { saveEntryAction, addEntryAction, deleteManualEntryAction } from "./actions";

const input = "rounded-md border border-brand-300 px-2 py-1 text-[17px]";

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-brand-600 px-3 py-1 text-[17px] font-medium text-white hover:bg-brand-700 disabled:opacity-60">
      {pending ? "Saving…" : label}
    </button>
  );
}

export function EntryForm({ entryId, inTime, outTime, canEditOut, note, disabled }: {
  entryId: string; inTime: string; outTime: string; canEditOut: boolean; note: string; disabled: boolean;
}) {
  const [state, action] = useFormState(saveEntryAction.bind(null, entryId), {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="in" type="time" defaultValue={inTime} required disabled={disabled} className={input} />
      <span className="text-slate-400">to</span>
      {canEditOut ? (
        <input name="out" type="time" defaultValue={outTime} required disabled={disabled} className={input} />
      ) : (
        <span className="text-[17px] text-slate-500">still logged in</span>
      )}
      <input name="note" defaultValue={note} placeholder="Reason for change" required disabled={disabled} className={`${input} w-56`} />
      {!disabled && <Save label="Save" />}
      {state.error && <span className="text-[15px] text-red-600">{state.error}</span>}
      {state.ok && <span className="text-[15px] text-emerald-600">Saved — flagged as manual</span>}
    </form>
  );
}

export function AddForm({ date, memberships, disabled, openEnded }: { date: string; memberships: { id: string; label: string }[]; disabled: boolean; openEnded?: boolean }) {
  const [state, action] = useFormState(addEntryAction, {});
  if (disabled) return null;
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="date" value={date} />
      {memberships.length > 1 ? (
        <select name="membershipId" className={input}>
          {memberships.map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
        </select>
      ) : (
        <input type="hidden" name="membershipId" value={memberships[0].id} />
      )}
      <input name="in" type="time" required className={input} />
      {openEnded ? (
        <span className="text-[15px] text-slate-500">logout comes when you sign out</span>
      ) : (
        <>
          <span className="text-slate-400">to</span>
          <input name="out" type="time" required className={input} />
        </>
      )}
      <input name="note" placeholder="Reason (e.g. forgot to log in)" required className={`${input} w-56`} />
      <Save label="Add shift" />
      {state.error && <span className="text-[15px] text-red-600">{state.error}</span>}
      {state.ok && <span className="text-[15px] text-emerald-600">Added — flagged as manual</span>}
    </form>
  );
}

export function RemoveButton({ entryId }: { entryId: string }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-[15px] text-red-600 hover:underline">
        Remove this manual entry
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-[15px]">
      <span className="text-slate-700">Remove this entry that was added by hand?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await deleteManualEntryAction(entryId);
            if (r.error) setErr(r.error);
          })
        }
        className="rounded bg-red-600 px-2 py-0.5 text-white disabled:opacity-60"
      >
        {pending ? "Removing…" : "Yes, remove"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-slate-500 hover:underline">
        Cancel
      </button>
      {err && <span className="text-red-600">{err}</span>}
    </span>
  );
}
