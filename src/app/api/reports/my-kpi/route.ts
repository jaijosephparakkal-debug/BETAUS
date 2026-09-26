import { NextRequest, NextResponse } from "next/server";
import { getCurrentMembership, isManagerOf } from "@/lib/auth";
import { getActivityReport } from "@/lib/kpiReport";
import { generateKpiReportPdf } from "@/lib/pdf/generateKpiReportPdf";

export async function GET(request: NextRequest) {
  const membership = await getCurrentMembership();
  if (!membership) {
    return new NextResponse("Not signed in", { status: 401 });
  }

  const targetId = request.nextUrl.searchParams.get("membershipId") || membership.id;
  if (targetId !== membership.id) {
    const canManage =
      membership.isDirector || (await isManagerOf(membership.id, targetId));
    if (!canManage) {
      return new NextResponse("You don't have access to this report", { status: 403 });
    }
  }

  const report = await getActivityReport(targetId);
  if (!report || report.membership.companyId !== membership.companyId) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await generateKpiReportPdf(report);
    const filename = `${report.membership.user.name.replace(/\s+/g, "_")}_KPI_Report.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    // TEMPORARY diagnostic — remove once the render failure is understood.
    return NextResponse.json(
      { error: String(e), stack: e instanceof Error ? e.stack : null },
      { status: 500 }
    );
  }
}
