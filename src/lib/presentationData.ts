import { prisma } from "@/lib/db";
import { kpiScore } from "@/lib/queries";
import type { Deck } from "@/lib/deckPdf";

const DUBAI = 4 * 3600 * 1000;
const DAY = 86400000;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HIDDEN_CATEGORIES = ["confidential"];

export type PeriodRange = "cur" | "prev" | "month" | "prevmonth";
type Per = { y: number; m: number; d1: number; d2: number };

const dim = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const shiftMonth = (y: number, m: number, by: number) => {
  const t = new Date(Date.UTC(y, m - 1 + by, 1));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1 };
};
const halfBefore = (p: Per): Per => {
  if (p.d1 === 15) return { y: p.y, m: p.m, d1: 1, d2: 14 };
  const pm = shiftMonth(p.y, p.m, -1);
  return { y: pm.y, m: pm.m, d1: 15, d2: dim(pm.y, pm.m) };
};
const bounds = (p: Per) => ({ start: new Date(Date.UTC(p.y, p.m - 1, p.d1) - DUBAI), end: new Date(Date.UTC(p.y, p.m - 1, p.d2 + 1) - DUBAI) });
const label = (p: Per, whole: boolean) => (whole ? `${MON[p.m - 1]} ${p.y}` : `${p.d1}-${p.d2} ${MON[p.m - 1]} ${p.y}`);

function periods(range: PeriodRange) {
  const now = new Date(Date.now() + DUBAI);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  const curHalf: Per = d <= 14 ? { y, m, d1: 1, d2: 14 } : { y, m, d1: 15, d2: dim(y, m) };
  const whole = (yy: number, mm: number): Per => ({ y: yy, m: mm, d1: 1, d2: dim(yy, mm) });
  if (range === "month") return { kind: "month" as const, p: whole(y, m), q: whole(shiftMonth(y, m, -1).y, shiftMonth(y, m, -1).m) };
  if (range === "prevmonth") {
    const a = shiftMonth(y, m, -1);
    const b = shiftMonth(y, m, -2);
    return { kind: "month" as const, p: whole(a.y, a.m), q: whole(b.y, b.m) };
  }
  if (range === "prev") return { kind: "fortnight" as const, p: halfBefore(curHalf), q: halfBefore(halfBefore(curHalf)) };
  return { kind: "fortnight" as const, p: curHalf, q: halfBefore(curHalf) };
}

export function periodOptions() {
  return (["cur", "prev", "month", "prevmonth"] as PeriodRange[]).map((r) => {
    const x = periods(r);
    return { range: r, label: label(x.p, x.kind === "month"), name: r === "cur" ? "This two weeks" : r === "prev" ? "Last two weeks" : r === "month" ? "This month" : "Last month" };
  });
}

const dubaiDay = (d: Date) => Math.floor((d.getTime() + DUBAI) / DAY);
const hourOf = (d: Date) => {
  const t = new Date(d.getTime() + DUBAI);
  return t.getUTCHours() + t.getUTCMinutes() / 60;
};

export async function buildDeckData(userId: string, themeSlug: string, range: PeriodRange): Promise<{ deck: Deck; filename: string; photoPath: string | null; logoPath: string } | null> {
  const memberships = await prisma.membership.findMany({ where: { userId }, include: { user: true, company: true } });
  if (memberships.length === 0) return null;
  const home = memberships.find((m) => m.company.slug === themeSlug) ?? memberships[0];
  const ids = memberships.map((m) => m.id);
  const { kind, p, q } = periods(range);
  const P = bounds(p);
  const Q = bounds(q);
  const now = new Date();
  const lenP = Math.round((P.end.getTime() - P.start.getTime()) / DAY);
  const lenQ = Math.round((Q.end.getTime() - Q.start.getTime()) / DAY);

  const rows = await prisma.task.findMany({
    where: { assignedToId: { in: ids }, logKind: { not: null, notIn: ["HANDOVER", "CONTENT_REQUEST"] }, eventAt: { gte: Q.start, lt: P.end } },
    select: { id: true, title: true, category: true, eventAt: true, forPerson: true, project: { select: { name: true } } },
    orderBy: { eventAt: "asc" },
  });
  const inP = rows.filter((r) => r.eventAt! >= P.start);
  const inQ = rows.filter((r) => r.eventAt! < P.start);
  const idxP = (d: Date) => dubaiDay(d) - dubaiDay(P.start);
  const idxQ = (d: Date) => dubaiDay(d) - dubaiDay(Q.start);

  // Entries per week.
  const wk = (arr: typeof rows, idx: (d: Date) => number, n: number) => {
    const out = Array(n).fill(0);
    for (const r of arr) out[Math.min(n - 1, Math.floor(idx(r.eventAt!) / 7))]++;
    return out as number[];
  };
  const weekly: Deck["weekly"] =
    kind === "fortnight"
      ? [...wk(inQ, idxQ, 2).map((v, i) => ({ label: `Prev wk ${i + 1}`, value: v, current: false })), ...wk(inP, idxP, 2).map((v, i) => ({ label: `Wk ${i + 1}`, value: v, current: true }))]
      : wk(inP, idxP, Math.ceil(lenP / 7)).map((v, i) => ({ label: `Wk ${i + 1}`, value: v, current: true }));

  // Cumulative lines.
  const cumOf = (arr: typeof rows, idx: (d: Date) => number, len: number, upTo: number) => {
    const perDay = Array(len).fill(0);
    for (const r of arr) perDay[Math.min(len - 1, Math.max(0, idx(r.eventAt!)))]++;
    const out: number[] = [];
    let s = 0;
    for (let i = 0; i < Math.min(len, upTo); i++) out.push((s += perDay[i]));
    return out;
  };
  const todayIdx = Math.max(0, idxP(now));
  const cum = { cur: cumOf(inP, idxP, lenP, todayIdx + 1), prev: cumOf(inQ, idxQ, lenQ, lenQ) };

  // Work mix.
  const mixMap = new Map<string, number>();
  for (const r of inP) mixMap.set(r.category ?? "Other", (mixMap.get(r.category ?? "Other") ?? 0) + 1);
  const mixAll = [...mixMap.entries()].sort((a, b) => b[1] - a[1]);
  const mix = mixAll.slice(0, 5).map(([label, count]) => ({ label, count }));
  const rest = mixAll.slice(5).reduce((s, x) => s + x[1], 0);
  if (rest > 0) mix.push({ label: "Other", count: rest });

  // Daily rhythm from attendance and entry times.
  const att = await prisma.attendanceEntry.findMany({ where: { membershipId: { in: ids }, clockIn: { gte: P.start, lt: P.end } }, orderBy: { clockIn: "asc" } });
  const dayKey = (d: Date) => dubaiDay(d);
  const dayMap = new Map<number, { inH: number | null; outH: number | null; firstH: number | null; lastH: number | null; entries: number }>();
  const slot = (k: number) => {
    if (!dayMap.has(k)) dayMap.set(k, { inH: null, outH: null, firstH: null, lastH: null, entries: 0 });
    return dayMap.get(k)!;
  };
  for (const a of att) {
    const s = slot(dayKey(a.clockIn));
    const h = hourOf(a.clockIn);
    if (s.inH === null || h < s.inH) s.inH = h;
    if (a.clockOut) {
      const o = hourOf(a.clockOut);
      if (s.outH === null || o > s.outH) s.outH = o;
    }
  }
  for (const r of inP) {
    const s = slot(dayKey(r.eventAt!));
    const h = hourOf(r.eventAt!);
    s.entries++;
    if (s.firstH === null || h < s.firstH) s.firstH = h;
    if (s.lastH === null || h > s.lastH) s.lastH = h;
  }
  const days: Deck["days"] = [...dayMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, v]) => {
      const dt = new Date(k * DAY);
      const sat = dt.getUTCDay() === 6;
      return { label: `${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`, ...v, late: v.inH !== null && v.inH > (sat ? 9.25 : 8.25) };
    })
    .filter((d) => d.inH !== null || d.entries > 0);

  // Hand-overs and follow-ups.
  const hand = await prisma.task.findMany({
    where: { logKind: "HANDOVER", createdAt: { gte: P.start, lt: P.end }, OR: [{ assignedToId: { in: ids } }, { assignedById: { in: ids } }] },
    include: { assignedTo: { include: { user: true } }, assignedBy: { include: { user: true } } },
  });
  const mine = new Set(ids);
  const peopleMap = new Map<string, number>();
  let passedOn = 0;
  let received = 0;
  for (const t of hand) {
    const toMe = mine.has(t.assignedToId);
    const byMe = mine.has(t.assignedById);
    if (toMe && !byMe) {
      received++;
      peopleMap.set(t.assignedBy.user.name, (peopleMap.get(t.assignedBy.user.name) ?? 0) + 1);
    } else if (byMe && !toMe) {
      passedOn++;
      peopleMap.set(t.assignedTo.user.name, (peopleMap.get(t.assignedTo.user.name) ?? 0) + 1);
    }
  }
  const handedOpen = await prisma.task.count({ where: { assignedToId: { in: ids }, assignedById: { notIn: ids }, logKind: "HANDOVER", status: { not: "COMPLETED" } } });

  const onTime = async (a: Date, b: Date) => {
    const fu = await prisma.task.findMany({ where: { assignedToId: { in: ids }, followUpAt: { gte: a, lt: b } }, select: { status: true, completedAt: true, followUpAt: true } });
    let ok = 0;
    let late = 0;
    for (const t of fu) {
      const due = t.followUpAt!.getTime() + DAY;
      if (t.status === "COMPLETED" && t.completedAt && t.completedAt.getTime() <= due) ok++;
      else if (t.status === "COMPLETED" || due < Date.now()) late++;
    }
    return ok + late === 0 ? null : Math.round((ok / (ok + late)) * 100);
  };
  const onTimePct = await onTime(P.start, P.end);
  const prevOnTimePct = await onTime(Q.start, Q.end);

  // Who and what for.
  const partyMap = new Map<string, number>();
  for (const r of inP) {
    if (HIDDEN_CATEGORIES.includes((r.category ?? "").toLowerCase())) continue;
    const who = r.forPerson || r.project?.name;
    if (who) partyMap.set(who, (partyMap.get(who) ?? 0) + 1);
  }
  const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));
  const deliveries = inP
    .filter((r) => !HIDDEN_CATEGORIES.includes((r.category ?? "").toLowerCase()))
    .slice()
    .reverse()
    .slice(0, 9)
    .map((r) => {
      const dt = new Date(r.eventAt!.getTime() + DUBAI);
      return { date: `${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`, title: r.title, who: r.forPerson || r.project?.name || "" };
    });

  const kpis = (await prisma.kpi.findMany({ where: { membershipId: { in: ids } }, orderBy: { createdAt: "asc" } })).map((k) => ({
    name: k.name.includes(" — ") ? k.name.split(" — ")[1] : k.name,
    current: k.current,
    target: k.targetSet ? k.target : null,
    unit: k.unit,
    score: kpiScore(k),
  }));

  const openRows = await prisma.task.findMany({ where: { assignedToId: { in: ids }, followUpAt: { not: null }, status: { not: "COMPLETED" } }, orderBy: { followUpAt: "asc" }, take: 9 });
  const open = openRows.map((t) => {
    const dt = new Date(t.followUpAt!.getTime() + DUBAI);
    return { due: `${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`, title: t.title, overdue: t.followUpAt! < now };
  });

  // Month deck: the two halves side by side.
  let fortnights: Deck["fortnights"];
  if (kind === "month") {
    fortnights = [];
    for (const half of [{ y: p.y, m: p.m, d1: 1, d2: 14 }, { y: p.y, m: p.m, d1: 15, d2: p.d2 }]) {
      const b = bounds(half);
      const entries = inP.filter((r) => r.eventAt! >= b.start && r.eventAt! < b.end).length;
      const passed = hand.filter((t) => mine.has(t.assignedById) && !mine.has(t.assignedToId) && t.createdAt >= b.start && t.createdAt < b.end).length;
      fortnights.push({ label: label(half, false), entries, onTime: await onTime(b.start, b.end), passed });
    }
  }

  const person = home.user;
  const deck: Deck = {
    company: home.company.slug === "gasneeds" ? "gasneeds" : "flaretechnical",
    name: person.name,
    title: home.title,
    companyName: home.company.name,
    kind,
    periodLabel: label(p, kind === "month"),
    prevLabel: kind === "month" ? "last month" : "the previous two weeks",
    entries: inP.length,
    prevEntries: inQ.length,
    onTimePct,
    prevOnTimePct,
    passedOn,
    received,
    weekly,
    mix,
    days,
    cum,
    people: top(peopleMap, 7),
    parties: top(partyMap, 7),
    deliveries,
    kpis,
    open,
    handedOpen,
    fortnights,
  };
  const { staffPhoto } = await import("@/lib/staffPhotos");
  return {
    deck,
    filename: `OWN-IT-${person.name.replace(/[^A-Za-z0-9]+/g, "-")}-${kind === "month" ? `${MON[p.m - 1]}-${p.y}` : `${MON[p.m - 1]}-${p.d1}-${p.d2}`}.pdf`,
    photoPath: staffPhoto(person.email),
    logoPath: deck.company === "gasneeds" ? "/logos/gasneeds.png" : "/logos/flaretech.png",
  };
}
