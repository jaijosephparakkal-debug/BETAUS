import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { getTasksFor } from "@/lib/queries";
import { markTaskNotificationsRead } from "@/lib/notifications";
import { Card, ProgressBar, StatusBadge, formatDate, isOverdue } from "@/components/ui";
import { AssignToColleagueForm } from "./AssignToColleagueForm";

// A few people carry responsibilities at both companies (Shafeek —
// accounts, Antony — operations, Jai — marketing & content) without needing
// a separate login for each. For them the "add task" form offers a plain
// "worked for" company tag so their task list/report makes clear which
// company a given task was for.
const DUAL_COMPANY_EMAILS = ["finance@flaretechnical.com", "sales@gasneeds.com", "jai@gasneeds.com"];

export default async function MyTasksPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const showCompanyField = DUAL_COMPANY_EMAILS.includes(membership.user.email);

  await markTaskNotificationsRead(membership.id);

  // Sequential rather than Promise.all — see dashboard/layout.tsx for why.
  const tasks = await getTasksFor(membership.id);
  const projects = await prisma.project.findMany({
    where: { companyId: membership.companyId },
    select: { id: true, name: true, number: true },
    orderBy: { number: "asc" },
  });
  const titlePresets = await prisma.taskTitlePreset.findMany({
    where: { membershipId: membership.id },
    orderBy: { createdAt: "asc" },
    select: { title: true },
  });
  const companies = showCompanyField
    ? await prisma.company.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">My Tasks</h1>
      <AssignToColleagueForm
        selfId={membership.id}
        titleOptions={titlePresets.map((p) => p.title)}
        projects={projects}
        companyOptions={companies}
      />
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id}>
            <Link href={`/dashboard/tasks/${task.id}`} className="block hover:opacity-90">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[21px] font-medium text-slate-900">{task.title}</span>
                <StatusBadge status={task.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {task.project && (
                  <span className="text-[17px] text-brand-600">
                    {task.project.number
                      ? `${task.project.number} — ${task.project.name}`
                      : task.project.name}
                  </span>
                )}
                {task.workedForCompany && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[15px] text-slate-600">
                    For:{" "}
                    {companies.find((c) => c.slug === task.workedForCompany)?.name ??
                      task.workedForCompany}
                  </span>
                )}
                {task.category && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[15px] text-brand-700">
                    {task.category}
                    {task.phase ? ` · ${task.phase}` : ""}
                  </span>
                )}
              </div>
              {task.description && (
                <p className="mt-1 text-[19px] text-slate-600">{task.description}</p>
              )}
              <div className="mt-3">
                <ProgressBar value={task.progress} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[17px] text-slate-500">
                <span>Assigned by {task.assignedBy.user.name}</span>
                <span className={isOverdue(task.deadline, task.status) ? "font-medium text-red-600" : ""}>
                  Due {formatDate(task.deadline)}
                </span>
              </div>
            </Link>
            {task.subtasks.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-brand-100 pt-3">
                <div className="text-[17px] font-medium text-slate-500">
                  Daily tasks —{" "}
                  {task.subtasks.filter((s) => s.status === "COMPLETED").length}/
                  {task.subtasks.length} done
                </div>
                {task.subtasks.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/dashboard/tasks/${sub.id}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[19px] hover:bg-brand-50/40"
                  >
                    <span className="text-slate-800">{sub.title}</span>
                    <StatusBadge status={sub.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        ))}
        {tasks.length === 0 && (
          <p className="text-[19px] text-slate-500">No tasks assigned yet.</p>
        )}
      </div>
    </div>
  );
}
