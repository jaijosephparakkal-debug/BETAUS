import { prisma } from "@/lib/db";
import { kpiScore } from "@/lib/queries";
import { sendReportEmail } from "@/lib/mailer";

export type PeriodReport = {
  companyName: string;
  periodLabel: string;
  firm: {
    headcount: number;
    tasksCompleted: number;
    avgKpiScore: number;
    bestDepartment: { name: string; avgScore: number } | null;
    worstDepartment: { name: string; avgScore: number } | null;
  };
  staff: {
    name: string;
    title: string;
    tasksCompleted: number;
    kpiCount: number;
    avgKpiScore: number;
  }[];
};

/** Builds one company's staff-by-staff + firm-wide KPI report for a date range. */
export async function buildFirmReport(
  companySlug: string,
  periodStart: Date,
  periodEnd: Date,
  periodLabel: string
): Promise<PeriodReport | null> {
  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) return null;

  const memberships = await prisma.membership.findMany({
    where: { companyId: company.id, isDirector: false },
    include: {
      user: true,
      kpis: true,
      tasksAssigned: {
        where: { completedAt: { gte: periodStart, lt: periodEnd } },
        select: { id: true },
      },
    },
    orderBy: { title: "asc" },
  });

  const staff = memberships.map((m) => {
    const scores = m.kpis.map((k) => kpiScore(k));
    const avgKpiScore = scores.length
      ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length)
      : 0;
    return {
      name: m.user.name,
      title: m.title,
      department: m.department,
      tasksCompleted: m.tasksAssigned.length,
      kpiCount: m.kpis.length,
      avgKpiScore,
    };
  });

  const tasksCompleted = staff.reduce((s, x) => s + x.tasksCompleted, 0);
  const scoredStaff = staff.filter((s) => s.kpiCount > 0);
  const avgKpiScore = scoredStaff.length
    ? Math.round(scoredStaff.reduce((s, x) => s + x.avgKpiScore, 0) / scoredStaff.length)
    : 0;

  const deptScores = new Map<string, number[]>();
  for (const s of scoredStaff) {
    const dept = s.department ?? "Unassigned";
    if (!deptScores.has(dept)) deptScores.set(dept, []);
    deptScores.get(dept)!.push(s.avgKpiScore);
  }
  const deptAverages = [...deptScores.entries()]
    .map(([name, scores]) => ({
      name,
      avgScore: Math.round(scores.reduce((s, x) => s + x, 0) / scores.length),
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  return {
    companyName: company.name,
    periodLabel,
    firm: {
      headcount: staff.length,
      tasksCompleted,
      avgKpiScore,
      bestDepartment: deptAverages[0] ?? null,
      worstDepartment: deptAverages.length > 1 ? deptAverages[deptAverages.length - 1] : null,
    },
    staff: staff.map(({ department: _department, ...rest }) => rest),
  };
}

export function renderReportHtml(report: PeriodReport): string {
  const rows = report.staff
    .map(
      (s) => `<tr>
        <td style="padding:6px 10px;border:1px solid #e2e8f0">${s.name}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0">${s.title}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${s.tasksCompleted}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:center">${
          s.kpiCount ? `${s.avgKpiScore}%` : "—"
        }</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;color:#1e293b">
      <h2 style="margin-bottom:4px">${report.companyName}</h2>
      <p style="margin-top:0;color:#64748b">${report.periodLabel}</p>
      <p>
        <strong>${report.firm.headcount}</strong> staff ·
        <strong>${report.firm.tasksCompleted}</strong> tasks completed this period ·
        avg KPI score <strong>${report.firm.avgKpiScore}%</strong>
      </p>
      ${
        report.firm.bestDepartment
          ? `<p>Best performing department: <strong>${report.firm.bestDepartment.name}</strong> (${report.firm.bestDepartment.avgScore}%)</p>`
          : ""
      }
      ${
        report.firm.worstDepartment
          ? `<p>Needs attention: <strong>${report.firm.worstDepartment.name}</strong> (${report.firm.worstDepartment.avgScore}%)</p>`
          : ""
      }
      <table style="border-collapse:collapse;margin-top:12px;width:100%">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left">Name</th>
            <th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:left">Title</th>
            <th style="padding:6px 10px;border:1px solid #e2e8f0">Tasks completed</th>
            <th style="padding:6px 10px;border:1px solid #e2e8f0">Avg KPI score</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/** Semi-monthly window ending "today" — the 16th–end for a report sent on the 1st, or 1st–15th for one sent on the 16th. */
export function semiMonthlyPeriod(now: Date) {
  const day = now.getDate();
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (day <= 15) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 16);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end, label: `${fmt(start)} – ${fmt(new Date(end.getTime() - 1))}, ${end.getFullYear()}` };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 16);
  return { start, end, label: `${fmt(start)} – ${fmt(new Date(end.getTime() - 1))}, ${end.getFullYear()}` };
}

/** The full previous calendar month. */
export function monthlyPeriod(now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const label = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return { start, end, label };
}

/**
 * Builds and emails every company's report to its director for the given
 * cadence. Called by the two Vercel Cron routes (15-day and monthly) — see
 * vercel.json for the schedule.
 */
export async function runScheduledReports(kind: "semimonthly" | "monthly") {
  const now = new Date();
  const { start, end, label } = kind === "monthly" ? monthlyPeriod(now) : semiMonthlyPeriod(now);
  const kindLabel = kind === "monthly" ? "Monthly" : "15-Day";

  const companies = await prisma.company.findMany();
  const results: { company: string; sent: boolean; to?: string }[] = [];

  for (const company of companies) {
    const report = await buildFirmReport(company.slug, start, end, label);
    if (!report) {
      results.push({ company: company.slug, sent: false });
      continue;
    }
    const director = await prisma.membership.findFirst({
      where: { companyId: company.id, isDirector: true },
      include: { user: true },
    });
    if (!director) {
      results.push({ company: company.slug, sent: false });
      continue;
    }
    const sent = await sendReportEmail(
      director.user.email,
      `${kindLabel} KPI report — ${report.companyName} — ${label}`,
      renderReportHtml(report)
    );
    results.push({ company: company.slug, sent, to: director.user.email });
  }

  return results;
}
