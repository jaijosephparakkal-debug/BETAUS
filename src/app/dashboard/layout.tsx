import { redirect } from "next/navigation";
import { exitViewAsAction } from "@/app/director/view-as/actions";
import { getCurrentMembership, getMembershipCount } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { getCompanyTheme } from "@/lib/theme";
import { clockInIfNeeded } from "@/lib/attendance";
import { getUnreadTaskNotificationCount } from "@/lib/notifications";
import { isReconcileOpen, reconcileEndLabel } from "@/lib/reconcile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  // Sequential rather than Promise.all — this layout runs on every
  // dashboard page, so firing 4 queries at once here multiplies fast under
  // concurrent staff load (10 people loading pages = 40 simultaneous
  // connection requests just from this one layout). One at a time trades a
  // little latency for much lower peak connection pressure on the database.
  const reportCount = await prisma.membership.count({ where: { managerId: membership.id } });
  const membershipCount = await getMembershipCount();
  // While a director is viewing as someone, never clock that person in or out.
  const attendanceEntry = membership.viewingAs ? null : await clockInIfNeeded(membership.id);
  const taskNotificationCount = await getUnreadTaskNotificationCount(membership.id);

  const theme = getCompanyTheme(membership.company.slug);

  return (
    <div
      className={`min-h-screen ${membership.user.email.toLowerCase() === "sales@gasneeds.com" ? "theme-light" : ""}`}
      style={{ ...theme.vars, background: theme.pageBackground }}
    >
      <AppHeader
        membership={membership}
        reportCount={reportCount}
        membershipCount={membershipCount}
        taskNotificationCount={taskNotificationCount}
        clockInIso={attendanceEntry ? attendanceEntry.clockIn.toISOString() : null}
        autoClockedOut={!attendanceEntry && !membership.viewingAs}
        viewingAsName={membership.viewingAs ? membership.user.name : undefined}
      />
      {membership.viewingAs && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-900 px-4 py-2 text-center text-[17px] text-white">
          <span>
            Viewing as <strong>{membership.user.name}</strong> — read only. Nothing here changes their data.
          </span>
          <form action={exitViewAsAction}>
            <button type="submit" className="rounded-md bg-white px-3 py-1 text-[15px] font-medium text-slate-900 hover:bg-slate-200">
              Exit view
            </button>
          </form>
        </div>
      )}
      {!membership.viewingAs && isReconcileOpen(membership.user.email) && (
        <a href="/dashboard/reconcile" className="block bg-amber-100 px-4 py-2 text-center text-[19px] font-medium text-amber-900 hover:bg-amber-200">
          Attendance reconciliation is open until {reconcileEndLabel(membership.user.email)} — tap to review and correct your shifts
        </a>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
