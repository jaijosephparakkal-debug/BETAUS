import PDFDocument from "pdfkit";
import type { ActivityReport } from "@/lib/kpiReport";
import { kpiScore } from "@/lib/queries";

export function generateKpiReportPdf(report: ActivityReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { membership, kpis, events, completedTasks, avgProgress, tasks } = report;

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#111")
      .text(`${membership.user.name} — KPI & Activity Report`);
    doc
      .font("Helvetica")
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
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#111").text("KPIs");
    doc.moveDown(0.25);
    doc.font("Helvetica").fontSize(10);
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
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#111")
      .text(`Full activity log (${events.length} event${events.length === 1 ? "" : "s"})`);
    doc.moveDown(0.25);

    if (events.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor("#888").text("No activity logged yet.");
    } else {
      for (const e of events) {
        if (doc.y > doc.page.height - 80) doc.addPage();
        doc.font("Helvetica").fontSize(8).fillColor("#888").text(e.at.toLocaleString());
        doc.font("Helvetica").fontSize(10).fillColor("#111").text(e.label);
        doc.moveDown(0.4);
      }
    }

    doc.end();
  });
}
