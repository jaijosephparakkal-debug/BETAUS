import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership, canManageAllStaff } from "@/lib/auth";
import { dubaiDayRange } from "@/lib/attendance";
import { Card, CompanyTag } from "@/components/ui";

export default async function ManageStaffPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!canManageAllStaff(membership)) redirect("/director");

  // Every non-director person at both companies. A few people hold a
  // membership at each company — they're one row (one person), tagged with
  // both companies, and their profile merges both memberships.
  const memberships = await prisma.membership.findMany({
    where: { isDirector: false },
    include: { user: true, company: true },
    orderBy: { user: { name: "asc" } },
  });

  const today = dubaiDayRange();
  const now = new Date();
  // Sequential rather than Promise.all — see dashboard/layout.tsx for why.
  const taskCounts = await prisma.task.groupBy({
    by: ["assignedToId", "status"],
    where: { parentTaskId: null, assignedTo: { isDirector: false } },
    _count: { _all: true },
  });
  const overdueCounts = await prisma.task.groupBy({
    by: ["assignedToId"],
    where: {
      parentTaskId: null,
      assignedTo: { isDirector: false },
      status: { not: "COMPLETED" },
      deadline: { lt: now },
    },
    _count: { _all: true },
  });
  const todayEntries = await prisma.attendanceEntry.findMany({
    where: { clockIn: { gte: today.start, lt: today.end } },
    select: { membershipId: true, clockOut: true },
  });

  type Person = {
    userId: string;
    name: string;
    titles: string[];
    companySlugs: string[];
    total: number;
    completed: number;
    overdue: number;
    presentToday: boolean;
    clockedInNow: boolean;
  };
  const people = new Map<string, Person>();
  for (const m of memberships) {
    let p = people.get(m.userId);
    if (!p) {
      p = {
        userId: m.userId,
        name: m.user.name,
        titles: [],
        companySlugs: [],
        total: 0,
        completed: 0,
        overdue: 0,
        presentToday: false,
        clockedInNow: false,
      };
      people.set(m.userId, p);
    }
    if (!p.titles.includes(m.title)) p.titles.push(m.title);
    p.companySlugs.push(m.company.slug);
    for (const c of taskCounts) {
      if (c.assignedToId !== m.id) continue;
      p.total += c._count._all;
      if (c.status === "COMPLETED") p.completed += c._count._all;
    }
    p.overdue += overdueCounts.find((c) => c.assignedToId === m.id)?._count._all ?? 0;
    for (const e of todayEntries) {
      if (e.membershipId !== m.id) continue;
      p.presentToday = true;
      if (!e.clockOut) p.clockedInNow = true;
    }
  }

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const list = Array.from(people.values()).filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.titles.some((t) => t.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-semibold text-slate-900">Manage My Staff</h1>
          <p className="text-[17px] text-slate-500">
            {people.size} people across Flare Technical &amp; Gas Needs — tap anyone to see their KPIs,
            tasks, reports and attendance.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Search name or title"
            className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-[17px]"
          />
          <button className="rounded-md bg-brand-600 px-3 py-1.5 text-[17px] text-white hover:bg-brand-700">
            Search
          </button>
        </form>
      </div>

      <Card className="!p-0">
        <div className="divide-y divide-brand-100">
          {list.map((p) => (
            <Link
              key={p.userId}
              href={`/director/staff/${p.userId}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-brand-50/40"
            >
              <div className="flex min-w-0 items-center gap-2">
                {p.companySlugs.map((s) => (
                  <CompanyTag key={s} slug={s} />
                ))}
                <div className="min-w-0">
                  <div className="truncate text-[19px] font-medium text-slate-900">{p.name}</div>
                  <div className="truncate text-[15px] text-slate-500">{p.titles.join(" / ")}</div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-[15px]">
                <span className="text-slate-600">
                  {p.completed}/{p.total} tasks done
                </span>
                {p.overdue > 0 && <span className="font-medium text-red-600">{p.overdue} overdue</span>}
                {p.clockedInNow ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-600">In now</span>
                ) : p.presentToday ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Came in today</span>
                ) : (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-500">Not in today</span>
                )}
              </div>
            </Link>
          ))}
          {list.length === 0 && <p className="px-4 py-6 text-[17px] text-slate-500">No one matches that search.</p>}
        </div>
      </Card>
    </div>
  );
}
