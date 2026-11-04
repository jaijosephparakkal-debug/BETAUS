"use client";

import { useState } from "react";
import Link from "next/link";

export type LibraryLink = { id: string; url: string; label: string; host: string; taskId: string; taskTitle: string; addedBy: string; date: string };

/** Every link on Accounts tasks, with a search box. */
export function LinkLibrary({ links }: { links: LibraryLink[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? links.filter((l) => `${l.label} ${l.host} ${l.taskTitle} ${l.addedBy}`.toLowerCase().includes(needle))
    : links;
  if (links.length === 0) {
    return <p className="text-[19px] text-slate-500">No links yet. Links added to Accounts tasks collect here.</p>;
  }
  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search links…"
        className="w-full rounded-md border border-brand-300 px-2 py-1.5 text-[19px]"
      />
      {shown.length === 0 ? (
        <p className="text-[19px] text-slate-500">No links match.</p>
      ) : (
        <ul className="divide-y divide-brand-100">
          {shown.map((l) => (
            <li key={l.id} className="py-2">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[19px] font-medium text-brand-600 hover:underline">
                {l.label}
              </a>
              <div className="text-[15px] text-slate-500">
                {l.host} · on{" "}
                <Link href={`/dashboard/tasks/${l.taskId}`} className="hover:underline">
                  {l.taskTitle}
                </Link>{" "}
                · {l.addedBy} · {l.date}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
