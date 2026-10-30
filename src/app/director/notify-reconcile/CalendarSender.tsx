"use client";

import { useState } from "react";
import { sendCalendarEmailAction } from "./actions";

export default function CalendarSender() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [msg, setMsg] = useState("");

  async function send() {
    setState("sending");
    const res = await sendCalendarEmailAction();
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
      <button
        type="button"
        disabled={state !== "idle"}
        onClick={send}
        className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : state === "done" ? "Done" : "Send the whole calendar to all staff"}
      </button>
      {msg && <p className="text-[17px] text-slate-500">{msg}</p>}
    </div>
  );
}
