"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { logProgressAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-[17px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Log update"}
    </button>
  );
}

export default function ProgressForm({
  taskId,
  initialProgress,
}: {
  taskId: string;
  initialProgress: number;
}) {
  const boundAction = logProgressAction.bind(null, taskId);
  const [state, formAction] = useFormState(boundAction, {});
  const [progress, setProgress] = useState(initialProgress);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-[17px]">
          <label htmlFor="progress" className="font-medium text-slate-700">
            Progress
          </label>
          <span className="text-slate-500">{progress}%</span>
        </div>
        <input
          id="progress"
          name="progress"
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="mt-1 w-full accent-brand-600"
        />
      </div>
      <div>
        <label className="block text-[17px] font-medium text-slate-700">Update</label>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="What did you get done? Any blockers?"
          className="mt-1 w-full rounded-lg border border-brand-300 px-3 py-2 text-[17px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      {state.error && <p className="text-[17px] text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
