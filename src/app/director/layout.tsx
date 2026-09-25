import { redirect } from "next/navigation";
import { getCurrentMembership, getMembershipCount } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { getCompanyTheme } from "@/lib/theme";

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  const [reportCount, membershipCount, pendingApprovalCount] = await Promise.all([
    prisma.membership.count({ where: { managerId: membership.id } }),
    getMembershipCount(),
    prisma.approvalRequest.count({
      where: { approverId: membership.id, status: "PENDING" },
    }),
  ]);

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
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
