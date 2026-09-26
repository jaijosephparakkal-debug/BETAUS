import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MONTHLY_TASKS = [
  "Payroll",
  "Bank Reconciliation",
  "Utility Bill Payment",
  "POs and Strip Payout Reconciliation",
];

const DAILY_TASKS = [
  "Follow-up on Overdue Payments",
  "POs and Strip Payout Reconciliation",
  "Payment Entries on ZOHO",
  "Review Payments",
  "Purchase Orders",
  "Shipment Booking",
  "Cheque Deposits",
  "Sales Cash Check",
  "Sales Cash Bank Deposit Initiations",
  "Payments (Import Purchase / Local Transaction)",
  "Payroll",
];

async function replaceDailyTasks(email: string, parentTaskTitle: string, newTasks: string[]) {
  const person = await prisma.membership.findFirst({ where: { user: { email } } });
  if (!person) throw new Error(`${email} not found`);

  const parentTask = await prisma.task.findFirst({
    where: { assignedToId: person.id, title: parentTaskTitle, parentTaskId: null },
  });
  if (!parentTask) throw new Error(`Task "${parentTaskTitle}" not found for ${email}`);

  await prisma.task.deleteMany({ where: { parentTaskId: parentTask.id } });

  for (const title of newTasks) {
    await prisma.task.create({
      data: {
        companyId: person.companyId,
        title,
        assignedToId: person.id,
        assignedById: parentTask.assignedById,
        parentTaskId: parentTask.id,
      },
    });
  }

  await prisma.task.update({
    where: { id: parentTask.id },
    data: { progress: 0, status: "NOT_STARTED" },
  });

  console.log(`${email}: replaced with ${newTasks.length} tasks under "${parentTaskTitle}"`);
}

async function main() {
  await replaceDailyTasks("accounts@gasneeds.com", "Monthly accounts reconciliation", MONTHLY_TASKS);
  await replaceDailyTasks("accounts@gasneeds.com", "Review outstanding invoices", DAILY_TASKS);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
