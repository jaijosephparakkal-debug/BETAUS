import { Card } from "@/components/ui";
import { canSeePrivateKpis, type getLiveKpis } from "@/lib/liveKpis";

type Data = NonNullable<Awaited<ReturnType<typeof getLiveKpis>>>;

const fmt = (v: number | null, unit?: string) => {
  if (v === null) return "—";
  if (unit === "AED") return `AED ${v.toLocaleString("en-US")}`;
  if (unit === "%") return `${v}%`;
  if (unit === "days") return `${v} day${v === 1 ? "" : "s"}`;
  return String(v);
};

/** Live monthly KPIs: counted from the work-log entries, with last month alongside. */
export function LiveKpis({ data, viewerEmail, name }: { data: Data; viewerEmail: string; name: string }) {
  const showPrivate = canSeePrivateKpis(viewerEmail, data.email);
  const items = data.items.filter((k) => !k.private || showPrivate);
  return (
    <Card>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[21px] font-semibold text-slate-900">Live KPIs — {data.month.label}</h2>
        <span className="text-[14px] text-slate-400">vs {data.prevLabel}</span>
      </div>
      <p className="mb-3 text-[15px] text-slate-500">
        Counted automatically from {name === "you" ? "what you log" : `what ${name} logs`} in the work-log form. No targets yet: this month is the baseline.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((k) => {
          const better =
            k.value === null || k.last === null || k.value === k.last ? null : k.lowerIsBetter ? k.value < k.last : k.value > k.last;
          return (
            <div key={k.label} title={k.hint} className="rounded-lg bg-surface p-3 shadow-sm">
              <div className="text-[23px] font-semibold text-slate-900">{fmt(k.value, k.unit)}</div>
              <div className="text-[15px] leading-snug text-slate-600">{k.label}</div>
              <div className="mt-0.5 text-[13px] text-slate-400">
                {k.live ? (
                  "right now"
                ) : (
                  <>
                    last month {fmt(k.last, k.unit)}
                    {better !== null && <span className={better ? "ml-1 text-emerald-600" : "ml-1 text-red-600"}>{better ? "▲" : "▼"}</span>}
                  </>
                )}
                {k.private && <span className="ml-1">· private</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
