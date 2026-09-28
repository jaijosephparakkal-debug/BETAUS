import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { Card, SegmentedDonut, LineChart, CompanyTag } from "@/components/ui";

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

export default async function KpiPercentagePage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  // Only ever two companies system-wide — merged into one ring, one trend
  // line, and one "by role" grid, each employee tagged by company, instead
  // of two separate sections. No company switch involved anywhere here.
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  const employees: { id: string; title: string; department: string | null; isDirector: boolean; companySlug: string; user: { name: string } }[] = [];
  const tasks: { assignedToId: string; status: string; completedAt: Date | null; companySlug: string }[] = [];
  const perCompanyTotals: { slug: string; name: string; completed: number; total: number }[] = [];

  for (const c of companies) {
    const [companyEmployees, companyTasks] = await Promise.all([
      prisma.membership.findMany({
        where: { companyId: c.id },
        include: { user: true },
        orderBy: { title: "asc" },
      }),
      prisma.task.findMany({
        where: { companyId: c.id },
        select: { assignedToId: true, status: true, completedAt: true },
      }),
    ]);
    employees.push(...companyEmployees.map((e) => ({ ...e, companySlug: c.slug })));
    tasks.push(...companyTasks.map((t) => ({ ...t, companySlug: c.slug })));
    perCompanyTotals.push({
      slug: c.slug,
      name: c.name,
      completed: companyTasks.filter((t) => t.status === "COMPLETED").length,
      total: companyTasks.length,
    });
  }

  const byEmployee = new Map<string, Counts>();
  const overallTotals = emptyCounts();
  for (const t of tasks) {
    const status = (t.status as keyof Counts) in overallTotals ? (t.status as keyof Counts) : "NOT_STARTED";
    overallTotals[status]++;
    const counts = byEmployee.get(t.assignedToId) ?? emptyCounts();
    counts[status]++;
    byEmployee.set(t.assignedToId, counts);
  }

  const overallTotal = overallTotals.NOT_STARTED + overallTotals.IN_PROGRESS + overallTotals.COMPLETED;
  const overallCompletionPct = overallTotal > 0 ? Math.round((overallTotals.COMPLETED / overallTotal) * 100) : 0;

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
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">KPI Percentage</h1>
        <p className="text-[17px] text-slate-500">Task completion by role and responsibility — both companies combined</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center">
          <h2 className="mb-3 self-start text-[19px] font-semibold text-slate-900">Company-wide status</h2>
          <SegmentedDonut
            size={140}
            strokeWidth={16}
            centerLabel={`${overallCompletionPct}%`}
            segments={[
              { label: "Completed", value: overallTotals.COMPLETED, color: STATUS_COLORS.COMPLETED },
              { label: "In progress", value: overallTotals.IN_PROGRESS, color: STATUS_COLORS.IN_PROGRESS },
              { label: "Not started", value: overallTotals.NOT_STARTED, color: STATUS_COLORS.NOT_STARTED },
            ]}
          />
          <div className="mt-2 text-[17px] text-slate-500">
            {overallTotals.COMPLETED} of {overallTotal} tasks completed
          </div>
          <div className="mt-3 w-full space-y-1 border-t border-brand-100 pt-3 text-left text-[15px] text-slate-500">
            {perCompanyTotals.map((c) => (
              <div key={c.slug} className="flex items-center gap-2">
                <CompanyTag slug={c.slug} />
                {c.completed}/{c.total} completed
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-[19px] font-semibold text-slate-900">Tasks completed — last 14 days</h2>
          <LineChart points={trendPoints} color="#4338ca" />
        </Card>
      </div>

      <Card>
        <h2 className="mb-1 text-[19px] font-semibold text-slate-900">By role & responsibility</h2>
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
                  <div className="flex items-center gap-1.5">
                    <CompanyTag slug={e.companySlug} />
                    <span className="truncate text-[19px] font-medium text-slate-900">{e.user.name}</span>
                    {e.isDirector && (
                      <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[13px] text-brand-700">
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
