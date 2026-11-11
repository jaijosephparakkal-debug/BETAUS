import Image from "next/image";
import { canSeeProjects, canSeeMaintenance, canSeeAccounts } from "@/lib/teams";
import Link from "next/link";
import { canManageAllStaff, isManagingDirector, type FullMembership } from "@/lib/auth";
import { seesGnDepartments } from "@/lib/gnDepartments";
import { getCompanyTheme } from "@/lib/theme";
import { AttendanceClock } from "@/components/AttendanceClock";
import { NavLinks } from "@/components/NavLinks";
import { Avatar } from "@/components/Avatar";

export function AppHeader({
  membership,
  reportCount,
  membershipCount,
  taskNotificationCount = 0,
  clockInIso = null,
  autoClockedOut = false,
  viewingAsName,
}: {
  membership: FullMembership;
  reportCount: number;
  membershipCount: number;
  taskNotificationCount?: number;
  clockInIso?: string | null;
  autoClockedOut?: boolean;
  /** Set while a director views the app as this person (read-only). */
  viewingAsName?: string;
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
    ...(canSeeProjects(membership) ? [{ href: "/dashboard/projects", label: "Projects" }] : []),
    // Maintenance (AMC / DLP sites) is Flaretech's; directors see it from either company.
    ...((membership.company.slug === "flaretechnical" || membership.isDirector) && canSeeMaintenance(membership)
      ? [{ href: "/dashboard/maintenance", label: "Maintenance" }]
      : []),
    // The Flaretech accounts team keeps its Accounts tab; Gas Needs staff use the Gas Needs Accounts page below.
    ...(canSeeAccounts(membership) && (membership.isDirector || membership.company.slug !== "gasneeds")
      ? [{ href: "/dashboard/accounts", label: membership.isDirector ? "Accounts (FT)" : "Accounts" }]
      : []),
    // Gas Needs department pages (Quotations now lives inside Operation).
    ...(seesGnDepartments(membership)
      ? [
          { href: "/dashboard/dept/operation", label: "Operation" },
          { href: "/dashboard/dept/purchase", label: "Purchase" },
          { href: "/dashboard/dept/accounts", label: "Accounts" },
        ]
      : []),
    // Abraham sees everyone through Manage My Staff instead of My Team.
    ...(reportCount > 0 && !isManagingDirector(membership)
      ? [{ href: "/dashboard/team", label: "My Team" }]
      : []),
    ...(membership.isDirector
      ? [
          ...(canManageAllStaff(membership) ? [{ href: "/director/staff", label: "Manage My Staff" }] : []),
          ...(isManagingDirector(membership) ? [] : [{ href: "/director/kpi-percentage", label: "KPI Percentage" }]),
          { href: "/director/calendar", label: "Attendance" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30 px-3 pt-3">
      <div className="panel-ink art-header mx-auto max-w-6xl rounded-3xl border border-accent/60 shadow-xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-[#DFE5EB] px-2 py-1">
              <Image
                src={theme.logo}
                alt={theme.displayName}
                width={theme.logoWidth}
                height={theme.logoHeight}
                className="h-8 w-auto"
                priority
              />
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-[17px] font-semibold text-white">{membership.company.name}</div>
              <div className="text-[13px] text-[#c9d2da]">{membership.title}</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {membershipCount > 1 && canManageAllStaff(membership) && (
              <Link href="/select-company?switch=1" className="text-[16px] text-[#DFE5EB] underline-offset-2 hover:underline">
                Switch company
              </Link>
            )}
            {!viewingAsName && (
              <div className="rounded-full bg-[#DFE5EB] px-2 py-0.5 text-ink">
                <AttendanceClock clockInIso={clockInIso} autoClockedOut={autoClockedOut} />
              </div>
            )}
            <Avatar name={membership.user.name} email={membership.user.email} size={36} className="ring-2 ring-accent" />
          </div>
          <nav className="order-last flex w-full min-w-0 gap-1 overflow-x-auto pb-1 [&>*]:shrink-0">
            <NavLinks items={navItems} />
          </nav>
        </div>
      </div>
    </header>
  );
}
