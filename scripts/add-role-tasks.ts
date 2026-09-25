import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type RoleTasks = {
  weekly: { title: string; description: string };
  monthly: { title: string; description: string };
};

const TASKS_BY_TITLE: Record<string, RoleTasks> = {
  "Accounts Manager": {
    weekly: {
      title: "Review outstanding invoices",
      description: "Review outstanding invoices and follow up on overdue payments.",
    },
    monthly: {
      title: "Monthly accounts reconciliation",
      description: "Prepare and reconcile the monthly accounts statement.",
    },
  },
  "Accounts Executive": {
    weekly: {
      title: "Process weekly invoices",
      description: "Process and file this week's invoices.",
    },
    monthly: {
      title: "Monthly ledger reconciliation",
      description: "Reconcile monthly ledger entries.",
    },
  },
  "Projects Manager": {
    weekly: {
      title: "Weekly project status review",
      description: "Review site progress across active projects and update status.",
    },
    monthly: {
      title: "Monthly project delivery report",
      description: "Prepare the monthly project delivery report for management.",
    },
  },
  "Site Engineer": {
    weekly: {
      title: "Weekly site progress update",
      description: "Submit site progress update with photos and notes.",
    },
    monthly: {
      title: "Monthly site inspection checklist",
      description: "Complete the monthly site inspection checklist.",
    },
  },
  "Site Supervisor": {
    weekly: {
      title: "Weekly safety checklist",
      description: "Log the weekly safety compliance checklist.",
    },
    monthly: {
      title: "Monthly site safety audit",
      description: "Submit the monthly site safety audit report.",
    },
  },
  "Project Coordinator": {
    weekly: {
      title: "Weekly client response tracker",
      description: "Update client communication log and response tracker.",
    },
    monthly: {
      title: "Monthly coordination summary",
      description: "Compile the monthly project coordination summary.",
    },
  },
  "Design Engineer": {
    weekly: {
      title: "Weekly design tracker update",
      description: "Update design task tracker with drawing status.",
    },
    monthly: {
      title: "Monthly design deliverables summary",
      description: "Submit the monthly design deliverables summary.",
    },
  },
  "Estimation Engineer": {
    weekly: {
      title: "Weekly estimation status update",
      description: "Submit weekly estimation and quotation status update.",
    },
    monthly: {
      title: "Monthly estimation accuracy review",
      description: "Review monthly estimation accuracy against actuals.",
    },
  },
  "Service Engineer": {
    weekly: {
      title: "Weekly maintenance log",
      description: "Log completed maintenance visits and pending call-outs.",
    },
    monthly: {
      title: "Monthly response-time report",
      description: "Submit the monthly maintenance response-time report.",
    },
  },
  "Gas Reading": {
    weekly: {
      title: "Weekly gas reading log",
      description: "Submit the weekly gas reading log.",
    },
    monthly: {
      title: "Monthly readings report",
      description: "Submit the monthly consolidated readings report.",
    },
  },
  "Operations Manager": {
    weekly: {
      title: "Weekly fulfilment review",
      description: "Review order fulfilment status and flag delays.",
    },
    monthly: {
      title: "Monthly operations report",
      description: "Prepare the monthly operations performance report.",
    },
  },
  "Purchase Engineer": {
    weekly: {
      title: "Weekly purchase order tracker",
      description: "Update purchase order tracker and follow up with suppliers.",
    },
    monthly: {
      title: "Monthly purchase turnaround report",
      description: "Submit the monthly purchase turnaround report.",
    },
  },
  "Store Incharge": {
    weekly: {
      title: "Weekly stock count",
      description: "Conduct weekly stock count and update the stock sheet.",
    },
    monthly: {
      title: "Monthly stock reconciliation",
      description: "Submit the monthly stock reconciliation report.",
    },
  },
  "Store Assistant": {
    weekly: {
      title: "Weekly dispatch log",
      description: "Log weekly dispatch and receiving activity.",
    },
    monthly: {
      title: "Monthly stock take",
      description: "Assist in the monthly stock take.",
    },
  },
  Driver: {
    weekly: {
      title: "Weekly delivery log",
      description: "Submit weekly delivery log and vehicle check.",
    },
    monthly: {
      title: "Monthly vehicle report",
      description: "Submit monthly vehicle maintenance and mileage report.",
    },
  },
  "Marketing & Content Manager": {
    weekly: {
      title: "Weekly content calendar update",
      description: "Update content and campaign calendar with post status.",
    },
    monthly: {
      title: "Monthly marketing performance report",
      description: "Submit the monthly marketing performance report.",
    },
  },
};

function nextFriday(): Date {
  const d = new Date();
  const day = d.getDay();
  const daysUntilFriday = ((5 - day + 7) % 7) || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  d.setHours(17, 0, 0, 0);
  return d;
}

function endOfMonth(): Date {
  const d = new Date();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  end.setHours(17, 0, 0, 0);
  return end;
}

async function main() {
  const employees = await prisma.membership.findMany({
    where: { isDirector: false },
    include: { user: true },
  });

  let created = 0;
  for (const emp of employees) {
    const roleTasks = TASKS_BY_TITLE[emp.title];
    if (!roleTasks) {
      console.log(`No task template for title "${emp.title}" (${emp.user.name}) — skipping.`);
      continue;
    }

    const assignedById = emp.managerId ?? emp.id;

    for (const [cadence, spec] of [
      ["weekly", roleTasks.weekly],
      ["monthly", roleTasks.monthly],
    ] as const) {
      const existing = await prisma.task.findFirst({
        where: { assignedToId: emp.id, title: spec.title },
      });
      if (existing) continue;

      await prisma.task.create({
        data: {
          companyId: emp.companyId,
          title: spec.title,
          description: spec.description,
          assignedToId: emp.id,
          assignedById,
          deadline: cadence === "weekly" ? nextFriday() : endOfMonth(),
          progress: 0,
          status: "NOT_STARTED",
        },
      });
      created++;
    }
  }

  console.log(`Created ${created} new tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
