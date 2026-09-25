import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type NodeSpec = {
  name: string;
  email: string;
  title: string;
  department?: string;
  isDirector?: boolean;
  children?: NodeSpec[];
};

type CompanySpec = {
  slug: string;
  name: string;
  root: NodeSpec;
};

const companies: CompanySpec[] = [
  {
    slug: "flaretechnical",
    name: "Flaretech",
    root: {
      name: "Abraham Mathew",
      email: "abraham@flaretechnical.com",
      title: "Managing Director",
      isDirector: true,
      children: [
        {
          name: "Shafeek",
          email: "finance@flaretechnical.com",
          title: "Accounts Manager",
          department: "Accounts",
          children: [
            {
              name: "Hashim",
              email: "accounts@flaretechnical.com",
              title: "Accounts Executive",
              department: "Accounts",
            },
          ],
        },
        {
          name: "Ram",
          email: "ram@flaretechnical.com",
          title: "Projects Manager",
          department: "Projects",
          children: [
            {
              name: "Jiyad",
              email: "jiyad.m@flaretechnical.com",
              title: "Site Engineer",
              department: "Projects",
              children: [
                {
                  name: "Santhosh",
                  email: "santhosh@flaretechnical.com",
                  title: "Site Supervisor",
                  department: "Projects",
                },
              ],
            },
            {
              name: "Simi",
              email: "simi@flaretechnical.com",
              title: "Project Coordinator",
              department: "Projects",
            },
            {
              name: "Mamidi",
              email: "design@flaretechnical.com",
              title: "Design Engineer",
              department: "Projects",
            },
            {
              name: "Saroj",
              email: "saroj@flaretechnical.com",
              title: "Estimation Engineer",
              department: "Projects",
            },
          ],
        },
        {
          name: "Jayaprakash",
          email: "service@flaretechnical.com",
          title: "Service Engineer",
          department: "Maintenance",
          children: [
            {
              name: "Flexie",
              email: "alerts@flaretechnical.com",
              title: "Gas Reading",
              department: "Maintenance",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "gasneeds",
    name: "Gas Needs",
    root: {
      // Same person as the Flaretech director — director of both companies.
      name: "Abraham Mathew",
      email: "abraham@flaretechnical.com",
      title: "Managing Director",
      isDirector: true,
      children: [
        {
          name: "Antony",
          email: "sales@gasneeds.com",
          title: "Operations Manager",
          department: "Operations",
          children: [
            {
              name: "Manu Johny",
              email: "business@gasneeds.com",
              title: "Purchase Engineer",
              department: "Purchase",
              children: [
                {
                  name: "Sumith",
                  email: "sumith@gasneeds.com",
                  title: "Store Incharge",
                  department: "Store",
                  children: [
                    {
                      name: "Vishal",
                      email: "vishal@gasneeds.com",
                      title: "Store Assistant",
                      department: "Store",
                      children: [
                        {
                          name: "Jibin",
                          email: "jibin@gasneeds.com",
                          title: "Store Assistant",
                          department: "Store",
                        },
                      ],
                    },
                    {
                      name: "Badarudheen",
                      email: "badarudheen@gasneeds.com",
                      title: "Driver",
                      department: "Store",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Jintu",
          email: "accounts@gasneeds.com",
          title: "Accounts Manager",
          department: "Accounts",
        },
        {
          name: "Jai Joseph Parakkal",
          // Placeholder official address — replace with the real one once shared.
          email: "jai@gasneeds.com",
          title: "Marketing & Content Manager",
          department: "Marketing",
        },
      ],
    },
  },
];

const SAMPLE_KPIS: Record<string, { name: string; target: number; current: number; unit?: string }> = {
  "Managing Director": { name: "Overall Company Performance", target: 100, current: 72, unit: "%" },
  "Accounts Manager": { name: "Invoice Accuracy", target: 98, current: 91, unit: "%" },
  "Accounts Executive": { name: "Invoices Processed On Time", target: 95, current: 80, unit: "%" },
  "Projects Manager": { name: "Projects Delivered On Schedule", target: 90, current: 65, unit: "%" },
  "Site Engineer": { name: "Site Milestones Hit", target: 90, current: 70, unit: "%" },
  "Site Supervisor": { name: "Safety Compliance Score", target: 100, current: 88, unit: "%" },
  "Project Coordinator": { name: "Client Response Time", target: 24, current: 30, unit: "hrs" },
  "Design Engineer": { name: "Designs Delivered On Time", target: 90, current: 75, unit: "%" },
  "Estimation Engineer": { name: "Estimation Accuracy", target: 95, current: 89, unit: "%" },
  "Service Engineer": { name: "Maintenance Response Time", target: 4, current: 6, unit: "hrs" },
  "Gas Reading": { name: "Readings Completed On Schedule", target: 100, current: 94, unit: "%" },
  "Operations Manager": { name: "Order Fulfilment Rate", target: 95, current: 82, unit: "%" },
  "Purchase Engineer": { name: "Purchase Order Turnaround", target: 48, current: 60, unit: "hrs" },
  "Store Incharge": { name: "Stock Accuracy", target: 98, current: 90, unit: "%" },
  "Store Assistant": { name: "Dispatch Accuracy", target: 98, current: 93, unit: "%" },
  Driver: { name: "On-Time Deliveries", target: 95, current: 85, unit: "%" },
  "Accounts Manager Gas": { name: "Collections Efficiency", target: 90, current: 77, unit: "%" },
  "Marketing & Content Manager": { name: "Campaigns Shipped This Quarter", target: 6, current: 3 },
};

async function createNode(
  companyId: string,
  node: NodeSpec,
  managerId: string | null
) {
  const user = await prisma.user.upsert({
    where: { email: node.email },
    update: {},
    create: { email: node.email, name: node.name },
  });

  const membership = await prisma.membership.upsert({
    where: { userId_companyId: { userId: user.id, companyId } },
    update: {},
    create: {
      userId: user.id,
      companyId,
      title: node.title,
      department: node.department,
      isDirector: !!node.isDirector,
      managerId,
    },
  });

  const kpi = SAMPLE_KPIS[node.title];
  if (kpi) {
    const existing = await prisma.kpi.findFirst({
      where: { membershipId: membership.id, name: kpi.name },
    });
    if (!existing) {
      await prisma.kpi.create({
        data: { membershipId: membership.id, ...kpi },
      });
    }
  }

  for (const child of node.children ?? []) {
    await createNode(companyId, child, membership.id);
  }

  return membership;
}

async function main() {
  for (const spec of companies) {
    const company = await prisma.company.upsert({
      where: { slug: spec.slug },
      update: { name: spec.name },
      create: { slug: spec.slug, name: spec.name },
    });

    const director = await createNode(company.id, spec.root, null);

    const existingMessage = await prisma.directorMessage.findFirst({
      where: { companyId: company.id },
    });
    if (!existingMessage) {
      await prisma.directorMessage.create({
        data: {
          companyId: company.id,
          authorId: director.id,
          body: `Welcome to the ${spec.name} team portal. Log your task progress here so I can track it in real time.`,
        },
      });
    }

    // Give each non-director employee one sample task so the UI has something to show.
    const employees = await prisma.membership.findMany({
      where: { companyId: company.id, isDirector: false },
    });
    for (const emp of employees) {
      const hasTask = await prisma.task.findFirst({ where: { assignedToId: emp.id } });
      if (hasTask) continue;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 14);
      const task = await prisma.task.create({
        data: {
          companyId: company.id,
          title: "Weekly status report",
          description: "Summarize progress, blockers and next steps for this week.",
          assignedToId: emp.id,
          assignedById: director.id,
          deadline,
          progress: 20,
          status: "IN_PROGRESS",
        },
      });
      await prisma.taskComment.create({
        data: {
          taskId: task.id,
          authorId: emp.id,
          body: "Got started — will update by end of week.",
          progressAt: 20,
        },
      });
    }

    console.log(`Seeded ${spec.name} (${employees.length + 1} people)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
