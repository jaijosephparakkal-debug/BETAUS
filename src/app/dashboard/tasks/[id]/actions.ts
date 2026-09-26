"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, isManagerOf } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import { recomputeTaskProgress } from "@/lib/tasks";

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

  if (task.parentTaskId) {
    await recomputeTaskProgress(task.parentTaskId);
    revalidatePath(`/dashboard/tasks/${task.parentTaskId}`);
  }
  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return {};
}

const QUICK_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
const QUICK_STATUS_LABELS: Record<(typeof QUICK_STATUSES)[number], string> = {
  NOT_STARTED: "Marked as Not Started",
  IN_PROGRESS: "Marked as In Progress",
  COMPLETED: "Marked as Complete",
};

/**
 * Lightweight status toggle for daily tasks and project-pipeline stage
 * tasks — no comment or approval required, just a quick "done / in
 * progress / not started" flip. Still logs an auto-generated comment so
 * the change shows up with a timestamp in the person's activity/KPI
 * report, same as a normal progress update would.
 *
 * `completedAtInput` (datetime-local string, e.g. "2026-09-20T14:30") lets
 * the person backdate when a stage was actually finished — most of this
 * pipeline is being logged retroactively as the app rolls out, so "now" is
 * often wrong. Defaults to the current time when omitted.
 */
export async function quickToggleTaskStatusAction(
  taskId: string,
  targetStatus: (typeof QUICK_STATUSES)[number],
  completedAtInput?: string | null
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assignedToId !== membership.id) {
    return { error: "You can only update your own tasks." };
  }
  const isDailyTask = !!task.parentTaskId;
  const isStageTask = !!task.projectId && task.stageOrder != null;
  if (!isDailyTask && !isStageTask) {
    return { error: "Quick status toggles are only for daily or project-stage tasks." };
  }
  if (!QUICK_STATUSES.includes(targetStatus)) {
    return { error: "Invalid status." };
  }

  const progress =
    targetStatus === "COMPLETED"
      ? 100
      : targetStatus === "NOT_STARTED"
        ? 0
        : task.progress > 0 && task.progress < 100
          ? task.progress
          : 50;

  let completedAt: Date | null = null;
  if (targetStatus === "COMPLETED") {
    const parsed = completedAtInput ? new Date(completedAtInput) : new Date();
    if (isNaN(parsed.getTime())) return { error: "Invalid completion date." };
    completedAt = parsed;
  }

  await prisma.$transaction([
    prisma.task.update({ where: { id: taskId }, data: { status: targetStatus, progress, completedAt } }),
    prisma.taskComment.create({
      data: {
        taskId,
        authorId: membership.id,
        body: QUICK_STATUS_LABELS[targetStatus],
        progressAt: progress,
      },
    }),
  ]);

  if (task.parentTaskId) {
    await recomputeTaskProgress(task.parentTaskId);
    revalidatePath(`/dashboard/tasks/${task.parentTaskId}`);
  }
  if (task.projectId) {
    revalidatePath(`/dashboard/projects/${task.projectId}`);
  }

  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return {};
}

/** Correct a completed task's finish date/time without re-toggling its status. */
export async function setCompletedDateAction(
  taskId: string,
  completedAtInput: string
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assignedToId !== membership.id) {
    return { error: "You can only update your own tasks." };
  }
  if (task.status !== "COMPLETED") {
    return { error: "Only a completed task has a finish date to set." };
  }
  const parsed = new Date(completedAtInput);
  if (isNaN(parsed.getTime())) return { error: "Invalid date." };

  await prisma.task.update({ where: { id: taskId }, data: { completedAt: parsed } });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  if (task.parentTaskId) revalidatePath(`/dashboard/tasks/${task.parentTaskId}`);
  if (task.projectId) revalidatePath(`/dashboard/projects/${task.projectId}`);
  return {};
}

/**
 * A project's fixed pipeline stages each carry a percentage weight toward the
 * project's overall completion. Only the Projects Manager (Ram) sets these,
 * so the weights across a project stay a single person's call rather than
 * drifting as different stage owners each guess their own share.
 */
export async function setMilestoneWeightAction(
  taskId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };
  if (membership.user.email !== "ram@flaretechnical.com") {
    return { error: "Only the Projects Manager can set milestone weights." };
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.companyId !== membership.companyId) {
    return { error: "Task not found." };
  }

  const raw = String(formData.get("weight") || "").trim();
  const weight = raw === "" ? null : Number(raw);
  if (weight !== null && (!Number.isInteger(weight) || weight < 0 || weight > 100)) {
    return { error: "Weight must be a whole number between 0 and 100." };
  }

  await prisma.task.update({ where: { id: taskId }, data: { milestoneWeight: weight } });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  if (task.projectId) revalidatePath(`/dashboard/projects/${task.projectId}`);
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

async function canManageTask(
  membership: { id: string; isDirector: boolean },
  task: { assignedToId: string; assignedById: string }
) {
  if (membership.isDirector) return true;
  if (task.assignedById === membership.id) return true;
  return isManagerOf(membership.id, task.assignedToId);
}

/** Reassign/reallocate rights: management rights, or being the person the task was actually given to. */
async function canReassignTask(
  membership: { id: string; isDirector: boolean },
  task: { assignedToId: string; assignedById: string }
) {
  if (task.assignedToId === membership.id) return true;
  return canManageTask(membership, task);
}

export async function addDailyTaskAction(
  parentTaskId: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const parent = await prisma.task.findUnique({ where: { id: parentTaskId } });
  if (!parent || parent.companyId !== membership.companyId) {
    return { error: "Task not found." };
  }
  if (parent.parentTaskId) {
    return { error: "Daily tasks can't have their own daily tasks." };
  }
  if (!(await canManageTask(membership, parent))) {
    return { error: "You don't manage this task." };
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const deadlineRaw = String(formData.get("deadline") || "");
  if (!title) return { error: "Give the daily task a title." };

  await prisma.task.create({
    data: {
      companyId: parent.companyId,
      title,
      description: description || null,
      assignedToId: parent.assignedToId,
      assignedById: membership.id,
      parentTaskId: parent.id,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });
  await recomputeTaskProgress(parent.id);

  revalidatePath(`/dashboard/tasks/${parentTaskId}`);
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return {};
}

export async function updateTaskAction(
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
  if (!(await canManageTask(membership, task))) {
    return { error: "You don't manage this task." };
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const deadlineRaw = String(formData.get("deadline") || "");
  const projectId = String(formData.get("projectId") || "");
  if (!title) return { error: "Give the task a title." };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description: description || null,
      projectId: projectId || null,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/dashboard/tasks");
  if (task.parentTaskId) revalidatePath(`/dashboard/tasks/${task.parentTaskId}`);
  return {};
}

export async function reassignTaskAction(
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
  if (!(await canReassignTask(membership, task))) {
    return { error: "You don't have access to reassign this task." };
  }

  const newAssigneeId = String(formData.get("assigneeId") || "");
  const newAssignee = await prisma.membership.findUnique({ where: { id: newAssigneeId } });
  if (!newAssignee || newAssignee.companyId !== membership.companyId || newAssignee.isDirector) {
    return { error: "Choose a valid employee to reassign to." };
  }

  await prisma.task.update({ where: { id: taskId }, data: { assignedToId: newAssigneeId } });
  if (!task.parentTaskId) {
    // Keep daily subtasks with their weekly/monthly parent's new owner.
    await prisma.task.updateMany({
      where: { parentTaskId: taskId },
      data: { assignedToId: newAssigneeId },
    });
  }

  revalidatePath(`/dashboard/tasks/${taskId}`);
  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/team/${task.assignedToId}`);
  revalidatePath(`/dashboard/team/${newAssigneeId}`);
  if (task.parentTaskId) revalidatePath(`/dashboard/tasks/${task.parentTaskId}`);
  return {};
}

export async function deleteTaskAction(
  taskId: string,
  _prev: { error?: string } | undefined,
  _formData: FormData
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not signed in." };

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.companyId !== membership.companyId) {
    return { error: "Task not found." };
  }
  if (!(await canManageTask(membership, task))) {
    return { error: "You don't manage this task." };
  }

  await prisma.task.delete({ where: { id: taskId } });
  if (task.parentTaskId) {
    await recomputeTaskProgress(task.parentTaskId);
    revalidatePath(`/dashboard/tasks/${task.parentTaskId}`);
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/team/${task.assignedToId}`);
  redirect(task.parentTaskId ? `/dashboard/tasks/${task.parentTaskId}` : "/dashboard/tasks");
}
