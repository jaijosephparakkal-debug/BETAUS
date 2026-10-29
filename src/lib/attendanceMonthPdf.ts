import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";
import { DUBAI_OFFSET_MS, dubaiDateKey, formatDubaiTime } from "@/lib/attendance";
import { getCompanyTheme } from "@/lib/theme";
import { isHoliday } from "@/lib/attendanceCalendar";
import { NOTO_SANS_REGULAR_BASE64 } from "./pdf/fonts/notoSansBase64";

const FONT_BUFFER = Buffer.from(NOTO_SANS_REGULAR_BASE64, "base64");

const LATE_AFTER_MIN = 8 * 60 + 15;

export type DayRecord = { first: string; last: string; late: boolean; corrected: boolean; auto: boolean };

function keyOf(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function minutesOfDay(d: Date) {
  const s = new Date(d.getTime() + DUBAI_OFFSET_MS);
  return s.getUTCHours() * 60 + s.getUTCMinutes();
}
function hhmm(d: Date) {
  const s = new Date(d.getTime() + DUBAI_OFFSET_MS);
  return `${String(s.getUTCHours()).padStart(2, "0")}:${String(s.getUTCMinutes()).padStart(2, "0")}`;
}

export async function getMonthAttendance(userId: string, year: number, month: number) {
  const startKey = keyOf(year, month, 1);
  const start = new Date(new Date(`${startKey}T00:00:00Z`).getTime() - DUBAI_OFFSET_MS);
  const next = month === 12 ? keyOf(year + 1, 1, 1) : keyOf(year, month + 1, 1);
  const end = new Date(new Date(`${next}T00:00:00Z`).getTime() - DUBAI_OFFSET_MS);

  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { user: true, company: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) return null;
  const entries = await prisma.attendanceEntry.findMany({
    where: { membershipId: { in: memberships.map((m) => m.id) }, clockIn: { gte: start, lt: end } },
    orderBy: { clockIn: "asc" },
  });

  const todayKey = dubaiDateKey(new Date());
  const leaveRows = await prisma.leaveDay.findMany({ where: { userId, date: { gte: startKey, lt: next } } });
  const leave = new Set(leaveRows.map((l) => l.date));
  const byDay = new Map<string, typeof entries>();
  for (const e of entries) {
    const k = dubaiDateKey(e.clockIn);
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }
  const days = new Map<string, DayRecord>();
  for (const [k, list] of byDay) {
    const first = list.reduce((a, b) => (a.clockIn <= b.clockIn ? a : b));
    const outs = list.filter((e) => e.clockOut && dubaiDateKey(e.clockOut) === k).map((e) => e.clockOut!);
    const open = list.some((e) => !e.clockOut);
    const last = outs.length
      ? hhmm(new Date(Math.max(...outs.map((d) => d.getTime()))))
      : open && k === todayKey
        ? "still in"
        : "not recorded";
    days.set(k, {
      first: hhmm(first.clockIn),
      last,
      late: minutesOfDay(first.clockIn) > LATE_AFTER_MIN,
      corrected: list.some((e) => e.isManual),
      auto: list.some((e) => e.reason === "AUTO_6PM" || e.reason === "AUTO_EOD"),
    });
  }

  // The primary membership for branding: Gasneeds if they hold it, otherwise their first.
  const primary = memberships.find((m) => m.company.slug === "gasneeds") ?? memberships[0];
  const joined = dubaiDateKey(memberships[0].createdAt);
  return { name: primary.user.name, title: primary.title, companySlug: primary.company.slug, companyName: primary.company.name, joined, days, leave, year, month, todayKey };
}

type MonthData = NonNullable<Awaited<ReturnType<typeof getMonthAttendance>>>;

export function generateAttendanceMonthPdf(d: MonthData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 28, size: "A4", layout: "landscape", font: FONT_BUFFER as unknown as string });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const theme = getCompanyTheme(d.companySlug);
    const primary = d.companySlug === "gasneeds" ? "#D30A0A" : "#007EC8";
    const accent = d.companySlug === "gasneeds" ? "#1A1A1A" : "#F7941E";
    const W = doc.page.width;
    const L = 28;
    const monthName = new Date(Date.UTC(d.year, d.month - 1, 1)).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

    // Banner
    const grad = doc.linearGradient(0, 0, W, 0);
    grad.stop(0, primary).stop(1, accent);
    doc.rect(0, 0, W, 62).fill(grad);
    doc.rect(0, 62, W, 3).fill(accent);
    let textX = L;
    try {
      const logo = fs.readFileSync(path.join(process.cwd(), "public", theme.logo.replace(/^\//, "")));
      doc.roundedRect(L, 10, 56, 42, 5).fill("#ffffff");
      doc.image(logo, L + 6, 14, { fit: [44, 34], align: "center", valign: "center" });
      textX = L + 68;
    } catch {
      // No logo available — continue without it.
    }
    doc.fillColor("#ffffff").fontSize(18).text(d.name, textX, 13, { width: W - textX - L });
    doc.fontSize(9.5).text(`${d.title} · ${d.companyName}  |  Attendance, ${monthName} (Dubai time)`, textX, 38, { width: W - textX - L });

    // Month figures
    const lastDay = new Date(Date.UTC(d.year, d.month, 0)).getUTCDate();
    let present = 0, absent = 0, late = 0, corrected = 0;
    for (let day = 1; day <= lastDay; day++) {
      const k = keyOf(d.year, d.month, day);
      const rec = d.days.get(k);
      const weekday = new Date(`${k}T00:00:00Z`).getUTCDay();
      const working = weekday >= 1 && weekday <= 5 && !isHoliday(k) && k >= d.joined;
      if (rec) {
        if (working) present++;
        if (rec.late) late++;
        if (rec.corrected) corrected++;
      } else if (working && k < d.todayKey && !d.leave.has(k)) absent++;
    }
    const stats: [string, string, string][] = [["Days present", String(present), "#166534"], ["Absent", String(absent), absent ? "#B91C1C" : "#6B7280"], ["First login after 8:15", String(late), late ? "#B45309" : "#6B7280"], ["Corrected manually", String(corrected), "#6B7280"]];
    const boxW = (W - L * 2 - 30) / 4;
    stats.forEach(([label, value, color], i) => {
      const x = L + i * (boxW + 10);
      doc.roundedRect(x, 76, boxW, 40, 4).fill("#f8fafc");
      doc.roundedRect(x, 76, boxW, 40, 4).lineWidth(0.8).stroke("#e5e7eb");
      doc.fillColor(color).fontSize(16).text(value, x + 10, 81, { width: boxW - 20 });
      doc.fillColor("#64748b").fontSize(7.5).text(label, x + 10, 103, { width: boxW - 20 });
    });

    // Calendar (Mon–Sun)
    const top = 130;
    const cw = (W - L * 2) / 7;
    const ch = 70;
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((n, i) => {
      doc.rect(L + i * cw, top, cw, 16).fill(primary);
      doc.fillColor("#ffffff").fontSize(8).text(n, L + i * cw, top + 4.5, { width: cw, align: "center" });
    });
    const firstDow = (new Date(Date.UTC(d.year, d.month - 1, 1)).getUTCDay() + 6) % 7;
    for (let day = 1; day <= lastDay; day++) {
      const pos = firstDow + day - 1;
      const x = L + (pos % 7) * cw;
      const y = top + 16 + Math.floor(pos / 7) * ch;
      const k = keyOf(d.year, d.month, day);
      const rec = d.days.get(k);
      const weekday = new Date(`${k}T00:00:00Z`).getUTCDay();
      const holiday = isHoliday(k);
      const working = weekday >= 1 && weekday <= 5 && !holiday && k >= d.joined;
      let bg = "#f1f5f9";
      if (rec) bg = "#dcfce7";
      else if (d.leave.has(k)) bg = "#e0f2fe";
      else if (working && k < d.todayKey) bg = "#fee2e2";
      doc.rect(x, y, cw, ch).fill(bg);
      doc.rect(x, y, cw, ch).lineWidth(0.6).stroke("#ffffff");
      doc.fillColor("#475569").fontSize(8).text(String(day), x + 5, y + 4, { width: 20 });
      if (rec) {
        doc.fillColor(rec.late ? "#B45309" : "#166534").fontSize(9.5).text(`In  ${rec.first}`, x + 5, y + 20, { width: cw - 10 });
        doc.fillColor("#166534").fontSize(9.5).text(`Out ${rec.last}`, x + 5, y + 33, { width: cw - 10 });
        if (rec.corrected) doc.fillColor("#475569").fontSize(7).text("Corrected manually", x + 5, y + 54, { width: cw - 10 });
        if (rec.auto) doc.fillColor("#475569").fontSize(7).text("Auto clocked out", x + 5, y + (rec.corrected ? 46 : 54), { width: cw - 10 });
      } else if (holiday) {
        doc.fillColor("#94a3b8").fontSize(9).text("Holiday", x + 5, y + 28, { width: cw - 10, align: "center" });
      } else if (d.leave.has(k)) {
        doc.fillColor("#0369a1").fontSize(10).text("Annual leave", x + 5, y + 28, { width: cw - 10, align: "center" });
      } else if (working && k < d.todayKey) {
        doc.fillColor("#B91C1C").fontSize(10).text("Absent", x + 5, y + 28, { width: cw - 10, align: "center" });
      }
    }

    // Legend and note
    const ly = top + 16 + Math.ceil((firstDow + lastDay) / 7) * ch + 10;
    doc.fillColor("#64748b").fontSize(7.5).text(
      "Green: logged in (In = first login, Out = last logout). Amber In time: first login after 8:15. Red: no login on a working day. Grey: holiday (every Sunday and the alternate Saturdays). “not recorded” means no logout was recorded that day.",
      L, ly, { width: W - L * 2 }
    );
    doc.end();
  });
}

export { formatDubaiTime };
