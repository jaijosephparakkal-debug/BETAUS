"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addEmployeeAction } from "./actions";

type Option = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-[19px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add employee"}
    </button>
  );
}

const inputCls = "w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]";

export default function AddEmployeeForm({
  companies,
  managers,
}: {
  companies: Option[];
  managers: (Option & { companyId: string })[];
}) {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [state, formAction] = useFormState(addEmployeeAction, {});

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[19px] text-brand-600 hover:underline">
        + Add employee
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-brand-200 bg-white p-4">
      <input name="name" required placeholder="Full name" className={inputCls} />
      <input name="email" type="email" required placeholder="Work email" className={inputCls} />
      <input name="title" required placeholder="Job title, e.g. Design Engineer" className={inputCls} />
      <input name="department" placeholder="Department (optional)" className={inputCls} />
      <select name="companyId" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputCls}>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select name="managerId" defaultValue="" className={inputCls} key={companyId}>
        <option value="">No manager</option>
        {managers
          .filter((m) => m.companyId === companyId)
          .map((m) => (
            <option key={m.id} value={m.id}>
              Reports to {m.name}
            </option>
          ))}
      </select>
      {state.error && <p className="text-[19px] text-red-600">{state.error}</p>}
      {state.ok && <p className="text-[19px] text-emerald-600">Employee added.</p>}
      <div className="flex gap-2">
        <SubmitButton />
        <button type="button" onClick={() => setOpen(false)} className="text-[19px] text-slate-500 hover:text-slate-700">
          Close
        </button>
      </div>
    </form>
  );
}
