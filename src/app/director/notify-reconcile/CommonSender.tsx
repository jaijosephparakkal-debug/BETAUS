"use client";

import { useState } from "react";
import { sendCommonEmailAction } from "./actions";

export default function CommonSender({ people, recipientCount }: { people: { name: string; absent: string[]; noLogout: string[] }[]; recipientCount: number }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [msg, setMsg] = useState("");

  async function send() {
    setState("sending");
    const res = await sendCommonEmailAction();
    if (res.ok) {
      setState("done");
      setMsg(`Sent to ${res.sent} people`);
    } else {
      setState("idle");
      setMsg(res.error || "Failed");
    }
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1 text-[19px] text-slate-700">
        {people.map((p) => (
          <li key={p.name}>
            {p.name}{" "}
            <span className="text-slate-400">
              {p.absent.length ? `· absent ${p.absent.join(", ")} ` : ""}
              {p.noLogout.length ? `· no logout ${p.noLogout.join(", ")}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={state !== "idle" || people.length === 0}
        onClick={send}
        className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : state === "done" ? "Done" : `Send one common email to ${recipientCount} people`}
      </button>
      {msg && <p className="text-[17px] text-slate-500">{msg}</p>}
    </div>
  );
}
