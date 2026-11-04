"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";

export type TaskLinkItem = { id: string; url: string; label: string | null; addedBy: string; canRemove: boolean };

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add link"}
    </button>
  );
}

/**
 * The links box — used on tasks and approval requests. The add/remove server actions are passed in already
 * bound to the task or request; `canAdd` is false for people who may only look (e.g. a director auditing).
 */
export function TaskLinks({
  links,
  addAction,
  removeAction,
  canAdd = true,
}: {
  links: TaskLinkItem[];
  addAction: (prev: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string }>;
  removeAction: (linkId: string, formData: FormData) => Promise<void>;
  canAdd?: boolean;
}) {
  const [state, formAction] = useFormState(addAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const first = useRef(true);
  // Clear the boxes after a link is added successfully.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!state.error) formRef.current?.reset();
  }, [state]);
  return (
    <div className="space-y-3">
      {links.length === 0 ? (
        <p className="text-[19px] text-slate-500">No links shared yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {links.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 text-[19px]">
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 truncate font-medium text-brand-600 hover:underline"
              >
                {l.label || hostOf(l.url)}
              </a>
              <span className="flex shrink-0 items-center gap-2 text-[17px] text-slate-500">
                {hostOf(l.url)} · {l.addedBy}
                {l.canRemove && (
                  <form action={removeAction.bind(null, l.id)}>
                    <button type="submit" className="text-slate-400 hover:text-red-600" title="Remove this link" aria-label="Remove this link">
                      ✕
                    </button>
                  </form>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canAdd && (
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-wrap items-center gap-2 border-t border-brand-100 pt-3"
      >
        <input
          name="url"
          required
          inputMode="url"
          placeholder="Paste a link — Drive, e-invoice, Zoho…"
          className="min-w-[14rem] flex-1 rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
        />
        <input
          name="label"
          placeholder="Name (optional)"
          maxLength={120}
          className="w-44 rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
        />
        <AddButton />
        {state.error && <p className="w-full text-[19px] text-red-600">{state.error}</p>}
      </form>
      )}
    </div>
  );
}
