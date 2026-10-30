"use client";

import { useState } from "react";
import { sendOutstandingReminderAction } from "./actions";

type Person = { name: string; email: string; days: string[]; autoFivePm: boolean };

export default function OutstandingSender({ people }: { people: Person[] }) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const sendable = people.filter((p) => p.days.length > 0 || p.autoFivePm);

  async function sendAll() {
    setRunning(true);
    for (const p of sendable) {
      setStatus((s) => ({ ...s, [p.email]: "Sending…" }));
      const res = await sendOutstandingReminderAction(p.email);
      setStatus((s) => ({ ...s, [p.email]: res.ok ? "Sent" : res.error || "Failed" }));
      await new Promise((x) => setTimeout(x, 700));
    }
    setRunning(false);
    setDone(true);
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1 text-[19px] text-slate-700">
        {people.map((p) => (
          <li key={p.email} className="flex flex-wrap items-center gap-3">
            <span>
              {p.name} <span className="text-slate-400">· {p.days.length ? p.days.join(", ") : "—"}{p.autoFivePm ? " · 29 Oct auto 5 PM" : ""}</span>
            </span>
            {status[p.email] && (
              <span className={status[p.email] === "Sent" ? "text-[17px] text-emerald-600" : "text-[17px] text-slate-500"}>{status[p.email]}</span>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={running || done || sendable.length === 0}
        onClick={sendAll}
        className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {running ? "Sending…" : done ? "Done" : `Send follow-up to ${sendable.length} people`}
      </button>
    </div>
  );
}
