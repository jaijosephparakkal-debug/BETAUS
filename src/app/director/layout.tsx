import { redirect } from "next/navigation";
import { getCurrentMembership, getMembershipCount } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { getCompanyTheme } from "@/lib/theme";
import { themeIsLight } from "@/lib/themeMode";
import { clockInIfNeeded } from "@/lib/attendance";
import { getUnreadTaskNotificationCount } from "@/lib/notifications";

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  // Sequential rather than Promise.all — see dashboard/layout.tsx for why.
  const reportCount = await prisma.membership.count({ where: { managerId: membership.id } });
  const membershipCount = await getMembershipCount();
  // A director's attendance always sits on their first membership, whichever company they have switched to,
  // so switching company never clocks them in a second time.
  const home = await prisma.membership.findFirst({ where: { userId: membership.userId }, orderBy: { createdAt: "asc" } });
  const attendanceEntry = await clockInIfNeeded((home ?? membership).id);
  const taskNotificationCount = await getUnreadTaskNotificationCount(membership.id);

  const theme = getCompanyTheme(membership.company.slug);

  return (
    <div
      className={`min-h-screen ${themeIsLight(membership.user.email) ? "theme-light" : ""}`}
      style={{ ...theme.vars, background: theme.pageBackground }}
    >
      <AppHeader
        membership={membership}
        reportCount={reportCount}
        membershipCount={membershipCount}
        taskNotificationCount={taskNotificationCount}
        clockInIso={attendanceEntry ? attendanceEntry.clockIn.toISOString() : null}
        autoClockedOut={!attendanceEntry}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
