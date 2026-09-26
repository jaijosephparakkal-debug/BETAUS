"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signOutWithReasonAction } from "@/app/logout/actions";

function formatElapsed(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand-600 px-3 py-1.5 text-[17px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Confirm sign out"}
    </button>
  );
}

const NINE_HOURS_MS = 9 * 60 * 60 * 1000;

export function AttendanceClock({ clockInIso }: { clockInIso: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(signOutWithReasonAction, {});
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!clockInIso) return;
    const clockIn = new Date(clockInIso).getTime();
    const tick = () => setElapsedMs(Date.now() - clockIn);
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [clockInIso]);

  const clockInTime = clockInIso
    ? new Date(clockInIso).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  const overNine = elapsedMs > NINE_HOURS_MS;

  return (
    <div className="relative flex items-center gap-3">
      {clockInTime && (
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[17px] ${
            overNine ? "bg-red-500/15 text-red-400" : "bg-brand-50 text-brand-700"
          }`}
          title={overNine ? "Working beyond 9 hours" : "Time since sign-in"}
        >
          <span aria-hidden>🕐</span>
          <span>In {clockInTime}</span>
          <span className="opacity-75">· {formatElapsed(elapsedMs)}</span>
          {overNine && <span className="font-semibold">· over 9h</span>}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[19px] text-slate-500 hover:text-slate-700"
      >
        Sign out
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-lg border border-brand-200 bg-surface p-3 shadow-lg">
          <form action={formAction} className="space-y-2">
            <label className="block text-[17px] font-medium text-slate-700">
              Why are you signing out?
            </label>
            <select
              name="reason"
              defaultValue=""
              required
              className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[17px]"
            >
              <option value="" disabled>
                Choose a reason…
              </option>
              <option value="OFFICE_USE">Going out for office use</option>
              <option value="SICKNESS">Leaving due to sickness</option>
              <option value="SHIFT_ENDED">Shift ended</option>
            </select>
            {state.error && <p className="text-[17px] text-red-600">{state.error}</p>}
            <div className="flex gap-2">
              <SubmitButton />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[17px] text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
