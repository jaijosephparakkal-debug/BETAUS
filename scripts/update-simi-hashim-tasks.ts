import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SIMI_TASKS = [
  "Invoicing (Proforma & Tax)",
  "Attendance Updates",
  "Local Purchases for Projects",
  "Recording Received Payments and Purchase Payments",
  "Updating Material and Manpower Supply to Project Sites",
  "Payment Follow-up",
  "Updating Project Invoices and Outstanding Amounts (MIS)",
];

const HASHIM_TASKS = [
  "Weekly Invoice Processing",
  "Accounts Receivable Follow-up",
  "AMC Contract Creation",
  "Month-End Outstanding Report",
  "Rebate Calculation",
  "Gas Reading Notice Creation",
  "DEWA and Etisalat Payment Processing",
  "Portal Invoice Upload",
  "Payment and Receipt Entries",
  "PPM Report Submission",
  "Full AMC Preparation",
];

async function replaceDailyTasks(email: string, weeklyTaskTitle: string, newTasks: string[]) {
  const person = await prisma.membership.findFirst({ where: { user: { email } } });
  if (!person) throw new Error(`${email} not found`);

  const weeklyTask = await prisma.task.findFirst({
    where: { assignedToId: person.id, title: weeklyTaskTitle, parentTaskId: null },
  });
  if (!weeklyTask) throw new Error(`Weekly task "${weeklyTaskTitle}" not found for ${email}`);

  await prisma.task.deleteMany({ where: { parentTaskId: weeklyTask.id } });

  for (const title of newTasks) {
    await prisma.task.create({
      data: {
        companyId: person.companyId,
        title,
        assignedToId: person.id,
        assignedById: weeklyTask.assignedById,
        parentTaskId: weeklyTask.id,
      },
    });
  }

  await prisma.task.update({
    where: { id: weeklyTask.id },
    data: { progress: 0, status: "NOT_STARTED" },
  });

  console.log(`${email}: replaced with ${newTasks.length} tasks under "${weeklyTaskTitle}"`);
}

async function main() {
  await replaceDailyTasks(
    "simi@flaretechnical.com",
    "Weekly client response tracker",
    SIMI_TASKS
  );
  await replaceDailyTasks(
    "accounts@flaretechnical.com",
    "Process weekly invoices",
    HASHIM_TASKS
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
