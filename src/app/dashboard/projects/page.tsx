import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getProjectsFor } from "@/lib/queries";
import { Card, ProgressBar, StatusBadge } from "@/components/ui";
import { AddProjectForm } from "./ProjectForms";

export default async function ProjectsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const projects = await getProjectsFor(membership.companyId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-[19px] text-slate-500">
          Every project at {membership.company.name}, and how far along it is
          based on the tasks linked to it.
        </p>
      </div>

      <AddProjectForm />

      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
            <Card className="transition hover:border-brand-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[21px] font-medium text-slate-900">{p.name}</span>
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
