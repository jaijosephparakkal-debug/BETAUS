"use client";

import { useState, useTransition } from "react";
import { addBulkEntriesAction } from "../actions";

export default function BulkSave({ rows, disabled }: { rows: { date: string; in: string; out: string }[]; disabled: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending || disabled || msg?.startsWith("Saved") === true}
        onClick={() =>
          start(async () => {
            const r = await addBulkEntriesAction(rows);
            setMsg(r.error ?? `Saved ${r.added} shifts, flagged as manual entries.`);
          })
        }
        className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : `Save all ${rows.length} as manual entries`}
      </button>
      {disabled && <p className="text-[17px] text-red-600">The reconciliation window is closed.</p>}
      {msg && <p className="text-[19px] text-slate-700">{msg}</p>}
    </div>
  );
}
