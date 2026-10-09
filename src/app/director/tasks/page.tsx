import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, canManageAllStaff } from "@/lib/auth";
import { Card, CompanyTag, ProgressBar, StatusBadge, formatDate, isOverdue } from "@/components/ui";

const STATUS_FILTERS = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
  overdue: "Overdue",
} as const;
type StatusFilter = keyof typeof STATUS_FILTERS;

/** Every task at both companies in one list — what the Overview's task numbers open into. */
export default async function DirectorTasksPage({
  searchParams,
}: {
  searchParams: { status?: string; company?: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  const company = companies.find((c) => c.slug === searchParams.company) ?? null;
  const status = STATUS_FILTERS[searchParams.status as StatusFilter] ? (searchParams.status as StatusFilter) : null;
  const now = new Date();

  // Same scope as the Overview's numbers: top-level tasks (daily subtasks roll up into these).
  const tasks = await prisma.task.findMany({
    where: {
      parentTaskId: null,
      ...(company ? { companyId: company.id } : {}),
      ...(status === "completed" ? { status: "COMPLETED" } : {}),
      ...(status === "in_progress" ? { status: "IN_PROGRESS" } : {}),
      ...(status === "not_started" ? { status: "NOT_STARTED" } : {}),
      ...(status === "overdue" ? { status: { not: "COMPLETED" }, deadline: { lt: now } } : {}),
    },
    include: {
      assignedTo: { include: { user: true } },
      assignedBy: { include: { user: true } },
      project: { select: { name: true, number: true } },
    },
    orderBy: status === "overdue" ? { deadline: "asc" } : { updatedAt: "desc" },
  });
  const slugOf = new Map(companies.map((c) => [c.id, c.slug]));
  const staffLinks = canManageAllStaff(membership);

  const filterHref = (next: { company?: string | null; status?: string | null }) => {
    const params = new URLSearchParams();
    const c = next.company === undefined ? company?.slug : next.company;
    const st = next.status === undefined ? status : next.status;
    if (c) params.set("company", c);
    if (st) params.set("status", st);
    const qs = params.toString();
    return `/director/tasks${qs ? `?${qs}` : ""}`;
  };
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-[15px] ${active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-brand-50"}`;

  return (
    <div className="space-y-6">
      <Link href="/director" className="text-[17px] text-brand-600 hover:underline">
        ← Overview
      </Link>
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">
          {status ? STATUS_FILTERS[status] : "All"} tasks{company ? ` — ${company.name}` : " — both companies"}
        </h1>
        <p className="text-[17px] text-slate-500">
          {tasks.length} task{tasks.length === 1 ? "" : "s"} — tap a task to open it, or a name to see that person.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={filterHref({ company: null })} className={chip(!company)}>
          Both companies
        </Link>
        {companies.map((c) => (
          <Link key={c.id} href={filterHref({ company: c.slug })} className={chip(company?.slug === c.slug)}>
            {c.name}
          </Link>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <Link href={filterHref({ status: null })} className={chip(!status)}>
          All
        </Link>
        {(Object.keys(STATUS_FILTERS) as StatusFilter[]).map((st) => (
          <Link key={st} href={filterHref({ status: st })} className={chip(status === st)}>
            {STATUS_FILTERS[st]}
          </Link>
        ))}
      </div>

      <Card className="!p-0">
        <div className="divide-y divide-brand-100">
          {tasks.map((t) => (
            <div key={t.id} className="px-4 py-3 hover:bg-brand-50/40">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/dashboard/tasks/${t.id}`} className="flex min-w-0 items-center gap-2 hover:underline">
                  <CompanyTag slug={slugOf.get(t.companyId) ?? ""} />
                  <span className="truncate text-[17px] font-medium text-slate-900">{t.title}</span>
                </Link>
                <StatusBadge status={t.status} />
              </div>
              <Link href={`/dashboard/tasks/${t.id}`} className="mt-1.5 block">
                <ProgressBar value={t.progress} />
              </Link>
              <div className="mt-1 text-[15px] text-slate-500">
                {staffLinks && !t.assignedTo.isDirector ? (
                  <Link href={`/director/staff/${t.assignedTo.userId}`} className="font-medium text-brand-600 hover:underline">
                    {t.assignedTo.user.name}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-700">{t.assignedTo.user.name}</span>
                )}
                {t.assignedBy.userId !== t.assignedTo.userId && ` · from ${t.assignedBy.user.name}`}
                {t.project && ` · ${t.project.number ? `${t.project.number} — ` : ""}${t.project.name}`}
                {" · "}
                <span className={isOverdue(t.deadline, t.status) ? "font-medium text-red-600" : ""}>
                  Due {formatDate(t.deadline)}
                </span>
                {t.completedAt && ` · Completed ${formatDate(t.completedAt)}`}
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="px-4 py-6 text-[17px] text-slate-500">No tasks here.</p>}
        </div>
      </Card>
    </div>
  );
}
