import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { getMonthAttendance, generateAttendanceMonthPdf } from "@/lib/attendanceMonthPdf";

// Director-only preview of one person's October attendance PDF (the same file that is emailed).
export async function GET(req: NextRequest) {
  const me = await getCurrentMembership();
  if (!me) return new NextResponse("Not signed in", { status: 401 });
  if (!me.isDirector) return new NextResponse("Directors only", { status: 403 });
  const email = req.nextUrl.searchParams.get("email") || "";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return new NextResponse("Not found", { status: 404 });
  const data = await getMonthAttendance(user.id, 2026, 10);
  if (!data) return new NextResponse("Not found", { status: 404 });
  const pdf = await generateAttendanceMonthPdf(data);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="October attendance - ${user.name}.pdf"` } });
}
