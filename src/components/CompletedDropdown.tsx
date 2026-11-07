import type { ReactNode } from "react";

/** Completed tasks stay closed until tapped, so lists show only what still needs doing. */
export function CompletedDropdown({ count, children }: { count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <details className="group rounded-lg border border-slate-200">
      <summary className="flex cursor-pointer select-none list-none items-center gap-2 rounded-lg px-3 py-2 text-[17px] font-semibold text-slate-600 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <span className="transition-transform group-open:rotate-90" aria-hidden>
          ▸
        </span>
        Completed ({count})
      </summary>
      <div className="px-2 pb-2">{children}</div>
    </details>
  );
}
