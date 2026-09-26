"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { saveFile } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BLOCKED_EXTENSIONS = /\.(exe|sh|bat|cmd|msi|app|dll)$/i;
const REQUEST_TYPES = ["REVIEW", "APPROVAL", "BOTH"];
const OUTCOMES = ["REVIEWED", "APPROVED", "REVIEWED_AND_APPROVED", "REJECTED"];

export async function createApprovalRequestAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const approverId = String(formData.get("approverId") || "");
  if (!approverId || approverId === membership.id) {
    return { error: "Choose who to send this to." };
  }
  const approver = await prisma.membership.findUnique({ where: { id: approverId } });
  if (!approver || approver.companyId !== membership.companyId) {
    return { error: "Choose a valid colleague at your company." };
  }

  const requestType = String(formData.get("requestType") || "APPROVAL");
  if (!REQUEST_TYPES.includes(requestType)) {
    return { error: "Invalid request type." };
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const deadlineRaw = String(formData.get("deadline") || "");
  if (!title) return { error: "Give the request a title." };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_SIZE) return { error: "File is too large (10MB max)." };
    if (BLOCKED_EXTENSIONS.test(file.name)) {
      return { error: "That file type isn't allowed." };
    }
  }

  const request = await prisma.approvalRequest.create({
    data: {
      companyId: membership.companyId,
      requestedById: membership.id,
      approverId,
      title,
      description: description || null,
      requestType,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
      // Snapshotted so the signed copy never changes even if the signature is redrawn later.
      requestSignature: membership.user.signature,
    },
  });

  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { storagePath, size } = await saveFile(buffer, file.name);
    await prisma.attachment.create({
      data: {
        filename: file.name,
        mimetype: file.type || "application/octet-stream",
        size,
        storagePath,
        uploadedById: membership.id,
        approvalRequestId: request.id,
      },
    });
  }

  revalidatePath("/dashboard/approvals");
  redirect(`/dashboard/approvals/${request.id}`);
}

export async function saveSignatureAction(dataUrl: string): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  if (!dataUrl.startsWith("data:image/png;base64,") || dataUrl.length > 200_000) {
    return { error: "Invalid signature." };
  }

  await prisma.user.update({
    where: { id: membership.user.id },
    data: { signature: dataUrl },
  });

  revalidatePath("/dashboard/approvals");
  return {};
}

export async function clearSignatureAction(): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  await prisma.user.update({
    where: { id: membership.user.id },
    data: { signature: null },
  });

  revalidatePath("/dashboard/approvals");
  return {};
}

export async function decideApprovalAction(
  id: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const request = await prisma.approvalRequest.findUnique({ where: { id } });
  if (!request || request.approverId !== membership.id) {
    return { error: "You can only decide requests sent to you." };
  }
  if (request.status !== "PENDING") return {};

  const outcome = String(formData.get("outcome") || "");
  if (!OUTCOMES.includes(outcome)) {
    return { error: "Choose an outcome before sending." };
  }
  const note = String(formData.get("note") || "").trim();

  await prisma.approvalRequest.update({
    where: { id },
    data: {
      status: outcome,
      decisionNote: note || null,
      decidedAt: new Date(),
      // Snapshotted so the signed decision never changes even if the signature is redrawn later.
      decisionSignature: membership.user.signature,
    },
  });

  revalidatePath("/dashboard/approvals");
  revalidatePath(`/dashboard/approvals/${id}`);
  return {};
}

export async function reassignApprovalAction(
  id: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const request = await prisma.approvalRequest.findUnique({ where: { id } });
  if (!request || request.approverId !== membership.id) {
    return { error: "You can only reassign requests sent to you." };
  }
  if (request.status !== "PENDING") {
    return { error: "This request has already been decided." };
  }

  const newApproverId = String(formData.get("newApproverId") || "");
  if (!newApproverId || newApproverId === membership.id) {
    return { error: "Choose someone else to reassign this to." };
  }
  const newApprover = await prisma.membership.findUnique({
    where: { id: newApproverId },
    include: { user: true },
  });
  if (!newApprover || newApprover.companyId !== membership.companyId) {
    return { error: "Choose a valid colleague at your company." };
  }

  await prisma.$transaction([
    prisma.approvalRequest.update({
      where: { id },
      data: { approverId: newApproverId, viewedAt: null },
    }),
    prisma.approvalComment.create({
      data: {
        approvalRequestId: id,
        authorId: membership.id,
        body: `Reassigned to ${newApprover.user.name} (${newApprover.title}).`,
      },
    }),
  ]);

  revalidatePath("/dashboard/approvals");
  revalidatePath(`/dashboard/approvals/${id}`);
  return {};
}

async function assertApprovalAccess(id: string) {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." as const };

  const request = await prisma.approvalRequest.findUnique({ where: { id } });
  if (
    !request ||
    (request.requestedById !== membership.id && request.approverId !== membership.id)
  ) {
    return { error: "You don't have access to this request." as const };
  }
  return { membership, request };
}

export async function postApprovalCommentAction(
  id: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const access = await assertApprovalAccess(id);
  if ("error" in access) return { error: access.error };

  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Write something first." };

  await prisma.approvalComment.create({
    data: { approvalRequestId: id, authorId: access.membership.id, body },
  });

  revalidatePath(`/dashboard/approvals/${id}`);
  return {};
}

export async function uploadApprovalAttachmentAction(
  id: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const access = await assertApprovalAccess(id);
  if ("error" in access) return { error: access.error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file first." };
  }
  if (file.size > MAX_FILE_SIZE) return { error: "File is too large (10MB max)." };
  if (BLOCKED_EXTENSIONS.test(file.name)) {
    return { error: "That file type isn't allowed." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storagePath, size } = await saveFile(buffer, file.name);
  await prisma.attachment.create({
    data: {
      filename: file.name,
      mimetype: file.type || "application/octet-stream",
      size,
      storagePath,
      uploadedById: access.membership.id,
      approvalRequestId: id,
    },
  });

  revalidatePath(`/dashboard/approvals/${id}`);
  return {};
}
