export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type AttachmentItem = {
  id: string;
  filename: string;
  size: number;
  uploadedBy: { user: { name: string } };
  createdAt: Date | string;
};

export function AttachmentList({ attachments }: { attachments: AttachmentItem[] }) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-500">No files attached yet.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
          <a
            href={`/api/files/${a.id}`}
            className="truncate font-medium text-brand-600 hover:underline"
          >
            {a.filename}
          </a>
          <span className="shrink-0 text-xs text-slate-500">
            {formatFileSize(a.size)} · {a.uploadedBy.user.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-surface p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Ring/wheel chart for a single 0-100 metric — used for the aggregate KPI and task-progress numbers. */
export function DonutChart({
  value,
  size = 96,
  strokeWidth = 10,
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const color =
    pct >= 100 ? "#10b981" : pct >= 50 ? "rgb(var(--brand-600))" : "#f59e0b";

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2a3444"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ stroke: color }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-slate-900 text-sm font-semibold"
        >
          {pct}%
        </text>
      </svg>
      {label && <div className="mt-1 text-xs text-slate-500">{label}</div>}
    </div>
  );
}

/** Horizontal bar chart for comparing a handful of counts, e.g. task status breakdown. */
export function BarChart({
  data,
}: {
  data: { label: string; value: number; colorClass?: string }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-28 shrink-0 text-xs text-slate-600">{d.label}</div>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${d.colorClass ?? "bg-brand-600"}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <div className="w-6 shrink-0 text-right text-xs font-medium text-slate-700">
            {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-brand-500" : "bg-amber-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-brand-50 text-brand-700",
  COMPLETED: "bg-emerald-500/15 text-emerald-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  APPROVED: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "No deadline";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(deadline: Date | string | null | undefined, status: string) {
  if (!deadline || status === "COMPLETED") return false;
  return new Date(deadline).getTime() < Date.now();
}
