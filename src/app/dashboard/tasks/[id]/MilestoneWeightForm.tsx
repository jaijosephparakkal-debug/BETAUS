"use client";

import { useFormState, useFormStatus } from "react-dom";
import { setMilestoneWeightAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save weight"}
    </button>
  );
}

export default function MilestoneWeightForm({
  taskId,
  initialWeight,
}: {
  taskId: string;
  initialWeight: number | null;
}) {
  const boundAction = setMilestoneWeightAction.bind(null, taskId);
  const [state, formAction] = useFormState(boundAction, {});

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div>
        <label htmlFor="weight" className="block text-[17px] font-medium text-slate-700">
          Weight (% of project)
        </label>
        <input
          id="weight"
          name="weight"
          type="number"
          min={0}
          max={100}
          defaultValue={initialWeight ?? ""}
          placeholder="—"
          className="mt-1 w-24 rounded-lg border border-brand-300 px-3 py-2 text-[19px] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <SubmitButton />
      {state.error && <p className="text-[17px] text-red-600">{state.error}</p>}
    </form>
  );
}
