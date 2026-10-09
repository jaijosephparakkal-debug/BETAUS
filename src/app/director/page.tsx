import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, canManageAllStaff } from "@/lib/auth";
import {
  getCompanyRollup,
  getOrgTree,
  getAtRiskTasks,
} from "@/lib/queries";
import { Card, SegmentedDonut, StatusBadge, CompanyTag, formatDate } from "@/components/ui";
import { MergedOrgChart } from "@/components/OrgChart";
import { getCompanyTheme } from "@/lib/theme";
import { dubaiDayRange, formatDubaiTime } from "@/lib/attendance";

const STATUS_COLORS = { COMPLETED: "#10b981", IN_PROGRESS: "#f59e0b", NOT_STARTED: "#94a3b8" };

// Every number on the director's Overview opens the list behind it.
function StatBox({
  value,
  label,
  href,
  color = "text-slate-900",
}: {
  value: string | number;
  label: React.ReactNode;
  href: string;
  color?: string;
}) {
  return (
    <Link href={href} className="block rounded-lg bg-slate-50 p-3 transition hover:bg-brand-50 hover:ring-1 hover:ring-brand-200">
      <div className={`text-[23px] font-semibold ${color}`}>{value}</div>
      <div className="text-[15px] text-slate-500">{label}</div>
    </Link>
  );
}

export default async function DirectorPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  // Only ever two companies system-wide — a director sees both merged into
  // one page, regardless of which single company they actually signed in
  // through. No company-switching involved anywhere on this page.
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  // Sequential rather than Promise.all — see dashboard/layout.tsx for why.
  const perCompany: {
    company: { id: string; slug: string; name: string };
    rollup: Awaited<ReturnType<typeof getCompanyRollup>>;
    orgTree: Awaited<ReturnType<typeof getOrgTree>>;
    atRiskTasks: Awaited<ReturnType<typeof getAtRiskTasks>>;
    pendingApprovalCount: number;
  }[] = [];
  for (const c of companies) {
    const rollup = await getCompanyRollup(c.id);
    const orgTree = await getOrgTree(c.id);
    const atRiskTasks = await getAtRiskTasks(c.id);
    const pendingApprovalCount = await prisma.approvalRequest.count({
      where: { companyId: c.id, status: "PENDING" },
    });
    perCompany.push({ company: { id: c.id, slug: c.slug, name: c.name }, rollup, orgTree, atRiskTasks, pendingApprovalCount });
  }

  const overall = {
    headcount: perCompany.reduce((s, b) => s + b.rollup.headcount, 0),
    totalTasks: perCompany.reduce((s, b) => s + b.rollup.totalTasks, 0),
    completedTasks: perCompany.reduce((s, b) => s + b.rollup.completedTasks, 0),
    inProgressTasks: perCompany.reduce((s, b) => s + b.rollup.inProgressTasks, 0),
    notStartedTasks: perCompany.reduce((s, b) => s + b.rollup.notStartedTasks, 0),
    overdueTasks: perCompany.reduce((s, b) => s + b.rollup.overdueTasks, 0),
    pendingApprovals: perCompany.reduce((s, b) => s + b.pendingApprovalCount, 0),
  };
  const overallCompletionPct = overall.totalTasks
    ? Math.round((overall.completedTasks / overall.totalTasks) * 100)
    : 0;
  const totalKpiCount = perCompany.reduce((s, b) => s + b.rollup.kpiCount, 0);
  const overallAvgKpi = totalKpiCount
    ? Math.round(perCompany.reduce((s, b) => s + b.rollup.avgKpiScore * b.rollup.kpiCount, 0) / totalKpiCount)
    : 0;

  // One merged at-risk list across both companies, most overdue first.
  const mergedAtRisk = perCompany
    .flatMap((b) => b.atRiskTasks.map((t) => ({ ...t, companySlug: b.company.slug })))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Staff = everyone except the director, per company.
  const staffCounts = perCompany.map((b) => ({
    company: b.company,
    staff: b.rollup.memberships.filter((m) => !m.isDirector).length,
  }));

  // Today's attendance (Dubai day), both companies merged, director excluded.
  const today = dubaiDayRange();
  const todayEntries = await prisma.attendanceEntry.findMany({
    where: { clockIn: { gte: today.start, lt: today.end }, membership: { isDirector: false } },
    include: { membership: { include: { user: true, company: true } } },
    orderBy: { clockIn: "asc" },
  });
  // One row per person — their first clock-in today, and whether they're still in.
  const attendanceByPerson = new Map<
    string,
    { userId: string; name: string; title: string; companySlug: string; companyId: string; firstIn: Date; stillIn: boolean }
  >();
  for (const e of todayEntries) {
    const existing = attendanceByPerson.get(e.membershipId);
    if (existing) {
      existing.stillIn = existing.stillIn || !e.clockOut;
    } else {
      attendanceByPerson.set(e.membershipId, {
        userId: e.membership.userId,
        name: e.membership.user.name,
        title: e.membership.title,
        companySlug: e.membership.company.slug,
        companyId: e.membership.companyId,
        firstIn: e.clockIn,
        stillIn: !e.clockOut,
      });
    }
  }
  const presentToday = Array.from(attendanceByPerson.values());

  const pendingApprovals = await prisma.approvalRequest.findMany({
    where: { status: "PENDING" },
    include: {
      requestedBy: { include: { user: true } },
      approver: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const slugByCompanyId = new Map(companies.map((c) => [c.id, c.slug]));

  const directorName = perCompany[0]?.orgTree?.name ?? membership.user.name;
  const directorTitle = perCompany[0]?.orgTree?.title ?? membership.title;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {perCompany.map((b, i) => {
              const theme = getCompanyTheme(b.company.slug);
              return (
                <div
                  key={b.company.id}
                  className={`rounded-lg border-2 border-white bg-brand-50 p-1 shadow-sm ${i > 0 ? "-ml-2.5" : ""}`}
                  style={{ zIndex: perCompany.length - i }}
                >
                  <Image src={theme.logo} alt={theme.displayName} width={theme.logoWidth} height={theme.logoHeight} className="h-7 w-auto" />
                </div>
              );
            })}
          </div>
          <div>
            <h1 className="text-[23px] font-semibold text-slate-900">Overview</h1>
            <p className="text-[17px] text-slate-500">
              {membership.user.name} · {perCompany.map((b) => b.company.name).join(" & ")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[17px]">
          {canManageAllStaff(membership) && (
            <Link
              href="/director/staff"
              className="rounded-lg bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
            >
              Manage My Staff
            </Link>
          )}
          <Link href="/director/kpi-percentage" className="text-brand-600 hover:underline">
            KPI Percentage
          </Link>
        </div>
      </div>

      {/* 1. Total staff per company */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[...staffCounts]
          .sort((a, b) => (a.company.slug === "gasneeds" ? -1 : b.company.slug === "gasneeds" ? 1 : 0))
          .map((c) => {
            const theme = getCompanyTheme(c.company.slug);
            return (
              <Link key={c.company.id} href={`/director/staff?company=${c.company.slug}`} className="block transition hover:opacity-90">
              <Card className="hover:border-brand-300">
                <div style={theme.vars} className="flex items-center gap-4">
                  <div className="rounded-lg border border-brand-200 bg-brand-50 p-1.5">
                    <Image src={theme.logo} alt={theme.displayName} width={theme.logoWidth} height={theme.logoHeight} className="h-12 w-auto" />
                  </div>
                  <div>
                    <div className="text-[17px] text-slate-500">{c.company.name}</div>
                    <div className="text-[34px] font-semibold leading-tight text-brand-600">{c.staff}</div>
                    <div className="text-[15px] text-slate-500">Total staff — tap to see who</div>
                  </div>
                </div>
              </Card>
              </Link>
            );
          })}
      </div>

      {/* 2. Staff attendance — today */}
      <Card>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[21px] font-semibold text-slate-900">
            <Link href="/director/attendance" className="hover:text-brand-600 hover:underline">
              Staff attendance — today
            </Link>
          </h2>
          <Link href="/director/attendance" className="text-[17px] text-brand-600 hover:underline">
            Full attendance sheet →
          </Link>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {staffCounts.map((c) => {
            const present = presentToday.filter((p) => p.companyId === c.company.id).length;
            return (
              <StatBox
                key={c.company.id}
                href={`/director/staff?company=${c.company.slug}&status=present`}
                value={`${present}/${c.staff}`}
                label={
                  <span className="flex items-center gap-1.5">
                    <CompanyTag slug={c.company.slug} /> present
                  </span>
                }
              />
            );
          })}
          <StatBox
            href="/director/staff?status=in"
            value={presentToday.filter((p) => p.stillIn).length}
            label="Clocked in now"
            color="text-emerald-600"
          />
          <StatBox
            href="/director/staff?status=absent"
            value={staffCounts.reduce((s, c) => s + c.staff, 0) - presentToday.length}
            label="Not in today"
            color="text-red-600"
          />
        </div>
        {presentToday.length === 0 ? (
          <p className="text-[17px] text-slate-500">Nobody has clocked in yet today.</p>
        ) : (
          <div className="max-h-80 divide-y divide-brand-100 overflow-y-auto">
            {presentToday.map((p, i) => (
              <Link
                key={i}
                href={`/director/staff/${p.userId}`}
                className="flex items-center justify-between gap-3 py-2 hover:bg-brand-50/40"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CompanyTag slug={p.companySlug} />
                  <div className="min-w-0">
                    <div className="truncate text-[17px] font-medium text-slate-900">{p.name}</div>
                    <div className="truncate text-[15px] text-slate-500">{p.title}</div>
                  </div>
                </div>
                <div className="shrink-0 text-right text-[15px]">
                  <div className="text-slate-600">In {formatDubaiTime(p.firstIn)}</div>
                  {p.stillIn ? (
                    <span className="font-medium text-emerald-600">Clocked in</span>
                  ) : (
                    <span className="text-slate-400">Signed out</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* 3. Approvals */}
      <Card>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[21px] font-semibold text-slate-900">
            <Link href="/director/approvals" className="hover:text-brand-600 hover:underline">
              Approvals — {overall.pendingApprovals} pending
            </Link>
          </h2>
          <Link href="/director/approvals" className="text-[17px] text-brand-600 hover:underline">
            All approvals →
          </Link>
        </div>
        {pendingApprovals.length === 0 ? (
          <p className="text-[17px] text-slate-500">No pending approvals.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {pendingApprovals.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/approvals/${r.id}`}
                className="flex items-center justify-between gap-3 py-2.5 hover:bg-brand-50/40"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CompanyTag slug={slugByCompanyId.get(r.companyId) ?? ""} />
                  <div className="min-w-0">
                    <div className="truncate text-[17px] font-medium text-slate-900">{r.title}</div>
                    <div className="truncate text-[15px] text-slate-500">
                      {r.requestedBy.user.name} → {r.approver.user.name} · {formatDate(r.createdAt)}
                    </div>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-[21px] font-semibold text-slate-900">Combined performance</h2>
        <p className="mb-3 text-[15px] text-slate-500">Every number below is both firms added together.</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatBox href="/director/staff" value={overall.headcount} label="Employees" />
          <StatBox
            href="/director/tasks?status=completed"
            value={`${overall.completedTasks}/${overall.totalTasks}`}
            label="Tasks completed"
          />
          <StatBox href="/director/tasks?status=in_progress" value={overall.inProgressTasks} label="In progress" />
          <StatBox href="/director/tasks?status=overdue" value={overall.overdueTasks} label="Overdue" color="text-red-600" />
          <StatBox href="/director/kpi-percentage" value={`${overallAvgKpi}%`} label="Avg. KPI" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-8 border-t border-brand-100 pt-4">
          <Link href="/director/tasks" className="hover:opacity-80" aria-label="All tasks">
          <SegmentedDonut
            size={100}
            strokeWidth={12}
            centerLabel={`${overallCompletionPct}%`}
            segments={[
              { label: "Completed", value: overall.completedTasks, color: STATUS_COLORS.COMPLETED },
              { label: "In progress", value: overall.inProgressTasks, color: STATUS_COLORS.IN_PROGRESS },
              { label: "Not started", value: overall.notStartedTasks, color: STATUS_COLORS.NOT_STARTED },
            ]}
          />
          </Link>
          <div className="space-y-1.5 text-[15px] text-slate-500">
            {perCompany.map((b) => (
              <Link
                key={b.company.id}
                href={`/director/tasks?company=${b.company.slug}`}
                className="flex items-center gap-2 hover:text-brand-600 hover:underline"
              >
                <CompanyTag slug={b.company.slug} />
                {b.rollup.completedTasks}/{b.rollup.totalTasks} completed, {b.rollup.avgKpiScore}% avg KPI
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">
          <Link href="/director/tasks?status=overdue" className="hover:text-brand-600 hover:underline">
            At risk — {mergedAtRisk.length} overdue task{mergedAtRisk.length === 1 ? "" : "s"}
          </Link>
        </h2>
        {mergedAtRisk.length === 0 ? (
          <p className="text-[19px] text-slate-500">Nothing overdue right now.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {mergedAtRisk.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/tasks/${t.id}`}
                className="flex items-center justify-between gap-3 py-2.5 hover:bg-brand-50/40"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CompanyTag slug={t.companySlug} />
                  <div className="min-w-0">
                    <div className="truncate text-[19px] font-medium text-slate-900">{t.title}</div>
                    <div className="text-[17px] text-slate-500">{t.assigneeName} · {t.progress}% done</div>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[17px] font-medium text-red-400">
                  {t.daysOverdue === 0 ? "Overdue today" : `${t.daysOverdue}d overdue`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-[21px] font-semibold text-slate-900">Company structure — Flare Technical &amp; Gas Needs</h2>
        <MergedOrgChart
          staffLinks={canManageAllStaff(membership)}
          directorName={directorName}
          directorTitle={directorTitle}
          branches={perCompany.map((b) => ({
            label: b.company.name,
            color: b.company.slug === "gasneeds" ? "#d30a0a" : "#007ec8",
            tree: b.orgTree,
          }))}
        />
      </Card>
    </div>
  );
}
