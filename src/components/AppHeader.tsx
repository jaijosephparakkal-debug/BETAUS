import Image from "next/image";
import Link from "next/link";
import type { FullMembership } from "@/lib/auth";
import { getCompanyTheme } from "@/lib/theme";
import { logoutAction } from "@/app/logout/actions";

export function AppHeader({
  membership,
  reportCount,
  membershipCount,
  pendingApprovalCount = 0,
}: {
  membership: FullMembership;
  reportCount: number;
  membershipCount: number;
  pendingApprovalCount?: number;
}) {
  const theme = getCompanyTheme(membership.company.slug);

  const navItems = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/tasks", label: "My Tasks" },
    { href: "/dashboard/kpis", label: "My KPIs" },
    ...(reportCount > 0
      ? [{ href: "/dashboard/team", label: "My Team" }]
      : []),
    { href: "/dashboard/approvals", label: "Approvals", badge: pendingApprovalCount },
    ...(membership.isDirector
      ? [{ href: "/director", label: "Company Dashboard" }]
      : []),
  ];

  return (
    <header className="border-b border-brand-200 bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-amber-300 bg-amber-400/40 p-1.5">
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
            <div className="font-semibold text-slate-900">
              {membership.company.name}
            </div>
            <div className="text-xs text-slate-500">
              {membership.user.name} · {membership.title}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {membershipCount > 1 && (
            <Link
              href="/select-company"
              className="text-sm text-brand-600 hover:underline"
            >
              Switch company
            </Link>
          )}
          <form action={logoutAction}>
            <button className="text-sm text-slate-500 hover:text-slate-700">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"
          >
            {item.label}
            {!!item.badge && (
              <span className="rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}
