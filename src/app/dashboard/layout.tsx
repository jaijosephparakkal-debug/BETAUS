import { redirect } from "next/navigation";
import { getCurrentMembership, getMembershipCount } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { getCompanyTheme } from "@/lib/theme";
import { clockInIfNeeded } from "@/lib/attendance";

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
  const pendingApprovalCount = await prisma.approvalRequest.count({
    where: { approverId: membership.id, status: "PENDING" },
  });
  const attendanceEntry = await clockInIfNeeded(membership.id);

  const theme = getCompanyTheme(membership.company.slug);

  return (
    <div
      className="min-h-screen"
      style={{ ...theme.vars, background: theme.pageBackground }}
    >
      <AppHeader
        membership={membership}
        reportCount={reportCount}
        membershipCount={membershipCount}
        pendingApprovalCount={pendingApprovalCount}
        clockInIso={attendanceEntry.clockIn.toISOString()}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
