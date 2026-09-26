import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const jintu = await prisma.membership.findFirst({
    where: { user: { email: "accounts@gasneeds.com" } },
  });
  if (!jintu) throw new Error("Jintu not found");

  // New top-level cadence tasks: quarterly and yearly.
  const quarterly = await prisma.task.findFirst({
    where: { assignedToId: jintu.id, title: "VAT Filing (Quarterly — Sep/Dec/Mar/Jun)" },
  });
  if (!quarterly) {
    await prisma.task.create({
      data: {
        companyId: jintu.companyId,
        title: "VAT Filing (Quarterly — Sep/Dec/Mar/Jun)",
        description: "Due every quarter: September, December, March, June.",
        assignedToId: jintu.id,
        assignedById: jintu.managerId ?? jintu.id,
        deadline: new Date("2026-09-30"),
      },
    });
    console.log("Created quarterly VAT filing task");
  }

  const yearly = await prisma.task.findFirst({
    where: { assignedToId: jintu.id, title: "Corporate Task (Annual — September)" },
  });
  if (!yearly) {
    await prisma.task.create({
      data: {
        companyId: jintu.companyId,
        title: "Corporate Task (Annual — September)",
        description: "Due once a year, every September.",
        assignedToId: jintu.id,
        assignedById: jintu.managerId ?? jintu.id,
        deadline: new Date("2026-09-30"),
      },
    });
    console.log("Created yearly corporate task");
  }

  // New daily task under her weekly task.
  const weeklyTask = await prisma.task.findFirst({
    where: { assignedToId: jintu.id, title: "Review outstanding invoices", parentTaskId: null },
  });
  if (!weeklyTask) throw new Error("Weekly task not found");

  const existing = await prisma.task.findFirst({
    where: { parentTaskId: weeklyTask.id, title: "Shipment Tracking" },
  });
  if (!existing) {
    await prisma.task.create({
      data: {
        companyId: jintu.companyId,
        title: "Shipment Tracking",
        description:
          "Log each shipment as a comment on this task: the product and stock quantity, and whether it's for warehouse stocking or a specific client (include client details if so).",
        assignedToId: jintu.id,
        assignedById: weeklyTask.assignedById,
        parentTaskId: weeklyTask.id,
      },
    });
    console.log("Added Shipment Tracking daily task");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
