"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { saveFile } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BLOCKED_EXTENSIONS = /\.(exe|sh|bat|cmd|msi|app|dll)$/i;

export async function createApprovalRequestAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };
  if (!membership.managerId) {
    return { error: "You have no manager to send approval requests to." };
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
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
      approverId: membership.managerId,
      title,
      description: description || null,
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

  const decision = String(formData.get("decision") || "");
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return { error: "Invalid decision." };
  }
  const note = String(formData.get("note") || "").trim();

  await prisma.approvalRequest.update({
    where: { id },
    data: {
      status: decision,
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
