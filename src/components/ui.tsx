// Only ever two companies system-wide — used to tag rows/cards on the
// unified director pages that merge both companies into one list/table.
const COMPANY_TAGS: Record<string, { color: string; label: string }> = {
  flaretechnical: { color: "#007ec8", label: "FT" },
  gasneeds: { color: "#d30a0a", label: "GN" },
};

export function CompanyTag({ slug }: { slug: string }) {
  const info = COMPANY_TAGS[slug] ?? { color: "#64748b", label: slug.slice(0, 2).toUpperCase() };
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[13px] font-semibold"
      style={{ color: info.color, background: `${info.color}1a` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: info.color }} />
      {info.label}
    </span>
  );
}

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
    return <p className="text-[19px] text-slate-500">No files attached yet.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {attachments.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 text-[19px]">
          <a
            href={`/api/files/${a.id}`}
            className="truncate font-medium text-brand-600 hover:underline"
          >
            {a.filename}
          </a>
          <span className="shrink-0 text-[17px] text-slate-500">
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
      className={`card-themed rounded-xl border border-gray-200 p-5 shadow-sm ${className}`}
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
          className="fill-slate-900 text-[19px] font-semibold"
        >
          {pct}%
        </text>
      </svg>
      {label && <div className="mt-1 text-[17px] text-slate-500">{label}</div>}
    </div>
  );
}

/** Multi-segment ring chart — e.g. a status breakdown (completed/in progress/not started) as one ring. */
export function SegmentedDonut({
  segments,
  size = 120,
  strokeWidth = 14,
  centerLabel,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetAccum = 0;

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((seg, i) => {
              const dash = (seg.value / total) * circumference;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offsetAccum}
                  strokeLinecap={segments.filter((s) => s.value > 0).length === 1 ? "butt" : "round"}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  style={{ stroke: seg.color }}
                />
              );
              offsetAccum += dash;
              return el;
            })}
        {centerLabel && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-slate-900 text-[17px] font-semibold"
          >
            {centerLabel}
          </text>
        )}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-[13px] text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
            {seg.label} ({seg.value})
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simple trend line chart, e.g. tasks completed per day over the last couple of weeks. */
export function LineChart({
  points,
  height = 150,
  color = "#0ea5e9",
}: {
  points: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  if (points.length === 0) {
    return <p className="text-[17px] text-slate-500">No data yet.</p>;
  }
  const width = Math.max(320, points.length * 34);
  const max = Math.max(1, ...points.map((p) => p.value));
  const padTop = 16;
  const padBottom = 22;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  const toY = (v: number) => padTop + (1 - v / max) * (height - padTop - padBottom);
  const linePoints = points.map((p, i) => `${i * stepX},${toY(p.value)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        <line
          x1={0}
          y1={height - padBottom}
          x2={width}
          y2={height - padBottom}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
        <polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={i * stepX} cy={toY(p.value)} r={3.5} fill={color} />
            <text
              x={i * stepX}
              y={height - 6}
              textAnchor="middle"
              className="fill-slate-500 text-[11px]"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
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
          <div className="w-28 shrink-0 text-[17px] text-slate-600">{d.label}</div>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${d.colorClass ?? "bg-brand-600"}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <div className="w-6 shrink-0 text-right text-[17px] font-medium text-slate-700">
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
  REVIEWED: "bg-brand-50 text-brand-700",
  REVIEWED_AND_APPROVED: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
  ACTIVE: "bg-brand-50 text-brand-700",
  ON_HOLD: "bg-amber-500/15 text-amber-400",
};

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  PENDING: "Pending",
  APPROVED: "Approved",
  REVIEWED: "Reviewed",
  REVIEWED_AND_APPROVED: "Reviewed & approved",
  REJECTED: "Rejected",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[17px] font-medium ${
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
