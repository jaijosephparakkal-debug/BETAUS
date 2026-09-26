import type { MonthBucket } from "@/lib/completions";

/** Renders a weekly-into-monthly rollup of completed tasks — used on both project and person pages. */
export function CompletionRollup({
  months,
  showAssignee = false,
}: {
  months: MonthBucket[];
  showAssignee?: boolean;
}) {
  if (months.length === 0) {
    return <p className="text-[19px] text-slate-500">Nothing completed yet.</p>;
  }

  return (
    <div className="space-y-5">
      {months.map((month) => (
        <div key={month.key}>
          <div className="flex items-center justify-between text-[19px] font-medium text-slate-900">
            <span>{month.label}</span>
            <span className="text-[17px] font-normal text-slate-500">
              {month.count} completed
            </span>
          </div>
          <div className="mt-2 space-y-3">
            {month.weeks.map((week) => (
              <div key={week.key} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between text-[17px]">
                  <span className="font-medium text-slate-700">Week of {week.label}</span>
                  <span className="text-slate-500">{week.count} completed</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {week.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-[17px] text-slate-600"
                    >
                      <span className="truncate">
                        {item.title}
                        {showAssignee && item.assigneeName ? ` — ${item.assigneeName}` : ""}
                      </span>
                      <span className="shrink-0 text-slate-400">
                        {item.completedAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {item.completedAt.toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
