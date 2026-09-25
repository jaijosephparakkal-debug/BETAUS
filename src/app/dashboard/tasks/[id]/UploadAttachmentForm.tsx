"use client";

import { useFormState, useFormStatus } from "react-dom";
import { uploadTaskAttachmentAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Uploading…" : "Upload"}
    </button>
  );
}

export function UploadAttachmentForm({ taskId }: { taskId: string }) {
  const boundAction = uploadTaskAttachmentAction.bind(null, taskId);
  const [state, formAction] = useFormState(boundAction, {});
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        name="file"
        required
        className="text-[19px] text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[19px] file:font-medium file:text-slate-700 hover:file:bg-slate-200"
      />
      <SubmitButton />
      {state.error && <p className="w-full text-[19px] text-red-600">{state.error}</p>}
    </form>
  );
}
