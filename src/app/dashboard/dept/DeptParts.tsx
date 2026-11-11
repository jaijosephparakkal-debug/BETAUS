import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CompanyTag, formatDate } from "@/components/ui";

/** Page header: department, owner, month and ← → month buttons. */
export function DeptHeader({
  title,
  owner,
  path,
  month,
  amountsHidden,
}: {
  title: string;
  owner: string;
  path: string;
  month: { label: string; prev: string; next: string; isCurrent: boolean };
  amountsHidden: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-semibold text-slate-900">{title}</h1>
          <p className="text-[17px] text-slate-500">
            {owner} · {month.label}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[16px]">
          <Link href={`${path}?month=${month.prev}`} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">
            ← Previous
          </Link>
          {!month.isCurrent && (
            <>
              <Link href={`${path}?month=${month.next}`} className="rounded-md border border-brand-200 px-3 py-1.5 text-brand-600 hover:bg-brand-50">
                Next →
              </Link>
              <Link href={path} className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">
                This month
              </Link>
            </>
          )}
        </div>
      </div>
      {amountsHidden && (
        <p className="text-[14px] text-slate-400">Amounts are shown only to {owner}, Abraham and Jai.</p>
      )}
    </div>
  );
}

/** A row of month numbers. */
export function Stats({ items }: { items: { label: string; value: string | number; tone?: "good" | "warn" | "bad" }[] }) {
  const tone = { good: "text-emerald-600", warn: "text-amber-600", bad: "text-red-600" };
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((i) => (
        <div key={i.label} className="rounded-lg bg-surface p-3 shadow-sm">
          <div className={`text-[23px] font-semibold ${i.tone ? tone[i.tone] : "text-slate-900"}`}>{i.value}</div>
          <div className="text-[15px] text-slate-500">{i.label}</div>
        </div>
      ))}
    </div>
  );
}

export type Row = {
  id: string;
  href?: string;
  title: string;
  sub?: string;
  right?: string;
  badge?: { text: string; tone?: "good" | "warn" | "bad" | "plain" };
  company?: string | null;
  when?: Date | string | null;
};

/** A titled card listing rows; each row opens its task or record. */
export function Section({ title, rows, empty, extra }: { title: string; rows: Row[]; empty: string; extra?: ReactNode }) {
  const badgeTone = {
    good: "bg-emerald-500/15 text-emerald-700",
    warn: "bg-amber-500/15 text-amber-700",
    bad: "bg-red-500/15 text-red-700",
    plain: "bg-slate-100 text-slate-600",
  };
  return (
    <Card>
      <h2 className="mb-2 text-[21px] font-semibold text-slate-900">
        {title} — {rows.length}
      </h2>
      {extra}
      {rows.length === 0 ? (
        <p className="text-[17px] text-slate-500">{empty}</p>
      ) : (
        <div className="divide-y divide-brand-100">
          {rows.map((r) => {
            const body = (
              <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  {r.company && <CompanyTag slug={r.company} />}
                  <div className="min-w-0">
                    <div className="text-[18px] font-medium text-slate-900">{r.title}</div>
                    {(r.sub || r.when) && (
                      <div className="text-[15px] text-slate-500">
                        {r.sub}
                        {r.sub && r.when ? " · " : ""}
                        {r.when ? formatDate(r.when) : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[16px]">
                  {r.right && <span className="text-slate-600">{r.right}</span>}
                  {r.badge && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[14px] font-medium ${badgeTone[r.badge.tone ?? "plain"]}`}>
                      {r.badge.text}
                    </span>
                  )}
                </div>
              </div>
            );
            return r.href ? (
              <Link key={r.id} href={r.href} className="block hover:bg-brand-50/40">
                {body}
              </Link>
            ) : (
              <div key={r.id}>{body}</div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/** Reads a string field out of a work-log entry's details. */
export const d = (details: unknown, key: string): string => {
  const v = details && typeof details === "object" ? (details as Record<string, unknown>)[key] : null;
  return v == null ? "" : String(v);
};
export const dn = (details: unknown, key: string): number | null => {
  const v = details && typeof details === "object" ? (details as Record<string, unknown>)[key] : null;
  return typeof v === "number" ? v : null;
};
