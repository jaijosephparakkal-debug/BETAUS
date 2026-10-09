import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, hasCompanyAccess } from "@/lib/auth";
import { getMaintenanceSites } from "@/lib/queries";
import { Card, StatusBadge } from "@/components/ui";
import { SitePicker } from "./SitePicker";

const TYPES = {
  AMC: { title: "AMC", subtitle: "Annual Maintenance Contract sites" },
  DLP: { title: "DLP", subtitle: "Defects Liability Period sites" },
} as const;

/** Flaretech's maintenance sites: AMC and DLP, each a dropdown plus the full list. */
export default async function MaintenancePage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  // Maintenance sites belong to Flaretech; checked by person so a director
  // signed in through either company can open them.
  const company = await prisma.company.findUnique({ where: { slug: "flaretechnical" } });
  if (!company || !(await hasCompanyAccess(membership, company.id))) notFound();

  const sites = await getMaintenanceSites(company.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">Maintenance</h1>
        <p className="mt-1 text-[19px] text-slate-500">
          Pick an AMC or DLP site to see its status and the tasks linked to it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(Object.keys(TYPES) as (keyof typeof TYPES)[]).map((type) => {
          const list = sites.filter((s) => s.type === type);
          return (
            <Card key={type}>
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-[23px] font-semibold text-slate-900">{TYPES[type].title}</h2>
                  <p className="text-[15px] text-slate-500">{TYPES[type].subtitle}</p>
                </div>
                <span className="text-[17px] text-slate-500">{list.length} sites</span>
              </div>
              <SitePicker label={type} sites={list} />
              <details className="mt-3">
                <summary className="cursor-pointer text-[17px] text-brand-600 hover:underline">
                  Show all {type} sites
                </summary>
                <div className="mt-2 divide-y divide-brand-100">
                  {list.map((s) => (
                    <Link
                      key={s.id}
                      href={`/dashboard/projects/${s.id}`}
                      className="flex items-center justify-between gap-3 py-2 hover:bg-brand-50/40"
                    >
                      <span className="min-w-0 break-words text-[17px] text-slate-900">{s.name}</span>
                      <span className="flex shrink-0 items-center gap-2 text-[15px] text-slate-500">
                        {s.openTasks > 0 && <span>{s.openTasks} open</span>}
                        {s.status !== "ACTIVE" && <StatusBadge status={s.status} />}
                      </span>
                    </Link>
                  ))}
                </div>
              </details>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
