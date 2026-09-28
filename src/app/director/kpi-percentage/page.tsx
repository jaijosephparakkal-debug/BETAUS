import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { getCompanyTheme } from "@/lib/theme";
import { Card, SegmentedDonut, LineChart } from "@/components/ui";

const STATUS_COLORS = {
  COMPLETED: "#10b981",
  IN_PROGRESS: "#f59e0b",
  NOT_STARTED: "#94a3b8",
};

// Dubai has no DST, fixed UTC+4 — used to bucket "tasks completed per day" by
// the Gulf-local calendar day rather than server/UTC day boundaries.
const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

function dubaiDayKey(date: Date) {
  const shifted = new Date(date.getTime() + DUBAI_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(
    shifted.getUTCDate()
  ).padStart(2, "0")}`;
}

function dubaiDayLabel(date: Date) {
  const shifted = new Date(date.getTime() + DUBAI_OFFSET_MS);
  return shifted.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

type Counts = { NOT_STARTED: number; IN_PROGRESS: number; COMPLETED: number };
const emptyCounts = (): Counts => ({ NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0 });

async function CompanyKpiSection({ company }: { company: { id: string; slug: string; name: string } }) {
  const [employees, tasks] = await Promise.all([
    prisma.membership.findMany({
      where: { companyId: company.id },
      include: { user: true },
      orderBy: { title: "asc" },
    }),
    prisma.task.findMany({
      where: { companyId: company.id },
      select: { assignedToId: true, status: true, completedAt: true },
    }),
  ]);

  const theme = getCompanyTheme(company.slug);

  const byEmployee = new Map<string, Counts>();
  const companyTotals = emptyCounts();
  for (const t of tasks) {
    const status = (t.status as keyof Counts) in companyTotals ? (t.status as keyof Counts) : "NOT_STARTED";
    companyTotals[status]++;
    const counts = byEmployee.get(t.assignedToId) ?? emptyCounts();
    counts[status]++;
    byEmployee.set(t.assignedToId, counts);
  }

  const companyTotal = companyTotals.NOT_STARTED + companyTotals.IN_PROGRESS + companyTotals.COMPLETED;
  const companyCompletionPct = companyTotal > 0 ? Math.round((companyTotals.COMPLETED / companyTotal) * 100) : 0;

  const days: { key: string; label: string }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    days.push({ key: dubaiDayKey(d), label: dubaiDayLabel(d) });
  }
  const completedByDay = new Map<string, number>();
  for (const t of tasks) {
    if (!t.completedAt) continue;
    const key = dubaiDayKey(new Date(t.completedAt));
    completedByDay.set(key, (completedByDay.get(key) ?? 0) + 1);
  }
  const trendPoints = days.map((d) => ({ label: d.label, value: completedByDay.get(d.key) ?? 0 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-2">
          <Image src={theme.logo} alt={theme.displayName} width={theme.logoWidth} height={theme.logoHeight} className="h-12 w-auto" />
        </div>
        <h2 className="text-[21px] font-semibold text-slate-900">{company.name}</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center">
          <h3 className="mb-3 self-start text-[19px] font-semibold text-slate-900">Company-wide status</h3>
          <SegmentedDonut
            size={140}
            strokeWidth={16}
            centerLabel={`${companyCompletionPct}%`}
            segments={[
              { label: "Completed", value: companyTotals.COMPLETED, color: STATUS_COLORS.COMPLETED },
              { label: "In progress", value: companyTotals.IN_PROGRESS, color: STATUS_COLORS.IN_PROGRESS },
              { label: "Not started", value: companyTotals.NOT_STARTED, color: STATUS_COLORS.NOT_STARTED },
            ]}
          />
          <div className="mt-2 text-[17px] text-slate-500">
            {companyTotals.COMPLETED} of {companyTotal} tasks completed
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-3 text-[19px] font-semibold text-slate-900">Tasks completed — last 14 days</h3>
          <LineChart points={trendPoints} color={`rgb(${(theme.vars as Record<string, string>)["--brand-600"]})`} />
        </Card>
      </div>

      <Card>
        <h3 className="mb-1 text-[19px] font-semibold text-slate-900">By role & responsibility</h3>
        <p className="mb-4 text-[17px] text-slate-500">Each person's own task completion, broken down by status.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((e) => {
            const counts = byEmployee.get(e.id) ?? emptyCounts();
            const total = counts.NOT_STARTED + counts.IN_PROGRESS + counts.COMPLETED;
            const pct = total > 0 ? Math.round((counts.COMPLETED / total) * 100) : 0;
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                <SegmentedDonut
                  size={72}
                  strokeWidth={9}
                  centerLabel={`${pct}%`}
                  segments={[
                    { label: "Completed", value: counts.COMPLETED, color: STATUS_COLORS.COMPLETED },
                    { label: "In progress", value: counts.IN_PROGRESS, color: STATUS_COLORS.IN_PROGRESS },
                    { label: "Not started", value: counts.NOT_STARTED, color: STATUS_COLORS.NOT_STARTED },
                  ]}
                />
                <div className="min-w-0">
                  <div className="truncate text-[19px] font-medium text-slate-900">
                    {e.user.name}
                    {e.isDirector && (
                      <span className="ml-1.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[13px] text-brand-700">
                        Director
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[15px] text-slate-500">
                    {e.title}
                    {e.department ? ` · ${e.department}` : ""}
                  </div>
                  <div className="mt-0.5 text-[13px] text-slate-400">
                    {counts.COMPLETED} done · {counts.IN_PROGRESS} in progress · {counts.NOT_STARTED} not started
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default async function KpiPercentagePage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  // Only ever two companies system-wide — always shown together, one
  // continuous page, no company switch involved.
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">KPI Percentage</h1>
        <p className="text-[17px] text-slate-500">Task completion by role and responsibility — both companies</p>
      </div>
      <div className="space-y-10">
        {companies.map((c) => (
          <CompanyKpiSection key={c.id} company={{ id: c.id, slug: c.slug, name: c.name }} />
        ))}
      </div>
    </div>
  );
}
