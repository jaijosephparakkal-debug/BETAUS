"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership, isManagerOf } from "@/lib/auth";
import { saveFile } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BLOCKED_EXTENSIONS = /\.(exe|sh|bat|cmd|msi|app|dll)$/i;

export async function logProgressAction(
  taskId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assignedToId !== membership.id) {
    return { error: "You can only log progress on your own tasks." };
  }

  const body = String(formData.get("body") || "").trim();
  const progressRaw = formData.get("progress");
  const progress = progressRaw
    ? Math.max(0, Math.min(100, Number(progressRaw)))
    : task.progress;

  if (!body) {
    return { error: "Add a short update before saving." };
  }

  const status =
    progress >= 100 ? "COMPLETED" : progress > 0 ? "IN_PROGRESS" : "NOT_STARTED";

  await prisma.$transaction([
    prisma.taskComment.create({
      data: {
        taskId,
        authorId: membership.id,
        body,
        progressAt: progress,
      },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { progress, status },
    }),
  ]);

  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return {};
}

export async function uploadTaskAttachmentAction(
  taskId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.companyId !== membership.companyId) {
    return { error: "Task not found." };
  }
  const isOwner = task.assignedToId === membership.id;
  const canManage =
    membership.isDirector || (await isManagerOf(membership.id, task.assignedToId));
  if (!isOwner && !canManage) {
    return { error: "You don't have access to this task." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file first." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File is too large (10MB max)." };
  }
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
      uploadedById: membership.id,
      taskId,
    },
  });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  return {};
}
