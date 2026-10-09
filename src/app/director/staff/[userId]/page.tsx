import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, canManageAllStaff } from "@/lib/auth";
import { getTasksFor, getKpisFor, getTimelineFor, kpiScore } from "@/lib/queries";
import {
  OFFICE_START,
  OFFICE_END,
  dubaiDateKey,
  dubaiMinutesOfDay,
  formatDubaiTime,
} from "@/lib/attendance";
import { Card, CompanyTag, ProgressBar, StatusBadge, formatDate, isOverdue } from "@/components/ui";

const TASK_FILTERS = {
  all: "All tasks",
  others: "Assigned by others",
  completed: "Completed",
  pending: "Pending",
  overdue: "Overdue",
} as const;
type TaskFilter = keyof typeof TASK_FILTERS;

const ATTENDANCE_DAYS = 30;

function formatHours(ms: number) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function StatLink({
  href,
  value,
  label,
  active,
  color = "text-slate-900",
}: {
  href: string;
  value: string | number;
  label: string;
  active?: boolean;
  color?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`block rounded-lg p-3 transition hover:bg-brand-50 ${
        active ? "bg-brand-50 ring-2 ring-brand-300" : "bg-slate-50"
      }`}
    >
      <div className={`text-[23px] font-semibold ${color}`}>{value}</div>
      <div className="text-[15px] text-slate-500">{label}</div>
    </Link>
  );
}

export default async function StaffProfilePage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams: { tasks?: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!canManageAllStaff(membership)) redirect("/director");

  // Every membership this person holds, both companies merged into one
  // profile — each item below carries a small company tag.
  const memberships = await prisma.membership.findMany({
    where: { userId: params.userId, isDirector: false },
    include: { user: true, company: true, manager: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) notFound();
  const person = memberships[0].user;
  const ids = memberships.map((m) => m.id);
  const slugOf = new Map(memberships.map((m) => [m.id, m.company.slug]));

  // Sequential rather than Promise.all — see dashboard/layout.tsx for why.
  const tasks: (Awaited<ReturnType<typeof getTasksFor>>[number] & { companySlug: string })[] = [];
  const kpis: (Awaited<ReturnType<typeof getKpisFor>>[number] & { companySlug: string })[] = [];
  const updates: (Awaited<ReturnType<typeof getTimelineFor>>[number] & { companySlug: string })[] = [];
  for (const m of memberships) {
    tasks.push(...(await getTasksFor(m.id)).map((t) => ({ ...t, companySlug: m.company.slug })));
    kpis.push(...(await getKpisFor(m.id)).map((k) => ({ ...k, companySlug: m.company.slug })));
    updates.push(...(await getTimelineFor(m.id)).map((u) => ({ ...u, companySlug: m.company.slug })));
  }
  tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  updates.sort((a, b) => b.at.getTime() - a.at.getTime());

  const approvalInclude = {
    requestedBy: { include: { user: true } },
    approver: { include: { user: true } },
  } as const;
  const submitted = await prisma.approvalRequest.findMany({
    where: { requestedById: { in: ids } },
    include: approvalInclude,
    orderBy: { createdAt: "desc" },
  });
  const reviewed = await prisma.approvalRequest.findMany({
    where: { approverId: { in: ids } },
    include: approvalInclude,
    orderBy: { createdAt: "desc" },
  });

  const since = new Date(Date.now() - ATTENDANCE_DAYS * 24 * 60 * 60 * 1000);
  const entries = await prisma.attendanceEntry.findMany({
    where: { membershipId: { in: ids }, clockIn: { gte: since } },
    orderBy: { clockIn: "asc" },
  });

  // ---- Task numbers --------------------------------------------------------
  const isOverdueTask = (t: (typeof tasks)[number]) => isOverdue(t.deadline, t.status);
  const byOthers = tasks.filter((t) => t.assignedBy.userId !== person.id);
  const completed = tasks.filter((t) => t.status === "COMPLETED");
  const pending = tasks.filter((t) => t.status !== "COMPLETED");
  const overdue = tasks.filter(isOverdueTask);
  const avgKpi = kpis.length ? Math.round(kpis.reduce((s, k) => s + kpiScore(k), 0) / kpis.length) : null;

  const filter: TaskFilter =
    searchParams.tasks && Object.prototype.hasOwnProperty.call(TASK_FILTERS, searchParams.tasks) ? (searchParams.tasks as TaskFilter) : "all";
  const shownTasks = {
    all: tasks,
    others: byOthers,
    completed,
    pending,
    overdue,
  }[filter];
  const base = `/director/staff/${params.userId}`;
  const filterHref = (f: TaskFilter) => `${base}${f === "all" ? "" : `?tasks=${f}`}#tasks`;

  // ---- Attendance, one row per Dubai day ----------------------------------
  const now = new Date();
  type Day = {
    key: string;
    companySlugs: Set<string>;
    firstIn: Date;
    lastOut: Date | null;
    stillIn: boolean;
    workedMs: number;
  };
  const dayMap = new Map<string, Day>();
  for (const e of entries) {
    const key = dubaiDateKey(e.clockIn);
    let d = dayMap.get(key);
    if (!d) {
      d = { key, companySlugs: new Set(), firstIn: e.clockIn, lastOut: null, stillIn: false, workedMs: 0 };
      dayMap.set(key, d);
    }
    d.companySlugs.add(slugOf.get(e.membershipId) ?? "");
    if (e.clockOut) {
      if (!d.lastOut || e.clockOut > d.lastOut) d.lastOut = e.clockOut;
    } else {
      d.stillIn = true;
    }
    d.workedMs += (e.clockOut ?? now).getTime() - e.clockIn.getTime();
  }
  const startLimit = OFFICE_START.hour * 60 + OFFICE_START.minute;
  const endLimit = OFFICE_END.hour * 60 + OFFICE_END.minute;
  const days = Array.from(dayMap.values())
    .map((d) => ({
      ...d,
      lateIn: dubaiMinutesOfDay(d.firstIn) > startLimit,
      leftLate: !d.stillIn && !!d.lastOut && dubaiMinutesOfDay(d.lastOut) > endLimit,
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
  const lateInDays = days.filter((d) => d.lateIn).length;
  const leftLateDays = days.filter((d) => d.leftLate).length;
  const dayLabel = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  };
  const officeStartLabel = formatDubaiTime(new Date(Date.UTC(2000, 0, 1, OFFICE_START.hour - 4, OFFICE_START.minute)));
  const officeEndLabel = formatDubaiTime(new Date(Date.UTC(2000, 0, 1, OFFICE_END.hour - 4, OFFICE_END.minute)));

  return (
    <div className="space-y-6">
      <Link href="/director/staff" className="text-[17px] text-brand-600 hover:underline">
        ← Manage My Staff
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-slate-900">{person.name}</h1>
          <div className="mt-1 space-y-1">
            {memberships.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-2 text-[17px] text-slate-600">
                <CompanyTag slug={m.company.slug} />
                {m.title}
                {m.department ? ` · ${m.department}` : ""}
                {m.manager && <span className="text-slate-400">· reports to {m.manager.user.name}</span>}
              </div>
            ))}
          </div>
          <div className="mt-1 text-[15px] text-slate-400">{person.email}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {memberships.map((m) => (
            <a
              key={m.id}
              href={`/api/reports/my-kpi?membershipId=${m.id}`}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-[17px] font-medium text-white hover:bg-brand-700"
            >
              {memberships.length > 1 && <CompanyTag slug={m.company.slug} />}
              Download KPI report (PDF)
            </a>
          ))}
        </div>
      </div>

      {/* Numbers — each one opens the matching task list below */}
      <Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[23px] font-semibold text-slate-900">{avgKpi === null ? "—" : `${avgKpi}%`}</div>
            <div className="text-[15px] text-slate-500">KPI</div>
          </div>
          <StatLink href={filterHref("all")} value={tasks.length} label="Tasks allotted" active={filter === "all"} />
          <StatLink href={filterHref("others")} value={byOthers.length} label="Assigned by others" active={filter === "others"} />
          <StatLink href={filterHref("completed")} value={completed.length} label="Completed" active={filter === "completed"} color="text-emerald-600" />
          <StatLink href={filterHref("pending")} value={pending.length} label="Pending" active={filter === "pending"} color="text-amber-600" />
          <StatLink href={filterHref("overdue")} value={overdue.length} label="Overdue" active={filter === "overdue"} color="text-red-600" />
          <a href={`${base}/attendance`} className="block rounded-lg bg-slate-50 p-3 transition hover:bg-brand-50">
            <div className="text-[23px] font-semibold text-slate-900">{days.length}</div>
            <div className="text-[15px] text-slate-500">Days in (last {ATTENDANCE_DAYS})</div>
          </a>
        </div>
      </Card>

      {/* KPIs */}
      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">KPIs</h2>
        {kpis.length === 0 ? (
          <p className="text-[17px] text-slate-500">No KPIs set.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {kpis.map((k) => (
              <div key={k.id}>
                <div className="flex items-center justify-between gap-2 text-[17px]">
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    <CompanyTag slug={k.companySlug} />
                    {k.name}
                  </span>
                  <span className="shrink-0 text-slate-500">
                    {k.current}
                    {k.unit ?? ""} / {k.target}
                    {k.unit ?? ""} · {kpiScore(k)}%
                  </span>
                </div>
                <ProgressBar value={kpiScore(k)} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tasks */}
      <Card>
        <div id="tasks" className="mb-3 flex flex-wrap items-center justify-between gap-2 scroll-mt-4">
          <h2 className="text-[21px] font-semibold text-slate-900">
            {TASK_FILTERS[filter]} — {shownTasks.length}
          </h2>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(TASK_FILTERS) as TaskFilter[]).map((f) => (
              <Link
                key={f}
                href={filterHref(f)}
                scroll={false}
                className={`rounded-full px-3 py-1 text-[15px] ${
                  f === filter ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-brand-50"
                }`}
              >
                {TASK_FILTERS[f]}
              </Link>
            ))}
          </div>
        </div>
        {shownTasks.length === 0 ? (
          <p className="text-[17px] text-slate-500">No tasks here.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {shownTasks.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/tasks/${t.id}`}
                className="block py-2.5 hover:bg-brand-50/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <CompanyTag slug={t.companySlug} />
                    <span className="truncate text-[17px] font-medium text-slate-900">{t.title}</span>
                  </span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={t.progress} />
                </div>
                <div className="mt-1 text-[15px] text-slate-500">
                  {t.assignedBy.userId === person.id ? "Self-assigned" : `Assigned by ${t.assignedBy.user.name}`}
                  {" · "}
                  <span className={isOverdueTask(t) ? "font-medium text-red-600" : ""}>Due {formatDate(t.deadline)}</span>
                  {t.completedAt && ` · Completed ${formatDate(t.completedAt)}`}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Reports & reviews */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Work reports — {updates.length}</h2>
          <p className="-mt-2 mb-3 text-[15px] text-slate-500">Progress updates they logged on their tasks.</p>
          {updates.length === 0 ? (
            <p className="text-[17px] text-slate-500">No updates logged yet.</p>
          ) : (
            <div className="max-h-[28rem] divide-y divide-brand-100 overflow-y-auto">
              {updates.slice(0, 50).map((u) => (
                <Link key={u.id} href={`/dashboard/tasks/${u.taskId}`} className="block py-2.5 hover:bg-brand-50/40">
                  <div className="flex items-center gap-2 text-[15px] text-slate-500">
                    <CompanyTag slug={u.companySlug} />
                    {formatDate(u.at)} · {u.progressAt}%
                  </div>
                  <div className="truncate text-[17px] font-medium text-slate-900">{u.taskTitle}</div>
                  {u.body && <div className="line-clamp-2 text-[15px] text-slate-600">{u.body}</div>}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Approvals</h2>
          <h3 className="mb-1 text-[17px] font-semibold text-slate-700">Reviewed / to review — {reviewed.length}</h3>
          <ApprovalRows rows={reviewed} slugOf={slugOf} side="approver" />
          <h3 className="mb-1 mt-4 text-[17px] font-semibold text-slate-700">Submitted — {submitted.length}</h3>
          <ApprovalRows rows={submitted} slugOf={slugOf} side="requester" />
        </Card>
      </div>

      {/* Attendance */}
      <Card>
        <div id="attendance" className="mb-3 flex flex-wrap items-baseline justify-between gap-2 scroll-mt-4">
          <h2 className="text-[21px] font-semibold text-slate-900">
            Attendance — last {ATTENDANCE_DAYS} days{" "}
            <Link href={`${base}/attendance`} className="text-[17px] font-normal text-brand-600 hover:underline">
              Full month →
            </Link>
          </h2>
          <span className="text-[15px] text-slate-500">
            <span className="font-medium text-amber-600">{lateInDays} late in</span> (after {officeStartLabel}) ·{" "}
            <span className="font-medium text-violet-600">{leftLateDays} left late</span> (after {officeEndLabel})
          </span>
        </div>
        {days.length === 0 ? (
          <p className="text-[17px] text-slate-500">No attendance in the last {ATTENDANCE_DAYS} days.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {days.map((d) => (
              <Link
                key={d.key}
                href={`/director/attendance?date=${d.key}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:bg-brand-50/40"
              >
                <div className="flex items-center gap-2">
                  {Array.from(d.companySlugs).map((s) => (
                    <CompanyTag key={s} slug={s} />
                  ))}
                  <span className="text-[17px] font-medium text-slate-900">{dayLabel(d.key)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[15px] text-slate-600">
                  <span className={d.lateIn ? "font-medium text-amber-600" : ""}>In {formatDubaiTime(d.firstIn)}</span>
                  <span className={d.leftLate ? "font-medium text-violet-600" : ""}>
                    {d.stillIn ? "Still in" : d.lastOut ? `Out ${formatDubaiTime(d.lastOut)}` : "—"}
                  </span>
                  <span>{formatHours(d.workedMs)}</span>
                  {d.lateIn && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-700">Late in</span>}
                  {d.leftLate && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-medium text-violet-700">Left late</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ApprovalRows({
  rows,
  slugOf,
  side,
}: {
  rows: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    decidedAt: Date | null;
    requestedById: string;
    approverId: string;
    requestedBy: { user: { name: string } };
    approver: { user: { name: string } };
  }[];
  slugOf: Map<string, string>;
  side: "approver" | "requester";
}) {
  if (rows.length === 0) return <p className="text-[15px] text-slate-500">None.</p>;
  return (
    <div className="max-h-60 divide-y divide-brand-100 overflow-y-auto">
      {rows.map((r) => (
        <Link
          key={r.id}
          href={`/dashboard/approvals/${r.id}`}
          className="flex items-center justify-between gap-3 py-2 hover:bg-brand-50/40"
        >
          <div className="flex min-w-0 items-center gap-2">
            <CompanyTag slug={slugOf.get(side === "approver" ? r.approverId : r.requestedById) ?? ""} />
            <div className="min-w-0">
              <div className="truncate text-[17px] font-medium text-slate-900">{r.title}</div>
              <div className="truncate text-[15px] text-slate-500">
                {side === "approver" ? `From ${r.requestedBy.user.name}` : `To ${r.approver.user.name}`} ·{" "}
                {formatDate(r.decidedAt ?? r.createdAt)}
              </div>
            </div>
          </div>
          <StatusBadge status={r.status} />
        </Link>
      ))}
    </div>
  );
}
