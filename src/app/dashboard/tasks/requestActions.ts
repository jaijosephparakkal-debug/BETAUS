"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { cleanLink } from "@/lib/links";
import { notifyNewTask } from "@/lib/notifications";
import { REQUEST_TYPES, MKT_FOR } from "@/lib/logOptions";
import type { LogState } from "./logActions";

/** Anyone can ask Jai for a design or content: it becomes a task for him, with who asked, what, and by when. */
export async function requestContentAction(_prev: LogState | undefined, fd: FormData): Promise<LogState> {
  const m = await getCurrentMembership();
  if (!m) return { error: "Not signed in." };
  const s = (k: string) => String(fd.get(k) || "").trim();
  const type = s("type");
  if (!REQUEST_TYPES.includes(type)) return { error: "Choose what you need." };
  const forWhat = s("for");
  if (!MKT_FOR.includes(forWhat)) return { error: "Choose what it is for." };
  const needBy = s("needBy");
  const due = new Date(`${needBy}T17:00:00+04:00`);
  if (!needBy || isNaN(due.getTime())) return { error: "Choose when you need it." };
  let link = "";
  if (s("link")) {
    const l = cleanLink(s("link"));
    if (!l) return { error: "That link does not look right. Paste the full web address." };
    link = l;
  }
  let projectName = "";
  if (s("projectId")) {
    const p = await prisma.project.findUnique({ where: { id: s("projectId") }, select: { name: true, number: true } });
    if (!p) return { error: "Choose the project." };
    projectName = `${p.name}${p.number ? ` (${p.number})` : ""}`;
  }
  const jai = await prisma.membership.findFirst({ where: { user: { email: { equals: "jai@gasneeds.com", mode: "insensitive" } }, company: { slug: "gasneeds" } } });
  if (!jai) return { error: "The request could not be sent." };
  if (jai.id === m.id) return { error: "This is for other people to ask you." };

  const parentTitle = "Requests received";
  let parent = await prisma.task.findFirst({ where: { assignedToId: jai.id, parentTaskId: null, title: { equals: parentTitle, mode: "insensitive" } } });
  if (!parent) {
    parent = await prisma.task.create({ data: { companyId: jai.companyId, title: parentTitle, category: parentTitle, assignedToId: jai.id, assignedById: jai.managerId ?? jai.id, status: "IN_PROGRESS" } });
  }
  const title = `${type} — ${projectName || forWhat}`.slice(0, 160);
  const note = s("note").slice(0, 200);
  const description = [`Requested by ${m.user.name}`, `Needed by ${needBy}`, link && `Brief: ${link}`, note && `Note: ${note}`].filter(Boolean).join(" · ");
  const task = await prisma.task.create({
    data: {
      companyId: jai.companyId, title, description, assignedToId: jai.id, assignedById: m.id, parentTaskId: parent.id,
      category: parent.category ?? parent.title, status: "NOT_STARTED", deadline: due, followUpAt: due, logKind: "CONTENT_REQUEST", eventAt: new Date(),
    },
  });
  await notifyNewTask(jai.id, task.id, title);
  revalidatePath("/dashboard/tasks");
  return { ok: "Sent to Jai." };
}
