import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMembership, isManagerOf } from "@/lib/auth";
import { readFile } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const membership = await getCurrentMembership();
  if (!membership) return new NextResponse("Not signed in", { status: 401 });

  const attachment = await prisma.attachment.findUnique({
    where: { id: params.id },
    include: { task: true, approvalRequest: true },
  });
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  let allowed = false;
  if (attachment.task) {
    const task = attachment.task;
    allowed =
      task.companyId === membership.companyId &&
      (task.assignedToId === membership.id ||
        membership.isDirector ||
        (await isManagerOf(membership.id, task.assignedToId)));
  } else if (attachment.approvalRequest) {
    const request = attachment.approvalRequest;
    allowed =
      request.companyId === membership.companyId &&
      (request.requestedById === membership.id ||
        request.approverId === membership.id);
  }
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  const buffer = await readFile(attachment.storagePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": attachment.mimetype,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
      "Content-Length": String(attachment.size),
    },
  });
}
