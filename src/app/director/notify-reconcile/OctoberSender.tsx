"use client";

import { useState } from "react";
import { sendOctoberAttendanceAction } from "./actions";

export default function OctoberSender({ recipients }: { recipients: { name: string; email: string }[] }) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  async function sendAll() {
    setRunning(true);
    for (const r of recipients) {
      setStatus((s) => ({ ...s, [r.email]: "Sending…" }));
      const res = await sendOctoberAttendanceAction(r.email);
      setStatus((s) => ({ ...s, [r.email]: res.ok ? "Sent" : res.error || "Failed" }));
      await new Promise((x) => setTimeout(x, 700));
    }
    setRunning(false);
    setDone(true);
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1 text-[19px] text-slate-700">
        {recipients.map((r) => (
          <li key={r.email} className="flex flex-wrap items-center gap-3">
            <span>
              {r.name} <span className="text-slate-400">· {r.email}</span>
            </span>
            <a href={`/api/reports/october-attendance?email=${encodeURIComponent(r.email)}`} target="_blank" className="text-[17px] text-brand-600 hover:underline">
              Preview PDF
            </a>
            {status[r.email] && (
              <span className={status[r.email] === "Sent" ? "text-[17px] text-emerald-600" : "text-[17px] text-slate-500"}>{status[r.email]}</span>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={running || done}
        onClick={sendAll}
        className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {running ? "Sending…" : done ? "Done" : `Send to ${recipients.length} people`}
      </button>
    </div>
  );
}
