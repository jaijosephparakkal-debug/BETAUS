"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, ProgressBar, StatusBadge, CompanyTag, formatDate, isOverdue } from "@/components/ui";

type BaseTask = {
  id: string;
  title: string;
  status: string;
  progress: number;
  description: string | null;
  deadline: Date | string | null;
  workedForCompany: string | null;
  category: string | null;
  phase: string | null;
  contactType: string | null;
  contactName: string | null;
  followUpTopic: string | null;
  forDepartment?: string | null;
  forPerson?: string | null;
  companySlug: string;
  project: { id: string; name: string; number: string | null; type?: string } | null;
  subtasks: { id: string; title: string; status: string }[];
};

type Task = BaseTask & { assignedBy: { user: { name: string } } };
type AssignedTask = BaseTask & { assignedTo: { user: { name: string } } };

type FilterKey = "all" | "completed" | "pending" | "not_completed" | "assigned";

const MY_FILTERS: { key: FilterKey; label: string; test: (t: Task) => boolean }[] = [
  { key: "all", label: "All tasks", test: () => true },
  { key: "completed", label: "Completed", test: (t) => t.status === "COMPLETED" },
  { key: "pending", label: "Pending", test: (t) => t.status === "NOT_STARTED" },
  { key: "not_completed", label: "Not completed", test: (t) => t.status !== "COMPLETED" },
];

function TaskCard({
  task,
  showCompanyTag,
  companies,
  counterpartLabel,
  counterpartName,
}: {
  task: BaseTask;
  showCompanyTag: boolean;
  companies: { slug: string; name: string }[];
  counterpartLabel: string;
  counterpartName: string;
}) {
  return (
    <Card>
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
              {task.project.type && task.project.type !== "PROJECT" && `${task.project.type} — `}
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
          {task.contactType && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[15px] text-slate-600">
              With: {task.contactType === "Others" ? task.contactName || "Others" : task.contactType}
            </span>
          )}
          {task.followUpTopic && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[15px] text-slate-600">
              Following up on: {task.followUpTopic}
            </span>
          )}
          {task.forDepartment && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[15px] text-slate-600">
              For: {task.forDepartment}
              {task.forPerson ? ` — ${task.forPerson}` : ""}
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
          <span>
            {counterpartLabel} {counterpartName}
          </span>
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
  );
}

export function TaskList({
  tasks,
  assignedTasks,
  showCompanyTag,
  companies,
}: {
  tasks: Task[];
  assignedTasks: AssignedTask[];
  showCompanyTag: boolean;
  companies: { slug: string; name: string }[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const isAssignedTab = filter === "assigned";
  const activeMyFilter = MY_FILTERS.find((f) => f.key === filter);
  const visibleMy = activeMyFilter ? tasks.filter(activeMyFilter.test) : [];
  const activeLabel = isAssignedTab ? "Assigned" : activeMyFilter?.label ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {MY_FILTERS.map((f) => {
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
        <button
          type="button"
          onClick={() => setFilter("assigned")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[17px] font-medium transition-colors ${
            isAssignedTab
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Assigned task
          <span
            className={`rounded-full px-1.5 text-[15px] font-semibold ${
              isAssignedTab ? "bg-white/20" : "bg-white text-slate-500"
            }`}
          >
            {assignedTasks.length}
          </span>
        </button>
      </div>

      <div className="space-y-3">
        {isAssignedTab
          ? assignedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showCompanyTag={showCompanyTag}
                companies={companies}
                counterpartLabel="Assigned to"
                counterpartName={task.assignedTo.user.name}
              />
            ))
          : visibleMy.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showCompanyTag={showCompanyTag}
                companies={companies}
                counterpartLabel="Assigned by"
                counterpartName={task.assignedBy.user.name}
              />
            ))}
        {isAssignedTab && assignedTasks.length === 0 && (
          <p className="text-[19px] text-slate-500">
            You haven&apos;t assigned any tasks to someone else yet.
          </p>
        )}
        {!isAssignedTab && visibleMy.length === 0 && (
          <p className="text-[19px] text-slate-500">
            {tasks.length === 0 ? "No tasks assigned yet." : `No ${activeLabel.toLowerCase()} tasks.`}
          </p>
        )}
      </div>
    </div>
  );
}
