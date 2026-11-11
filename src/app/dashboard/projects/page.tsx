import Link from "next/link";
import { canSeeProjects } from "@/lib/teams";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getProjectsFor } from "@/lib/queries";
import { Card, ProgressBar, StatusBadge, CompanyTag } from "@/components/ui";
import { prisma } from "@/lib/db";
import { AddProjectForm } from "./ProjectForms";
import { canAddProjects } from "@/lib/teams";
import { getPotentialProjects } from "@/lib/potentialProjects";
import { convertPotentialAction, closePotentialAction } from "./potentialActions";

export default async function ProjectsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!canSeeProjects(membership)) redirect("/dashboard");

  // Directors (admins) see the projects of both companies, each tagged; everyone else sees their own company's.
  const companies = membership.isDirector
    ? await prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    : [];
  const projects = await getProjectsFor(membership.isDirector ? companies.map((c) => c.id) : membership.companyId);

  // Saroj's potential projects (tenders being estimated) — Flaretech only.
  const ft = await prisma.company.findUnique({ where: { slug: "flaretechnical" } });
  const showPotential = !!ft && (membership.isDirector || membership.companyId === ft.id);
  const potentials = showPotential && ft ? await getPotentialProjects(ft.id) : [];
  const open = potentials.filter((p) => !p.closed);
  const closed = potentials.filter((p) => p.closed);
  const ftProjects = ft ? projects.filter((p) => p.companySlug === "flaretechnical" && p.status !== "COMPLETED") : [];
  const canAct = canAddProjects(membership) && !membership.viewingAs;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-[19px] text-slate-500">
          Every project at {membership.isDirector ? "both companies" : membership.company.name}, and how far along it is
          based on the tasks linked to it.
        </p>
      </div>

      <AddProjectForm companies={companies} defaultCompanyId={membership.companyId} />

      {showPotential && (
        <Card>
          <h2 className="text-[21px] font-semibold text-slate-900">Potential projects — {open.length}</h2>
          <p className="mb-2 text-[16px] text-slate-500">
            Tenders Saroj is estimating that are not a project yet. When one is won, link it to its project: all its estimates,
            quotations, visits and calls move onto that project.
          </p>
          {open.length === 0 ? (
            <p className="text-[17px] text-slate-500">None open.</p>
          ) : (
            <div className="divide-y divide-brand-100">
              {open.map((p) => (
                <div key={p.name} className="py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[18px] font-medium text-slate-900">{p.name}</span>
                    {p.quoteStatus && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[14px] text-slate-600">{p.quoteStatus}</span>}
                  </div>
                  <div className="text-[15px] text-slate-500">
                    {p.estimates.join(", ") || "No estimation no. yet"} · {p.entries} entr{p.entries === 1 ? "y" : "ies"} · last{" "}
                    {p.lastAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai" })}
                  </div>
                  {canAct && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <form action={convertPotentialAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="name" value={p.name} />
                        <select name="projectId" required defaultValue="" className="rounded-md border border-brand-300 px-2 py-1 text-[16px]">
                          <option value="" disabled>Became project…</option>
                          {ftProjects.map((x) => <option key={x.id} value={x.id}>{x.name}{x.number ? ` · ${x.number}` : ""}</option>)}
                        </select>
                        <button type="submit" className="rounded-md bg-brand-600 px-2.5 py-1 text-[16px] text-white hover:bg-brand-700">Link</button>
                      </form>
                      <form action={closePotentialAction} className="flex items-center gap-2">
                        <input type="hidden" name="name" value={p.name} />
                        <select name="outcome" defaultValue="Not awarded" className="rounded-md border border-brand-300 px-2 py-1 text-[16px]">
                          <option>Not awarded</option>
                          <option>Cancelled by client</option>
                        </select>
                        <button type="submit" className="rounded-md border border-brand-300 px-2.5 py-1 text-[16px] text-brand-700 hover:bg-brand-50">Close</button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {closed.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[16px] text-slate-500">Closed — {closed.length}</summary>
              {closed.map((p) => (
                <div key={p.name} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-[16px] text-slate-600">
                  <span>{p.name} · {p.estimates.join(", ")} · {p.closed}</span>
                  {canAct && (
                    <form action={closePotentialAction}>
                      <input type="hidden" name="name" value={p.name} />
                      <input type="hidden" name="outcome" value="Reopen" />
                      <button type="submit" className="text-brand-600 hover:underline">Reopen</button>
                    </form>
                  )}
                </div>
              ))}
            </details>
          )}
          {canAct && (
            <p className="mt-2 text-[14px] text-slate-400">Add the real project above first if it is not in the list yet.</p>
          )}
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
            <Card className="transition hover:border-brand-200">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[21px] font-medium text-slate-900">
                  {membership.isDirector && <CompanyTag slug={p.companySlug} />}
                  {p.name}
                </span>
                <StatusBadge status={p.status} />
              </div>
              {p.number && (
                <div className="text-[17px] text-slate-500">{p.number}</div>
              )}
              <div className="mt-3">
                <ProgressBar value={p.avgProgress} />
              </div>
              <div className="mt-2 text-[17px] text-slate-500">
                {p.completedTasks}/{p.taskCount} task{p.taskCount === 1 ? "" : "s"} completed
              </div>
              {p.siteTaskCount > 0 && (
                <div className="text-[17px] text-slate-500">
                  Site work: <span className="font-medium text-emerald-600">{p.siteWeightFulfilled}%</span> of weight
                  fulfilled · {p.siteTaskCount} required tasks
                </div>
              )}
            </Card>
          </Link>
        ))}
        {projects.length === 0 && (
          <p className="text-[19px] text-slate-500">No projects yet.</p>
        )}
      </div>
    </div>
  );
}
