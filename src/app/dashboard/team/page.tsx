import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getDirectReports, getMembershipSummary } from "@/lib/queries";
import { Card, ProgressBar } from "@/components/ui";

export default async function MyTeamPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const reports = await getDirectReports(membership.id);
  const summaries = await Promise.all(
    reports.map((r) => getMembershipSummary(r.id))
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">My Team</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report, i) => {
          const summary = summaries[i];
          return (
            <Link key={report.id} href={`/dashboard/team/${report.id}`}>
              <Card className="transition hover:border-brand-200">
                <div className="font-medium text-slate-900">
                  {report.user.name}
                </div>
                <div className="text-xs text-slate-500">{report.title}</div>
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Task progress</span>
                      <span>{summary.avgTaskProgress}%</span>
                    </div>
                    <ProgressBar value={summary.avgTaskProgress} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>KPI achievement</span>
                      <span>{summary.avgKpiScore}%</span>
                    </div>
                    <ProgressBar value={summary.avgKpiScore} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
        {reports.length === 0 && (
          <p className="text-sm text-slate-500">No direct reports yet.</p>
        )}
      </div>
    </div>
  );
}
