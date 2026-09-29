"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, ProgressBar, StatusBadge, CompanyTag, formatDate, isOverdue } from "@/components/ui";

type Task = {
  id: string;
  title: string;
  status: string;
  progress: number;
  description: string | null;
  deadline: Date | string | null;
  workedForCompany: string | null;
  category: string | null;
  phase: string | null;
  companySlug: string;
  project: { id: string; name: string; number: string | null } | null;
  assignedBy: { user: { name: string } };
  subtasks: { id: string; title: string; status: string }[];
};

type FilterKey = "all" | "completed" | "pending" | "not_completed";

const FILTERS: { key: FilterKey; label: string; test: (t: Task) => boolean }[] = [
  { key: "all", label: "All tasks", test: () => true },
  { key: "completed", label: "Completed", test: (t) => t.status === "COMPLETED" },
  { key: "pending", label: "Pending", test: (t) => t.status === "NOT_STARTED" },
  { key: "not_completed", label: "Not completed", test: (t) => t.status !== "COMPLETED" },
];

export function TaskList({
  tasks,
  showCompanyTag,
  companies,
}: {
  tasks: Task[];
  showCompanyTag: boolean;
  companies: { slug: string; name: string }[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const active = FILTERS.find((f) => f.key === filter)!;
  const visible = tasks.filter(active.test);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = tasks.filter(f.test).length;
          const isActive = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[17px] font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 text-[15px] font-semibold ${
                  isActive ? "bg-white/20" : "bg-white text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {visible.map((task) => (
          <Card key={task.id}>
            <Link href={`/dashboard/tasks/${task.id}`} className="block hover:opacity-90">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  {showCompanyTag && <CompanyTag slug={task.companySlug} />}
                  <span className="truncate text-[21px] font-medium text-slate-900">{task.title}</span>
                </span>
                <StatusBadge status={task.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {task.project && (
                  <span className="text-[17px] text-brand-600">
                    {task.project.number
                      ? `${task.project.number} — ${task.project.name}`
                      : task.project.name}
                  </span>
                )}
                {task.workedForCompany && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[15px] text-slate-600">
                    For:{" "}
                    {companies.find((c) => c.slug === task.workedForCompany)?.name ??
                      task.workedForCompany}
                  </span>
                )}
                {task.category && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[15px] text-brand-700">
                    {task.category}
                    {task.phase ? ` · ${task.phase}` : ""}
                  </span>
                )}
              </div>
              {task.description && (
                <p className="mt-1 text-[19px] text-slate-600">{task.description}</p>
              )}
              <div className="mt-3">
                <ProgressBar value={task.progress} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[17px] text-slate-500">
                <span>Assigned by {task.assignedBy.user.name}</span>
                <span className={isOverdue(task.deadline, task.status) ? "font-medium text-red-600" : ""}>
                  Due {formatDate(task.deadline)}
                </span>
              </div>
            </Link>
            {task.subtasks.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-brand-100 pt-3">
                <div className="text-[17px] font-medium text-slate-500">
                  Daily tasks —{" "}
                  {task.subtasks.filter((s) => s.status === "COMPLETED").length}/
                  {task.subtasks.length} done
                </div>
                {task.subtasks.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/dashboard/tasks/${sub.id}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[19px] hover:bg-brand-50/40"
                  >
                    <span className="text-slate-800">{sub.title}</span>
                    <StatusBadge status={sub.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        ))}
        {visible.length === 0 && (
          <p className="text-[19px] text-slate-500">
            {tasks.length === 0 ? "No tasks assigned yet." : `No ${active.label.toLowerCase()} tasks.`}
          </p>
        )}
      </div>
    </div>
  );
}
