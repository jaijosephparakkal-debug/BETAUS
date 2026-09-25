import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_DAILY_TASKS = [
  "Quotation Preparation",
  "Documentation",
  "Design",
  "Site Meetings / Client Meetings (if required)",
  "Reply to Project Queries",
];

async function main() {
  const saroj = await prisma.membership.findFirst({
    where: { user: { email: "saroj@flaretechnical.com" } },
  });
  if (!saroj) throw new Error("Saroj not found");

  const weeklyTask = await prisma.task.findFirst({
    where: {
      assignedToId: saroj.id,
      title: "Weekly estimation status update",
      parentTaskId: null,
    },
  });
  if (!weeklyTask) throw new Error("Saroj's weekly task not found");

  let created = 0;
  for (const title of NEW_DAILY_TASKS) {
    const existing = await prisma.task.findFirst({
      where: { parentTaskId: weeklyTask.id, title },
    });
    if (existing) continue;
    await prisma.task.create({
      data: {
        companyId: saroj.companyId,
        title,
        assignedToId: saroj.id,
        assignedById: weeklyTask.assignedById,
        parentTaskId: weeklyTask.id,
      },
    });
    created++;
  }

  const subtasks = await prisma.task.findMany({
    where: { parentTaskId: weeklyTask.id },
    select: { progress: true, status: true },
  });
  const progress = Math.round(
    subtasks.reduce((s, t) => s + t.progress, 0) / subtasks.length
  );
  const status = subtasks.every((t) => t.status === "COMPLETED")
    ? "COMPLETED"
    : subtasks.some((t) => t.status !== "NOT_STARTED")
      ? "IN_PROGRESS"
      : "NOT_STARTED";
  await prisma.task.update({ where: { id: weeklyTask.id }, data: { progress, status } });

  console.log(`Created ${created} new daily tasks for Saroj (${subtasks.length} total now).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
