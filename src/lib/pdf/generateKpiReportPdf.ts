import PDFDocument from "pdfkit";
import type { ActivityReport } from "@/lib/kpiReport";
import { kpiScore } from "@/lib/queries";
import { NOTO_SANS_REGULAR_BASE64 } from "./fonts/notoSansBase64";

// Embedded (not loaded from disk) so pdfkit never touches its own built-in
// standard fonts, whose "#standard-fonts/*" package-imports resolution
// reliably crashes on Vercel's Node runtime (ERR/"Cannot find module") no
// matter how the files are traced into the deployment bundle.
const FONT_BUFFER = Buffer.from(NOTO_SANS_REGULAR_BASE64, "base64");

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

    doc.fontSize(18).fillColor("#111").text(`${membership.user.name} — KPI & Activity Report`);
    doc
      .fontSize(10)
      .fillColor("#555")
      .text(
        `${membership.title} · ${membership.company.name} · Generated ${new Date().toLocaleString()}`
      );

    doc.moveDown(0.75);
    doc
      .fillColor("#111")
      .fontSize(10)
      .text(`Tasks: ${tasks.length}    Completed: ${completedTasks}    Avg. progress: ${avgProgress}%`);

    doc.moveDown(1);
    doc.fontSize(13).fillColor("#111").text("KPIs");
    doc.moveDown(0.25);
    doc.fontSize(10);
    if (kpis.length === 0) {
      doc.fillColor("#888").text("No KPIs set.");
    } else {
      for (const k of kpis) {
        doc
          .fillColor("#111")
          .text(`${k.name}: ${k.current}${k.unit ?? ""} / ${k.target}${k.unit ?? ""} (${kpiScore(k)}%)`);
      }
    }

    doc.moveDown(1);
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
