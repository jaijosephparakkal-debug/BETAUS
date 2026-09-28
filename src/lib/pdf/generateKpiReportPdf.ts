import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import type { ActivityReport } from "@/lib/kpiReport";
import { kpiScore } from "@/lib/queries";
import { buildCompletionRollup } from "@/lib/completions";
import { getCompanyTheme } from "@/lib/theme";
import { NOTO_SANS_REGULAR_BASE64 } from "./fonts/notoSansBase64";

// Embedded (not loaded from disk) so pdfkit never touches its own built-in
// standard fonts, whose "#standard-fonts/*" package-imports resolution
// reliably crashes on Vercel's Node runtime (ERR/"Cannot find module") no
// matter how the files are traced into the deployment bundle.
const FONT_BUFFER = Buffer.from(NOTO_SANS_REGULAR_BASE64, "base64");

const STATUS_COLORS = {
  COMPLETED: "#10b981",
  IN_PROGRESS: "#f59e0b",
  NOT_STARTED: "#94a3b8",
};

/** Pie slices drawn as filled fans of triangles around the center — pdfkit has no native arc primitive. */
function drawPieChart(
  doc: PDFKit.PDFDocument,
  centerX: number,
  centerY: number,
  radius: number,
  segments: { label: string; value: number; color: string }[]
) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    doc.circle(centerX, centerY, radius).fillColor("#e5e7eb").fill();
    return;
  }
  let startAngle = -Math.PI / 2;
  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const sweep = (seg.value / total) * Math.PI * 2;
    const endAngle = startAngle + sweep;
    const steps = Math.max(2, Math.ceil((sweep / (Math.PI * 2)) * 80));
    doc.moveTo(centerX, centerY);
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (sweep * i) / steps;
      doc.lineTo(centerX + radius * Math.cos(a), centerY + radius * Math.sin(a));
    }
    doc.closePath();
    doc.fillColor(seg.color).fill();
    startAngle = endAngle;
  }
  doc.circle(centerX, centerY, radius).lineWidth(1).strokeColor("#ffffff").stroke();
}

function drawLineChart(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  points: { label: string; value: number }[],
  color: string
) {
  doc
    .moveTo(x, y + height)
    .lineTo(x + width, y + height)
    .strokeColor("#e5e7eb")
    .lineWidth(1)
    .stroke();

  if (points.length === 0) {
    doc.fontSize(9).fillColor("#94a3b8").text("No completions yet.", x, y + height / 2, { width, align: "center" });
    return;
  }

  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  const toY = (v: number) => y + height - (v / max) * (height - 6);

  doc.strokeColor(color).lineWidth(1.5);
  points.forEach((p, i) => {
    const px = x + i * stepX;
    const py = toY(p.value);
    if (i === 0) doc.moveTo(px, py);
    else doc.lineTo(px, py);
  });
  doc.stroke();

  points.forEach((p, i) => {
    const px = x + i * stepX;
    const py = toY(p.value);
    doc.circle(px, py, 2).fillColor(color).fill();
  });

  doc.fontSize(6.5).fillColor("#888");
  points.forEach((p, i) => {
    const px = x + i * stepX;
    doc.text(p.label, px - 18, y + height + 4, { width: 36, align: "center" });
  });
}

function statBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  color: string
) {
  doc.roundedRect(x, y, width, 46, 4).fillColor("#f8fafc").fill();
  doc.roundedRect(x, y, width, 46, 4).lineWidth(1).strokeColor("#e5e7eb").stroke();
  doc.fontSize(17).fillColor(color).text(value, x + 10, y + 7, { width: width - 20 });
  doc.fontSize(8).fillColor("#64748b").text(label, x + 10, y + 29, { width: width - 20 });
}

export function generateKpiReportPdf(report: ActivityReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Passing the font as the constructor option (rather than calling
    // .font() afterward) is what matters here: the constructor loads
    // *this* font as the default instead of ever touching pdfkit's broken
    // built-in "Helvetica" standard-font lookup.
    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
      bufferPages: true,
      // @types/pdfkit types this as string-only, but pdfkit itself accepts
      // a Buffer at runtime — see comment above for why that matters here.
      font: FONT_BUFFER as unknown as string,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { membership, kpis, events, completedTasks, avgProgress, tasks } = report;
    const pageLeft = doc.page.margins.left;
    const pageWidth = doc.page.width - pageLeft - doc.page.margins.right;

    const notStarted = tasks.filter((t) => t.status === "NOT_STARTED").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;

    // Header — company logo (best-effort; a missing/unreadable file never breaks report generation)
    const theme = getCompanyTheme(membership.company.slug);
    let headerTextX = pageLeft;
    try {
      const logoPath = path.join(process.cwd(), "public", theme.logo.replace(/^\//, ""));
      const logoBuffer = fs.readFileSync(logoPath);
      doc.image(logoBuffer, pageLeft, doc.y, { fit: [42, 42] });
      headerTextX = pageLeft + 54;
    } catch {
      // No logo available — proceed without one.
    }
    const headerTop = doc.y;
    doc.fontSize(18).fillColor("#111").text(`${membership.user.name}`, headerTextX, headerTop, {
      width: pageWidth - (headerTextX - pageLeft),
    });
    doc
      .fontSize(10)
      .fillColor("#555")
      .text(`${membership.title} · ${membership.company.name}`, headerTextX);
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(`KPI & Activity Report · Generated ${new Date().toLocaleString()}`, headerTextX);

    doc.y = Math.max(doc.y, headerTop + 46) + 16;

    // Stat boxes
    const statGap = 10;
    const statWidth = (pageWidth - statGap * 3) / 4;
    const statY = doc.y;
    statBox(doc, pageLeft, statY, statWidth, "Total tasks", String(tasks.length), "#111827");
    statBox(doc, pageLeft + (statWidth + statGap) * 1, statY, statWidth, "Completed", String(completedTasks), STATUS_COLORS.COMPLETED);
    statBox(doc, pageLeft + (statWidth + statGap) * 2, statY, statWidth, "In progress", String(inProgress), STATUS_COLORS.IN_PROGRESS);
    statBox(doc, pageLeft + (statWidth + statGap) * 3, statY, statWidth, "Avg. progress", `${avgProgress}%`, "#111827");
    doc.y = statY + 46 + 24;

    // Pie chart (task status) + line chart (completions trend), side by side
    const chartsTop = doc.y;
    doc.fontSize(12).fillColor("#111").text("Task status breakdown", pageLeft, chartsTop);
    doc.fontSize(12).fillColor("#111").text("Tasks completed — last 8 weeks", pageLeft + pageWidth / 2 + 10, chartsTop);

    const pieCenterX = pageLeft + 60;
    const pieCenterY = chartsTop + 30 + 55;
    drawPieChart(doc, pieCenterX, pieCenterY, 50, [
      { label: "Completed", value: completedTasks, color: STATUS_COLORS.COMPLETED },
      { label: "In progress", value: inProgress, color: STATUS_COLORS.IN_PROGRESS },
      { label: "Not started", value: notStarted, color: STATUS_COLORS.NOT_STARTED },
    ]);
    const legendX = pieCenterX + 70;
    let legendY = chartsTop + 30 + 20;
    for (const seg of [
      { label: "Completed", value: completedTasks, color: STATUS_COLORS.COMPLETED },
      { label: "In progress", value: inProgress, color: STATUS_COLORS.IN_PROGRESS },
      { label: "Not started", value: notStarted, color: STATUS_COLORS.NOT_STARTED },
    ]) {
      doc.rect(legendX, legendY, 8, 8).fillColor(seg.color).fill();
      doc.fontSize(8).fillColor("#374151").text(`${seg.label}: ${seg.value}`, legendX + 12, legendY - 1);
      legendY += 16;
    }

    const completions = events
      .filter((e) => e.kind === "completed")
      .map((e, i) => ({ id: String(i), title: "", completedAt: e.at }));
    const weeks = buildCompletionRollup(completions)
      .flatMap((m) => m.weeks)
      .sort((a, b) => (a.key < b.key ? -1 : 1))
      .slice(-8)
      .map((w) => ({ label: w.label.split(" – ")[0], value: w.count }));
    const brandLineColor = membership.company.slug === "gasneeds" ? "#d30a0a" : "#007ec8";
    drawLineChart(
      doc,
      pageLeft + pageWidth / 2 + 10,
      chartsTop + 30,
      pageWidth / 2 - 10,
      90,
      weeks,
      brandLineColor
    );

    doc.y = Math.max(pieCenterY + 60, chartsTop + 30 + 90 + 20) + 16;

    // KPIs, each with a small progress bar
    doc.fontSize(13).fillColor("#111").text("KPIs", pageLeft, doc.y);
    doc.moveDown(0.4);
    if (kpis.length === 0) {
      doc.fontSize(10).fillColor("#888").text("No KPIs set.");
    } else {
      for (const k of kpis) {
        const score = kpiScore(k);
        const rowY = doc.y;
        doc
          .fontSize(10)
          .fillColor("#111")
          .text(`${k.name}`, pageLeft, rowY, { width: pageWidth - 140, continued: false });
        doc
          .fontSize(9)
          .fillColor("#64748b")
          .text(`${k.current}${k.unit ?? ""} / ${k.target}${k.unit ?? ""} (${score}%)`, pageLeft, rowY, {
            width: pageWidth,
            align: "right",
          });
        const barY = rowY + 14;
        const barWidth = pageWidth;
        doc.roundedRect(pageLeft, barY, barWidth, 6, 3).fillColor("#f1f5f9").fill();
        doc
          .roundedRect(pageLeft, barY, Math.max(6, (barWidth * Math.min(100, score)) / 100), 6, 3)
          .fillColor(score >= 100 ? STATUS_COLORS.COMPLETED : score >= 50 ? "#007ec8" : STATUS_COLORS.IN_PROGRESS)
          .fill();
        doc.y = barY + 16;
      }
    }

    doc.moveDown(0.6);
    doc
      .fontSize(13)
      .fillColor("#111")
      .text(`Full activity log (${events.length} event${events.length === 1 ? "" : "s"})`);
    doc.moveDown(0.25);

    if (events.length === 0) {
      doc.fontSize(10).fillColor("#888").text("No activity logged yet.");
    } else {
      for (const e of events) {
        if (doc.y > doc.page.height - 80) doc.addPage();
        doc.fontSize(8).fillColor("#888").text(e.at.toLocaleString());
        doc.fontSize(10).fillColor("#111").text(e.label);
        doc.moveDown(0.4);
      }
    }

    doc.end();
  });
}
