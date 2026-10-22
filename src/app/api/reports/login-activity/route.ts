import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { dubaiDateKey, formatDubaiTime } from "@/lib/attendance";

// Director-only: who has signed in to the app, and on which days. Every
// sign-in clocks the person in, so attendance entries are the login record.
export async function GET() {
  const me = await getCurrentMembership();
  if (!me) return new NextResponse("Not signed in", { status: 401 });
  if (!me.isDirector) return new NextResponse("Directors only", { status: 403 });

  const staff = await prisma.membership.findMany({
    where: { isDirector: false },
    include: { user: true, company: true },
    orderBy: [{ company: { name: "asc" } }, { user: { name: "asc" } }],
  });
  const entries = await prisma.attendanceEntry.findMany({
    where: { membershipId: { in: staff.map((s) => s.id) } },
    orderBy: { clockIn: "asc" },
  });

  const daysBy = new Map<string, Set<string>>();
  const firstBy = new Map<string, Date>();
  const lastBy = new Map<string, Date>();
  for (const e of entries) {
    if (!daysBy.has(e.membershipId)) daysBy.set(e.membershipId, new Set());
    daysBy.get(e.membershipId)!.add(dubaiDateKey(e.clockIn));
    if (!firstBy.has(e.membershipId)) firstBy.set(e.membershipId, e.clockIn);
    lastBy.set(e.membershipId, e.clockIn);
  }

  const todayKey = dubaiDateKey(new Date());
  const monthPrefix = todayKey.slice(0, 7);
  const allDays: string[] = [];
  if (entries.length) {
    const cur = new Date(`${dubaiDateKey(entries[0].clockIn)}T00:00:00Z`);
    const end = new Date(`${todayKey}T00:00:00Z`);
    while (cur <= end) {
      allDays.push(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  const fmt = (d?: Date) =>
    d ? `${dubaiDateKey(d)} ${formatDubaiTime(d)}` : "—";

  const wb = new ExcelJS.Workbook();
  wb.creator = "OWN IT";
  const summary = wb.addWorksheet("Summary", { views: [{ state: "frozen", ySplit: 1 }] });
  summary.columns = [
    { header: "Name", key: "name", width: 24 },
    { header: "Company", key: "company", width: 14 },
    { header: "Title", key: "title", width: 24 },
    { header: "Ever logged in?", key: "ever", width: 16 },
    { header: "Days logged in (all time)", key: "all", width: 24 },
    { header: `Days logged in (${monthPrefix})`, key: "month", width: 24 },
    { header: "First login", key: "first", width: 22 },
    { header: "Last login", key: "last", width: 22 },
    { header: "Added to app", key: "added", width: 14 },
  ];
  summary.getRow(1).font = { bold: true };
  summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

  for (const s of staff) {
    const days = daysBy.get(s.id) ?? new Set<string>();
    const row = summary.addRow({
      name: s.user.name,
      company: s.company.name,
      title: s.title,
      ever: days.size ? "Yes" : "NO — never logged in",
      all: days.size,
      month: [...days].filter((d) => d.startsWith(monthPrefix)).length,
      first: fmt(firstBy.get(s.id)),
      last: fmt(lastBy.get(s.id)),
      added: dubaiDateKey(s.createdAt),
    });
    if (!days.size) row.getCell("ever").font = { bold: true, color: { argb: "FFB91C1C" } };
  }

  const grid = wb.addWorksheet("By day", { views: [{ state: "frozen", xSplit: 2, ySplit: 1 }] });
  grid.columns = [
    { header: "Name", key: "name", width: 22 },
    { header: "Company", key: "company", width: 12 },
    ...allDays.map((d) => ({ header: d.slice(5), key: d, width: 6 })),
  ];
  grid.getRow(1).font = { bold: true };
  for (const s of staff) {
    const days = daysBy.get(s.id) ?? new Set<string>();
    const row: Record<string, string> = { name: s.user.name, company: s.company.name };
    for (const d of allDays) row[d] = days.has(d) ? "✓" : "";
    grid.addRow(row);
  }

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="login-report-${todayKey}.xlsx"`,
    },
  });
}
