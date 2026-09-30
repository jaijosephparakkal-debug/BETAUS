import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";

// Dubai has no DST, fixed UTC+4.
const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;

function dubaiDayRange(date = new Date()) {
  const dubaiNow = new Date(date.getTime() + DUBAI_OFFSET_MS);
  const y = dubaiNow.getUTCFullYear();
  const m = dubaiNow.getUTCMonth();
  const d = dubaiNow.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0) - DUBAI_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const label = new Date(Date.UTC(y, m, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { start, end, label };
}

function formatDubaiTime(date: Date) {
  const shifted = new Date(date.getTime() + DUBAI_OFFSET_MS);
  const h = shifted.getUTCHours();
  const min = String(shifted.getUTCMinutes()).padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${period}`;
}

function formatDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

const REASON_LABELS: Record<string, string> = {
  OFFICE_USE: "Office use",
  SICKNESS: "Sickness",
  SHIFT_ENDED: "Shift ended",
};

/** Builds a daily attendance Excel workbook covering every company, for the given (or current) Dubai calendar day. */
export async function buildAttendanceExcel(date = new Date()) {
  const { start, end, label } = dubaiDayRange(date);

  const entries = await prisma.attendanceEntry.findMany({
    where: { clockIn: { gte: start, lt: end } },
    include: { membership: { include: { user: true, company: true } } },
    orderBy: [{ membership: { company: { name: "asc" } } }, { clockIn: "asc" }],
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Flowline";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Attendance", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Name", key: "name", width: 26 },
    { header: "Company", key: "company", width: 16 },
    { header: "Title", key: "title", width: 24 },
    { header: "Clock In", key: "clockIn", width: 12 },
    { header: "Clock Out", key: "clockOut", width: 16 },
    { header: "Hours", key: "hours", width: 10 },
    { header: "Reason", key: "reason", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

  const now = new Date();
  for (const entry of entries) {
    const isOpen = !entry.clockOut;
    const durationMs = (entry.clockOut ? entry.clockOut.getTime() : now.getTime()) - entry.clockIn.getTime();
    sheet.addRow({
      name: entry.membership.user.name,
      company: entry.membership.company.name,
      title: entry.membership.title,
      clockIn: formatDubaiTime(entry.clockIn),
      clockOut: isOpen ? "Still clocked in" : formatDubaiTime(entry.clockOut!),
      hours: formatDuration(durationMs),
      reason: entry.reason ? REASON_LABELS[entry.reason] ?? entry.reason : "—",
    });
  }

  if (entries.length === 0) {
    sheet.addRow({ name: "No attendance entries for this day." });
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return { buffer, label, count: entries.length };
}
