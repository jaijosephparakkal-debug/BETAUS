import { redirect } from "next/navigation";
import { quotationNumber } from "@/lib/quotations";
import { LogForm, type LogData } from "./LogForm";
import { LOG_FORM_EMAILS, PROFILES } from "@/lib/logOptions";
import { SUB_CATEGORIES, SUB_PREFIX, COMMON_TITLE, COMMON_ID, COMMON_ITEMS } from "@/lib/subCategories";
import { prisma } from "@/lib/db";
import { getCurrentMembership, isManagingDirector } from "@/lib/auth";
import { getTasksFor, getAssignedTasksFor, getTaskForChoices } from "@/lib/queries";
import { markTaskNotificationsRead } from "@/lib/notifications";
import { AssignToColleagueForm } from "./AssignToColleagueForm";
import { TaskList } from "./TaskList";

// A few people carry responsibilities at both companies (Shafeek —
// accounts, Antony — operations, Jai — marketing & content) without needing
// a separate login for each. For them the "add task" form offers a plain
// "worked for" company tag so their task list/report makes clear which
// company a given task was for.
const DUAL_COMPANY_EMAILS = ["finance@flaretechnical.com", "sales@gasneeds.com", "jai@gasneeds.com"];

// Jayaprakash (Service Engineer) and Saroj: "Who was it with?" also offers
// Accounts / HR / Sales / Purchase.
const DEPARTMENT_CONTACT_EMAILS = ["service@flaretechnical.com", "saroj@flaretechnical.com"];

export default async function MyTasksPage({ searchParams }: { searchParams: { quotation?: string } }) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (isManagingDirector(membership)) redirect("/director");

  const showCompanyField = DUAL_COMPANY_EMAILS.includes(membership.user.email);

  if (!membership.viewingAs) await markTaskNotificationsRead(membership.id);

  // Anyone holding more than one company membership (e.g. Abraham, Jai) sees
  // their tasks merged across every company they belong to, tagged by
  // company, instead of only whichever company happens to be active.
  const allMemberships = await prisma.membership.findMany({
    where: { userId: membership.userId },
    include: { company: true },
  });
  const showCompanyTag = allMemberships.length > 1;

  const tasks: (Awaited<ReturnType<typeof getTasksFor>>[number] & { companySlug: string })[] = [];
  const assignedTasks: (Awaited<ReturnType<typeof getAssignedTasksFor>>[number] & { companySlug: string })[] = [];
  for (const m of allMemberships) {
    const mTasks = await getTasksFor(m.id);
    tasks.push(...mTasks.map((t) => ({ ...t, companySlug: m.company.slug })));
    const mAssigned = await getAssignedTasksFor(m.id);
    assignedTasks.push(...mAssigned.map((t) => ({ ...t, companySlug: m.company.slug })));
  }
  tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  assignedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Directors (admins) can pick projects and sites from both companies.
  const taskForChoices = await getTaskForChoices(
    membership.isDirector ? allMemberships.map((m) => m.companyId) : membership.companyId
  );
  const titlePresets = await prisma.taskTitlePreset.findMany({
    where: { membershipId: membership.id },
    orderBy: { createdAt: "asc" },
    select: { title: true },
  });
  const subConfig = SUB_CATEGORIES[membership.user.email.toLowerCase()];
  const remembered = titlePresets.map((p) => p.title).filter((t) => t.startsWith(SUB_PREFIX));
  // Category tasks: the configured ones, plus any category this person added themselves.
  const categories = subConfig
    ? (
        await prisma.task.findMany({
          where: {
            assignedToId: membership.id,
            parentTaskId: null,
            OR: [{ title: { in: Object.keys(subConfig) } }, { subtasks: { some: {} }, category: { not: null } }],
          },
          select: { id: true, title: true },
          orderBy: { title: "asc" },
        })
      ).map((c) => ({
        id: c.id,
        title: c.title,
        subs: [
          ...(c.title === COMMON_TITLE ? COMMON_ITEMS : subConfig[c.title] ?? []),
          ...remembered.filter((r) => r.startsWith(`${SUB_PREFIX}${c.title}|`)).map((r) => r.slice(SUB_PREFIX.length + c.title.length + 1)),
        ],
      }))
    : [];
  // Everyone also gets the common Calls & Emails category, created for them the first time they use it.
  if (subConfig && !categories.some((c) => c.title === COMMON_TITLE)) {
    categories.push({
      id: COMMON_ID,
      title: COMMON_TITLE,
      subs: [...COMMON_ITEMS, ...remembered.filter((r) => r.startsWith(`${SUB_PREFIX}${COMMON_TITLE}|`)).map((r) => r.slice(SUB_PREFIX.length + COMMON_TITLE.length + 1))],
    });
  }
  const companies = showCompanyField
    ? await prisma.company.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } })
    : [];

  // Antony logs work with the structured form (who, when, what was discussed, outcome, next step).
  const useLogForm = LOG_FORM_EMAILS.includes(membership.user.email.toLowerCase());
  let logData: LogData | null = null;
  if (useLogForm) {
    const allCompanies = await prisma.company.findMany({ select: { id: true, slug: true, name: true }, orderBy: { name: "asc" } });
    const customers = await prisma.customer.findMany({ orderBy: { name: "asc" }, include: { contacts: true } });
    const quotations = await prisma.quotation.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { customer: true } });
    const nowDubai = new Date(Date.now() + 4 * 3600 * 1000);
    const year = nowDubai.getUTCFullYear();
    const month = nowDubai.getUTCMonth() + 1;
    const nextNumbers: Record<string, string> = {};
    for (const c of allCompanies) {
      const last = await prisma.quotation.findFirst({ where: { companyId: c.id, year, month, seq: { not: null } }, orderBy: { seq: "desc" }, select: { seq: true } });
      nextNumbers[c.slug] = quotationNumber(c.slug === "gasneeds" ? "GN" : "FT", year, month, (last?.seq ?? 0) + 1);
    }
    logData = {
      companies: allCompanies,
      customers: customers.map((c) => ({ id: c.id, companyId: c.companyId, name: c.name })),
      contacts: customers.flatMap((c) => c.contacts.map((k) => ({ customerId: c.id, name: k.name }))),
      employees: (await prisma.employee.findMany({ orderBy: { name: "asc" } })).map((e) => ({ id: e.id, companyId: e.companyId, name: e.name })),
      agencies: (await prisma.proAgency.findMany({ orderBy: { name: "asc" } })).map((a) => ({ id: a.id, name: a.name })),
      quotations: quotations.map((q) => ({ id: q.id, number: q.number, companyId: q.companyId, customerId: q.customerId, customerName: q.customer.name, value: q.value, createdAt: q.createdAt.toISOString() })),
      suppliers: (await prisma.supplier.findMany({ orderBy: { name: "asc" } })).map((x) => ({ id: x.id, companyId: x.companyId, name: x.name })),
      profile: { kinds: PROFILES[membership.user.email.toLowerCase()].kinds, companies: PROFILES[membership.user.email.toLowerCase()].companies, next: PROFILES[membership.user.email.toLowerCase()].next },
      nextNumbers,
      prefill: searchParams.quotation ? { kind: PROFILES[membership.user.email.toLowerCase()].kinds.some((k) => k.v === "pf") ? "pf" : "f", quotationId: searchParams.quotation } : undefined,
    };
  }

  // Follow-ups that are due today or overdue (Dubai day), for the person's own list.
  const endOfToday = new Date(Math.floor((Date.now() + 4 * 3600 * 1000) / 86400000) * 86400000 + 86400000 - 4 * 3600 * 1000);
  const startOfToday = new Date(endOfToday.getTime() - 86400000);
  const due = await prisma.task.findMany({
    where: { assignedToId: membership.id, followUpAt: { not: null, lt: endOfToday }, status: { not: "COMPLETED" } },
    include: { quotation: { select: { number: true } } },
    orderBy: { followUpAt: "asc" },
    take: 20,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">My Tasks</h1>
      {due.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <div className="mb-1 text-[19px] font-semibold text-amber-900">Follow-ups due — {due.length}</div>
          {due.map((t) => {
            const overdue = t.followUpAt! < startOfToday;
            return (
              <a key={t.id} href={`/dashboard/tasks/${t.id}`} className="block py-1 text-[17px] hover:underline">
                <span className={overdue ? "font-medium text-red-600" : "text-slate-800"}>{overdue ? "Overdue" : "Today"}</span>
                {" · "}
                {t.quotation?.number ? `${t.quotation.number} · ` : ""}
                {t.title}
                {" · "}
                {t.followUpAt!.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })}
              </a>
            );
          })}
        </div>
      )}
      {useLogForm && logData ? (
        <LogForm data={logData} />
      ) : (
      <AssignToColleagueForm
        selfId={membership.id}
        titleOptions={titlePresets.map((p) => p.title).filter((t) => !t.startsWith(SUB_PREFIX))}
        categories={categories}
        taskForChoices={taskForChoices}
        companyOptions={companies}
        departmentContacts={DEPARTMENT_CONTACT_EMAILS.includes(membership.user.email.toLowerCase())}
      />
      )}
      <TaskList
        tasks={tasks}
        assignedTasks={assignedTasks}
        showCompanyTag={showCompanyTag}
        companies={companies}
      />
    </div>
  );
}
