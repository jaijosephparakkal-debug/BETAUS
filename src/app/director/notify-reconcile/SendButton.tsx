"use client";

import { useState, useTransition } from "react";
import { sendReconcileNoticeAction, sendFlexieReminderAction } from "./actions";

export default function SendButton({ count }: { count: number }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending || result !== null}
        onClick={() =>
          start(async () => {
            const r = await sendReconcileNoticeAction();
            setResult(r.error ?? `Sent to ${r.sent} people${r.failed?.length ? `. Failed: ${r.failed.join(", ")}` : "."}`);
          })
        }
        className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : `Send to ${count} people`}
      </button>
      {result && <p className="text-[19px] text-slate-700">{result}</p>}
    </div>
  );
}

export function FlexieButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending || result !== null}
        onClick={() => start(async () => {
          const r = await sendFlexieReminderAction();
          setResult(r.error ?? "Reminder sent to Flexie.");
        })}
        className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reminder to Flexie now"}
      </button>
      {result && <p className="text-[19px] text-slate-700">{result}</p>}
    </div>
  );
}
