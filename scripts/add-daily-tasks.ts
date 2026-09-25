import { PrismaClient } from "@prisma/client";
import { recomputeTaskProgress } from "../src/lib/tasks";

const prisma = new PrismaClient();

// Keyed by the employee's title. Each weekly task (see add-role-tasks.ts) gets
// five daily tasks, Monday-Friday, that its progress rolls up from.
const DAILY_TASKS_BY_TITLE: Record<string, string[]> = {
  "Accounts Manager": [
    "Review Monday's incoming invoices",
    "Follow up on overdue payments",
    "Reconcile bank statement entries",
    "Review vendor payment schedule",
    "Prepare weekly invoice summary",
  ],
  "Accounts Executive": [
    "Enter Monday's invoices into the system",
    "File and archive processed invoices",
    "Chase missing purchase orders",
    "Match invoices to delivery notes",
    "Close out the week's invoice batch",
  ],
  "Projects Manager": [
    "Check in with site engineers on active projects",
    "Review project timelines against schedule",
    "Follow up on pending client approvals",
    "Review estimation/design handoffs",
    "Compile weekly project status summary",
  ],
  "Site Engineer": [
    "Site walk-through and photo log",
    "Check material delivery status",
    "Coordinate with subcontractors on site",
    "Log any site issues or delays",
    "Submit weekly site progress notes",
  ],
  "Site Supervisor": [
    "Morning safety briefing and PPE check",
    "Inspect work areas for hazards",
    "Review incident/near-miss log",
    "Check safety equipment condition",
    "Submit weekly safety checklist",
  ],
  "Project Coordinator": [
    "Respond to client emails and queries",
    "Update project tracker with latest status",
    "Coordinate document approvals",
    "Chase outstanding client responses",
    "Compile weekly client response summary",
  ],
  "Design Engineer": [
    "Review pending drawing requests",
    "Update design revisions",
    "Coordinate with projects team on design changes",
    "QA check on completed drawings",
    "Submit weekly design tracker update",
  ],
  "Estimation Engineer": [
    "Review new tender/quotation requests",
    "Prepare cost estimates for active bids",
    "Cross-check supplier pricing",
    "Review estimation accuracy against past bids",
    "Submit weekly estimation status update",
  ],
  "Service Engineer": [
    "Review scheduled maintenance calls",
    "Complete assigned service visits",
    "Log parts/materials used",
    "Follow up on pending service requests",
    "Submit weekly maintenance log",
  ],
  "Gas Reading": [
    "Complete scheduled gas readings — Zone A",
    "Complete scheduled gas readings — Zone B",
    "Complete scheduled gas readings — Zone C",
    "Re-check any flagged readings",
    "Submit weekly gas reading log",
  ],
  "Operations Manager": [
    "Review pending orders",
    "Check fulfilment status against targets",
    "Follow up on delayed orders",
    "Review team workload distribution",
    "Submit weekly fulfilment review",
  ],
  "Purchase Engineer": [
    "Review new purchase requests",
    "Follow up with suppliers on open POs",
    "Check delivery timelines",
    "Reconcile received goods against POs",
    "Submit weekly purchase order tracker update",
  ],
  "Store Incharge": [
    "Morning stock check",
    "Log incoming deliveries",
    "Log outgoing dispatches",
    "Spot-check high-value stock items",
    "Submit weekly stock count",
  ],
  "Store Assistant": [
    "Receive and log incoming goods",
    "Prepare outgoing dispatch orders",
    "Organize warehouse shelving",
    "Assist with stock verification",
    "Submit weekly dispatch log",
  ],
  Driver: [
    "Vehicle pre-trip check",
    "Complete scheduled deliveries",
    "Complete scheduled deliveries",
    "Log mileage and fuel",
    "Submit weekly delivery log",
  ],
  "Marketing & Content Manager": [
    "Plan content for the week",
    "Draft/schedule social posts",
    "Coordinate with team on campaign assets",
    "Track campaign engagement",
    "Submit weekly content calendar update",
  ],
};

// The weekly task title each role got from add-role-tasks.ts.
const WEEKLY_TASK_TITLE_BY_ROLE_TITLE: Record<string, string> = {
  "Accounts Manager": "Review outstanding invoices",
  "Accounts Executive": "Process weekly invoices",
  "Projects Manager": "Weekly project status review",
  "Site Engineer": "Weekly site progress update",
  "Site Supervisor": "Weekly safety checklist",
  "Project Coordinator": "Weekly client response tracker",
  "Design Engineer": "Weekly design tracker update",
  "Estimation Engineer": "Weekly estimation status update",
  "Service Engineer": "Weekly maintenance log",
  "Gas Reading": "Weekly gas reading log",
  "Operations Manager": "Weekly fulfilment review",
  "Purchase Engineer": "Weekly purchase order tracker",
  "Store Incharge": "Weekly stock count",
  "Store Assistant": "Weekly dispatch log",
  Driver: "Weekly delivery log",
  "Marketing & Content Manager": "Weekly content calendar update",
};

function nextWeekdays(): Date[] {
  const monday = new Date();
  const day = monday.getDay();
  const daysUntilMonday = ((1 - day + 7) % 7) || 7;
  monday.setDate(monday.getDate() + daysUntilMonday);
  monday.setHours(17, 0, 0, 0);
  return [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + offset);
    return d;
  });
}

async function main() {
  const employees = await prisma.membership.findMany({
    where: { isDirector: false },
    include: { user: true },
  });

  const weekdays = nextWeekdays();
  let created = 0;

  for (const emp of employees) {
    const dailyTitles = DAILY_TASKS_BY_TITLE[emp.title];
    const weeklyTitle = WEEKLY_TASK_TITLE_BY_ROLE_TITLE[emp.title];
    if (!dailyTitles || !weeklyTitle) continue;

    const weeklyTask = await prisma.task.findFirst({
      where: { assignedToId: emp.id, title: weeklyTitle, parentTaskId: null },
    });
    if (!weeklyTask) continue;

    const existingCount = await prisma.task.count({
      where: { parentTaskId: weeklyTask.id },
    });
    if (existingCount > 0) continue; // already has daily tasks — don't duplicate

    for (let i = 0; i < dailyTitles.length; i++) {
      await prisma.task.create({
        data: {
          companyId: emp.companyId,
          title: dailyTitles[i],
          assignedToId: emp.id,
          assignedById: weeklyTask.assignedById,
          parentTaskId: weeklyTask.id,
          deadline: weekdays[i],
        },
      });
      created++;
    }
    await recomputeTaskProgress(weeklyTask.id);
  }

  console.log(`Created ${created} daily tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
