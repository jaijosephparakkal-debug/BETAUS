import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, isManagingDirector } from "@/lib/auth";
import { getTasksFor, getAssignedTasksFor } from "@/lib/queries";
import { markTaskNotificationsRead } from "@/lib/notifications";
import { AssignToColleagueForm } from "./AssignToColleagueForm";
import { TaskList } from "./TaskList";

// A few people carry responsibilities at both companies (Shafeek —
// accounts, Antony — operations, Jai — marketing & content) without needing
// a separate login for each. For them the "add task" form offers a plain
// "worked for" company tag so their task list/report makes clear which
// company a given task was for.
const DUAL_COMPANY_EMAILS = ["finance@flaretechnical.com", "sales@gasneeds.com", "jai@gasneeds.com"];

export default async function MyTasksPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (isManagingDirector(membership)) redirect("/director");

  const showCompanyField = DUAL_COMPANY_EMAILS.includes(membership.user.email);

  await markTaskNotificationsRead(membership.id);

  // Anyone holding more than one company membership (e.g. Abraham, Jai) sees
  // their tasks merged across every company they belong to, tagged by
  // company, instead of only whichever company happens to be active.
  const allMemberships = await prisma.membership.findMany({
    where: { userId: membership.userId },
    include: { company: true },
  });
  const showCompanyTag = allMemberships.length > 1;

  const tasks: (Awaited<ReturnType<typeof getTasksFor>>[number] & { companySlug: string })[] = [];
  const assignedTasks: (Awaited<ReturnType<typeof getAssignedTasksFor>>[number] & { companySlug: string })[] = [];
  for (const m of allMemberships) {
    const mTasks = await getTasksFor(m.id);
    tasks.push(...mTasks.map((t) => ({ ...t, companySlug: m.company.slug })));
    const mAssigned = await getAssignedTasksFor(m.id);
    assignedTasks.push(...mAssigned.map((t) => ({ ...t, companySlug: m.company.slug })));
  }
  tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  assignedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
      <TaskList
        tasks={tasks}
        assignedTasks={assignedTasks}
        showCompanyTag={showCompanyTag}
        companies={companies}
      />
    </div>
  );
}
