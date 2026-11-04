import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { canSeeAccounts } from "@/lib/teams";
import { Card, ProgressBar, StatusBadge, CompanyTag, formatDate } from "@/components/ui";
import { LinkLibrary, type LibraryLink } from "./LinkLibrary";

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** The Accounts team's tab: requests from other teams, the team's own pipeline, and shared links. */
export default async function AccountsPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!canSeeAccounts(membership)) redirect("/dashboard");

  // Directors see both companies; the Accounts team sees their own company.
  const mine = await prisma.membership.findMany({ where: { userId: membership.userId }, select: { companyId: true } });
  const companyFilter = membership.isDirector ? {} : { companyId: { in: mine.map((m) => m.companyId) } };

  const people = await prisma.membership.findMany({
    where: { department: { equals: "Accounts", mode: "insensitive" }, ...companyFilter },
    include: { user: true, company: true },
    orderBy: { user: { name: "asc" } },
  });
  const ids = people.map((p) => p.id);
  const now = new Date();

  const requests = await prisma.task.findMany({
    where: {
      parentTaskId: null,
      forDepartment: { equals: "Accounts", mode: "insensitive" },
      assignedToId: { notIn: ids },
      ...companyFilter,
    },
    include: { assignedTo: { include: { user: true, company: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  requests.sort((a, b) => Number(a.status === "COMPLETED") - Number(b.status === "COMPLETED"));

  const categories = await prisma.task.findMany({
    where: { assignedToId: { in: ids }, parentTaskId: null, subtasks: { some: {} } },
    include: { subtasks: { select: { status: true, deadline: true } } },
    orderBy: { title: "asc" },
  });

  const links = await prisma.taskLink.findMany({
    where: {
      OR: [
        { task: { assignedToId: { in: ids } } },
        { task: { forDepartment: { equals: "Accounts", mode: "insensitive" }, ...companyFilter } },
      ],
    },
    include: { addedBy: { include: { user: true } }, task: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const library: LibraryLink[] = links.map((l) => ({
    id: l.id,
    url: l.url,
    label: l.label || hostOf(l.url),
    host: hostOf(l.url),
    taskId: l.task.id,
    taskTitle: l.task.title,
    addedBy: l.addedBy.user.name,
    date: formatDate(l.createdAt),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">Accounts</h1>
        <p className="mt-1 text-[19px] text-slate-500">
          Requests from other teams, the team&apos;s work, and the links shared on Accounts tasks.
        </p>
      </div>

      <Card>
        <h2 className="mb-1 text-[21px] font-semibold text-slate-900">Requests for Accounts — {requests.length}</h2>
        <p className="mb-3 text-[15px] text-slate-500">Tasks other staff created with &quot;Task for → Others → Accounts&quot;.</p>
        {requests.length === 0 ? (
          <p className="text-[19px] text-slate-500">No requests from other teams yet.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {requests.map((t) => (
              <Link key={t.id} href={`/dashboard/tasks/${t.id}`} className="block py-2.5 hover:bg-brand-50/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <CompanyTag slug={t.assignedTo.company.slug} />
                    <span className="truncate text-[19px] font-medium text-slate-900">{t.title}</span>
                  </span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-0.5 text-[15px] text-slate-500">
                  From {t.assignedTo.user.name}
                  {t.forPerson ? ` · for ${t.forPerson}` : ""} · Due {formatDate(t.deadline)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">The team&apos;s pipeline</h2>
        {people.map((p) => {
          const mineCats = categories.filter((c) => c.assignedToId === p.id);
          return (
            <div key={p.id} className="mb-5 last:mb-0">
              <div className="mb-1.5 flex items-center gap-2 text-[19px] font-medium text-slate-900">
                <CompanyTag slug={p.company.slug} />
                {p.user.name} <span className="text-[15px] font-normal text-slate-500">· {p.title}</span>
              </div>
              {mineCats.length === 0 ? (
                <p className="text-[15px] text-slate-500">No category tasks yet.</p>
              ) : (
                <div className="divide-y divide-brand-100">
                  {mineCats.map((c) => {
                    const total = c.subtasks.length;
                    const done = c.subtasks.filter((s) => s.status === "COMPLETED").length;
                    const open = total - done;
                    const overdue = c.subtasks.filter((s) => s.status !== "COMPLETED" && s.deadline && s.deadline < now).length;
                    return (
                      <Link key={c.id} href={`/dashboard/tasks/${c.id}`} className="block py-2 hover:bg-brand-50/40">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[17px] font-medium text-slate-900">{c.title}</span>
                          <span className="text-[15px] text-slate-500">
                            <span className="font-medium text-emerald-600">{done} done</span>
                            {open > 0 && <span className="font-medium text-amber-600"> · {open} open</span>}
                            {overdue > 0 && <span className="font-medium text-red-600"> · {overdue} overdue</span>}
                          </span>
                        </div>
                        <div className="mt-1">
                          <ProgressBar value={total ? Math.round((done / total) * 100) : 0} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Shared links — {library.length}</h2>
        <LinkLibrary links={library} />
      </Card>
    </div>
  );
}
