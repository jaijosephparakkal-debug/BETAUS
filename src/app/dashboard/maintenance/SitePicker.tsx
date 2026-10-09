"use client";

import { useRouter } from "next/navigation";

/** "Choose a site…" dropdown — picking one opens that site's page. */
export function SitePicker({
  label,
  sites,
}: {
  label: string;
  sites: { id: string; name: string }[];
}) {
  const router = useRouter();
  return (
    <select
      defaultValue=""
      onChange={(e) => e.target.value && router.push(`/dashboard/projects/${e.target.value}`)}
      className="w-full rounded-lg border border-brand-300 bg-white px-3 py-2 text-[17px] focus:border-brand-500 focus:outline-none"
      aria-label={`Choose a ${label} site`}
    >
      <option value="">Choose a {label} site…</option>
      {sites.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
