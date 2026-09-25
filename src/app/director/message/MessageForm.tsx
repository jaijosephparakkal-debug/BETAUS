"use client";

import { useFormState, useFormStatus } from "react-dom";
import { postMessageAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-[17px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Posting…" : "Post message"}
    </button>
  );
}

export default function MessageForm() {
  const [state, formAction] = useFormState(postMessageAction, {});
  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="body"
        rows={4}
        required
        placeholder="Write a message for everyone at the company…"
        className="w-full rounded-lg border border-brand-300 px-3 py-2 text-[17px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {state.error && <p className="text-[17px] text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
