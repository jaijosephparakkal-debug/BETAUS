import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { getMonthCalendar, daysInMonth, keyOf, isHoliday, isWorkingDay, monthLabel } from "@/lib/attendanceCalendar";
import { dubaiDateKey } from "@/lib/attendance";
import { NOTO_SANS_REGULAR_BASE64 } from "./pdf/fonts/notoSansBase64";

const FONT_BUFFER = Buffer.from(NOTO_SANS_REGULAR_BASE64, "base64");

/** The whole month for the given people: first login over last logout, A = absent, AL = annual leave, H = holiday. */
export async function generateAllStaffCalendarPdf(year: number, month: number, userIds: string[]): Promise<Buffer> {
  const people = (await getMonthCalendar(year, month)).filter((p) => userIds.includes(p.userId));
  const todayKey = dubaiDateKey(new Date());
  const n = daysInMonth(year, month);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 28, size: "A3", layout: "landscape", font: FONT_BUFFER as unknown as string });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const L = 28;
    const red = "#D30A0A";
    const blue = "#007EC8";

    // Banner
    const grad = doc.linearGradient(0, 0, W, 0);
    grad.stop(0, blue).stop(0.5, "#F7941E").stop(1, red);
    doc.rect(0, 0, W, 58).fill(grad);
    try {
      const a = fs.readFileSync(path.join(process.cwd(), "public", "logos", "flaretech.png"));
      const b = fs.readFileSync(path.join(process.cwd(), "public", "logos", "gasneeds.png"));
      doc.roundedRect(L, 9, 120, 40, 5).fill("#ffffff");
      doc.image(a, L + 6, 12, { fit: [52, 34], align: "center", valign: "center" });
      doc.image(b, L + 64, 12, { fit: [52, 34], align: "center", valign: "center" });
    } catch {
      // Logos are optional.
    }
    doc.fillColor("#ffffff").fontSize(20).text(`Attendance calendar — ${monthLabel(year, month)}`, L + 140, 11, { width: W - L * 2 - 140 });
    doc.fontSize(10).text("First login (top) and last logout (bottom). Dubai time. Flaretech & Gasneeds.", L + 140, 36, { width: W - L * 2 - 140 });

    const nameW = 150;
    const cw = (W - L * 2 - nameW) / n;
    const top = 74;
    const hh = 22;
    const rh = Math.min(48, (doc.page.height - top - hh - 80) / Math.max(people.length, 1));

    doc.rect(L, top, nameW, hh).fill("#111827");
    doc.fillColor("#ffffff").fontSize(9).text("Staff", L + 8, top + 7, { width: nameW - 12 });
    for (let d = 1; d <= n; d++) {
      const k = keyOf(year, month, d);
      const dow = new Date(`${k}T00:00:00Z`).getUTCDay();
      const x = L + nameW + (d - 1) * cw;
      doc.rect(x, top, cw, hh).fill(dow === 0 || dow === 6 ? "#374151" : "#111827");
      doc.fillColor("#ffffff").fontSize(8).text(String(d), x, top + 3, { width: cw, align: "center" });
      doc.fontSize(5.5).text("SMTWTFS"[dow], x, top + 13, { width: cw, align: "center" });
    }

    people.forEach((p, i) => {
      const y = top + hh + i * rh;
      const brand = p.companySlug === "gasneeds" ? red : blue;
      doc.rect(L, y, nameW, rh).fill(i % 2 ? "#f8fafc" : "#ffffff");
      doc.rect(L, y, 3, rh).fill(brand);
      doc.fillColor("#111827").fontSize(9).text(p.name, L + 9, y + 8, { width: nameW - 14 });
      doc.fillColor("#64748b").fontSize(6.5).text(p.title, L + 9, y + 21, { width: nameW - 14 });
      for (let d = 1; d <= n; d++) {
        const k = keyOf(year, month, d);
        const x = L + nameW + (d - 1) * cw;
        const rec = p.days.get(k);
        let bg = "#ffffff";
        let line1 = "";
        let line2 = "";
        let color = "#475569";
        if (rec) {
          bg = rec.late ? "#fef3c7" : "#dcfce7";
          color = rec.late ? "#92400e" : "#166534";
          line1 = rec.first;
          line2 = rec.last === "still in" ? "in" : rec.last === "not recorded" ? "—" : rec.last;
        } else if (p.leave.has(k)) {
          bg = "#e0f2fe"; color = "#0369a1"; line1 = "AL";
        } else if (isHoliday(k)) {
          bg = "#f1f5f9"; color = "#94a3b8"; line1 = "H";
        } else if (isWorkingDay(k) && k >= p.joined && k < todayKey) {
          bg = "#ef4444"; color = "#ffffff"; line1 = "A";
        }
        doc.rect(x, y, cw, rh).fill(bg);
        doc.rect(x, y, cw, rh).lineWidth(0.5).stroke("#ffffff");
        if (line1) {
          const single = !line2;
          doc.fillColor(color).fontSize(single ? 9 : 6.5).text(line1, x, y + (single ? rh / 2 - 5 : rh / 2 - 9), { width: cw, align: "center" });
          if (line2) doc.text(line2, x, y + rh / 2 + 1, { width: cw, align: "center" });
        }
      }
    });

    const ly = top + hh + people.length * rh + 12;
    doc.fillColor("#475569").fontSize(8.5).text(
      "Green: logged in. Amber: first login after 8:15 AM. Red A: no login on a working day. Blue AL: annual leave. Grey H: holiday (every Sunday and alternate Saturdays). — means no logout was recorded that day. Please correct any red A or — day in the app (Reconcile my attendance).",
      L, ly, { width: W - L * 2 }
    );
    doc.end();
  });
}
