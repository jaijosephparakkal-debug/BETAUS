/** Groups completed-task entries into weeks, and weeks into months — most recent first. */

export type CompletionEntry = {
  id: string;
  title: string;
  completedAt: Date;
  assigneeName?: string;
};

export type WeekBucket = {
  key: string;
  label: string;
  count: number;
  items: CompletionEntry[];
};

export type MonthBucket = {
  key: string;
  label: string;
  count: number;
  weeks: WeekBucket[];
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function startOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  date.setDate(date.getDate() + diff);
  return date;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmt = (d: Date) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

export function buildCompletionRollup(entries: CompletionEntry[]): MonthBucket[] {
  const months = new Map<string, Map<string, WeekBucket>>();

  for (const entry of entries) {
    const monthKey = `${entry.completedAt.getFullYear()}-${entry.completedAt.getMonth()}`;
    const weekStart = startOfWeek(entry.completedAt);
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (!months.has(monthKey)) months.set(monthKey, new Map());
    const weeks = months.get(monthKey)!;
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, { key: weekKey, label: formatWeekLabel(weekStart), count: 0, items: [] });
    }
    const week = weeks.get(weekKey)!;
    week.items.push(entry);
    week.count++;
  }

  const monthBuckets: MonthBucket[] = [...months.entries()].map(([monthKey, weeks]) => {
    const [year, month] = monthKey.split("-").map(Number);
    const weekList = [...weeks.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
    for (const w of weekList) {
      w.items.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    }
    return {
      key: monthKey,
      label: `${MONTH_NAMES[month]} ${year}`,
      count: weekList.reduce((s, w) => s + w.count, 0),
      weeks: weekList,
    };
  });

  monthBuckets.sort((a, b) => (a.key < b.key ? 1 : -1));
  return monthBuckets;
}
