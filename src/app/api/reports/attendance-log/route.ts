import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { dubaiDateKey, formatDubaiTime, SIGN_OUT_REASONS } from "@/lib/attendance";

// Director-only: every staff login/logout since attendance tracking began.
// Directors' own entries are left out. Every sign-in clocks the person in.
export async function GET() {
  const me = await getCurrentMembership();
  if (!me) return new NextResponse("Not signed in", { status: 401 });
  if (!me.isDirector) return new NextResponse("Directors only", { status: 403 });

  const entries = await prisma.attendanceEntry.findMany({
    where: { membership: { isDirector: false } },
    include: { membership: { include: { user: true, company: true } } },
    orderBy: { clockIn: "asc" },
  });

  const now = new Date();
  const wb = new ExcelJS.Workbook();
  wb.creator = "OWN IT";
  const sheet = wb.addWorksheet("Attendance", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Date", key: "date", width: 13 },
    { header: "Name", key: "name", width: 24 },
    { header: "Company", key: "company", width: 12 },
    { header: "Title", key: "title", width: 24 },
    { header: "Logged in", key: "in", width: 12 },
    { header: "Logged out", key: "out", width: 18 },
    { header: "Hours", key: "hours", width: 9 },
    { header: "Reason", key: "reason", width: 26 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

  const sorted = [...entries].sort(
    (a, b) =>
      dubaiDateKey(a.clockIn).localeCompare(dubaiDateKey(b.clockIn)) ||
      a.membership.user.name.localeCompare(b.membership.user.name) ||
      a.clockIn.getTime() - b.clockIn.getTime()
  );
  for (const e of sorted) {
    const ms = (e.clockOut ?? now).getTime() - e.clockIn.getTime();
    const mins = Math.max(0, Math.round(ms / 60000));
    sheet.addRow({
      date: dubaiDateKey(e.clockIn),
      name: e.membership.user.name,
      company: e.membership.company.name,
      title: e.membership.title,
      in: formatDubaiTime(e.clockIn),
      out: e.clockOut ? formatDubaiTime(e.clockOut) : "Still logged in",
      hours: `${Math.floor(mins / 60)}h ${mins % 60}m`,
      reason: e.reason ? SIGN_OUT_REASONS[e.reason as keyof typeof SIGN_OUT_REASONS] ?? e.reason : "",
    });
  }

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-log-${dubaiDateKey(now)}.xlsx"`,
    },
  });
}
