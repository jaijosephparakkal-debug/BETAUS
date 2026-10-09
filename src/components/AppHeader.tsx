import Image from "next/image";
import Link from "next/link";
import { canManageAllStaff, isManagingDirector, type FullMembership } from "@/lib/auth";
import { getCompanyTheme } from "@/lib/theme";
import { AttendanceClock } from "@/components/AttendanceClock";

export function AppHeader({
  membership,
  reportCount,
  membershipCount,
  pendingApprovalCount = 0,
  taskNotificationCount = 0,
  clockInIso = null,
}: {
  membership: FullMembership;
  reportCount: number;
  membershipCount: number;
  pendingApprovalCount?: number;
  taskNotificationCount?: number;
  clockInIso?: string | null;
}) {
  const theme = getCompanyTheme(membership.company.slug);

  const navItems = [
    // The director's Overview is the merged two-company page at /director.
    { href: membership.isDirector ? "/director" : "/dashboard", label: "Overview" },
    ...(isManagingDirector(membership)
      ? []
      : [{ href: "/dashboard/tasks", label: "My Tasks", badge: taskNotificationCount }]),
    // The Managing Director sees the company-wide KPI page, not personal KPIs.
    isManagingDirector(membership)
      ? { href: "/director/kpi", label: "KPI" }
      : { href: "/dashboard/kpis", label: "My KPIs" },
    { href: "/dashboard/projects", label: "Projects" },
    // Maintenance (AMC / DLP sites) is Flaretech's; directors see it from either company.
    ...(membership.company.slug === "flaretechnical" || membership.isDirector
      ? [{ href: "/dashboard/maintenance", label: "Maintenance" }]
      : []),
    ...(reportCount > 0
      ? [{ href: "/dashboard/team", label: "My Team" }]
      : []),
    { href: "/dashboard/approvals", label: "Approvals", badge: pendingApprovalCount },
    ...(membership.isDirector
      ? [
          ...(canManageAllStaff(membership) ? [{ href: "/director/staff", label: "Manage My Staff" }] : []),
          { href: "/director/kpi-percentage", label: "KPI Percentage" },
          { href: "/director/attendance", label: "Attendance" },
        ]
      : []),
  ];

  return (
    <header className="border-b border-brand-200 bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-1.5">
            <Image
              src={theme.logo}
              alt={theme.displayName}
              width={theme.logoWidth}
              height={theme.logoHeight}
              className="h-9 w-auto"
              priority
            />
          </div>
          <div>
            <div className="text-[21px] font-semibold text-slate-900">
              {membership.company.name}
            </div>
            <div className="text-[17px] text-slate-500">
              {membership.user.name} · {membership.title}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {membershipCount > 1 && !membership.isDirector && (
            <Link
              href="/select-company"
              className="text-[19px] text-brand-600 hover:underline"
            >
              Switch company
            </Link>
          )}
          <AttendanceClock clockInIso={clockInIso} />
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[19px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"
          >
            {item.label}
            {!!item.badge && (
              <span className="rounded-full bg-brand-600 px-1.5 text-[17px] font-semibold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}
