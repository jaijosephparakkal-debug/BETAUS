"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendRolloutAction, sendRolloutMalayalamAction } from "./actions";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-xl bg-accent px-6 py-3 text-[19px] font-semibold text-on-accent shadow-md hover:opacity-90 disabled:opacity-60">
      {pending ? "Sending…" : "Send to all 12"}
    </button>
  );
}

export function SendButton({ alreadySent }: { alreadySent: boolean }) {
  const [state, action] = useFormState(sendRolloutAction, {});
  return (
    <form action={action} className="space-y-3">
      {alreadySent ? <p className="text-[19px] font-medium text-emerald-700">Already sent. Nothing more to do.</p> : <Btn />}
      {state.message && <p className="text-[18px] text-emerald-700">{state.message}</p>}
      {state.error && <p className="text-[18px] text-red-600">{state.error}</p>}
    </form>
  );
}

export function SendMalayalamButton({ alreadySent }: { alreadySent: boolean }) {
  const [state, action] = useFormState(sendRolloutMalayalamAction, {});
  return (
    <form action={action} className="space-y-3">
      {alreadySent ? (
        <p className="text-[19px] font-medium text-emerald-700">Malayalam email already sent.</p>
      ) : (
        <button type="submit" className="rounded-xl bg-accent px-6 py-3 text-[19px] font-semibold text-on-accent shadow-md hover:opacity-90">
          Send Malayalam email to Antony and Jayaprakash
        </button>
      )}
      {state.message && <p className="text-[18px] text-emerald-700">{state.message}</p>}
      {state.error && <p className="text-[18px] text-red-600">{state.error}</p>}
    </form>
  );
}
