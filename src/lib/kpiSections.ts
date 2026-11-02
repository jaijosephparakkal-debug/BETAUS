/** Groups KPIs into sections by the "Section — Name" naming convention; KPIs without one go under "General". */
export function groupKpis<T extends { name: string }>(kpis: T[]) {
  const groups = new Map<string, (T & { shortName: string })[]>();
  for (const k of kpis) {
    const [head, ...rest] = k.name.split(" — ");
    const label = rest.length ? head : "General";
    groups.set(label, [...(groups.get(label) ?? []), { ...k, shortName: rest.length ? rest.join(" — ") : k.name }]);
  }
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}
