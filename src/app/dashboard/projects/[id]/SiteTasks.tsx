"use client";

import { useState, useTransition } from "react";
import {
  addSiteTaskAction,
  deleteSiteTaskAction,
  setSiteTaskProgressAction,
  setSiteTaskWeightAction,
} from "../actions";

type SiteTask = { id: string; title: string; weight: number | null; progress: number };

function progressColor(p: number) {
  if (p === 100) return "text-emerald-600";
  if (p > 0) return "text-amber-600";
  return "text-slate-500";
}

function SiteTaskRow({
  projectId,
  task,
  canEdit,
  canSetWeights,
  canUpdateProgress,
  onError,
}: {
  projectId: string;
  task: SiteTask;
  canEdit: boolean;
  canSetWeights: boolean;
  canUpdateProgress: boolean;
  onError: (msg: string | null) => void;
}) {
  const [weight, setWeight] = useState(task.weight == null ? "" : String(task.weight));
  const [progress, setProgress] = useState(String(task.progress));
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>) {
    onError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) onError(result.error);
    });
  }

  function saveWeight() {
    const current = task.weight == null ? "" : String(task.weight);
    if (weight.trim() === current) return;
    run(() => setSiteTaskWeightAction(projectId, task.id, weight));
  }

  function saveProgress() {
    const value = Number(progress.trim());
    if (progress.trim() === "" || !Number.isInteger(value) || value < 0 || value > 100) {
      onError("Progress must be a whole number from 0 to 100.");
      setProgress(String(task.progress));
      return;
    }
    if (value === task.progress) return;
    run(() => setSiteTaskProgressAction(projectId, task.id, value));
  }

  const fulfilled = ((task.weight ?? 0) * task.progress) / 100;

  return (
    <tr className={`border-b border-slate-100 last:border-0 ${pending ? "opacity-60" : ""}`}>
      <td className="py-2 pr-2 text-[17px] text-slate-900">
        <span className={task.progress === 100 ? "text-slate-500 line-through decoration-emerald-500/60" : ""}>
          {task.title}
        </span>
      </td>
      <td className="px-2 py-2">
        {canSetWeights ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={weight}
              placeholder="—"
              onChange={(e) => setWeight(e.target.value)}
              onBlur={saveWeight}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
              className="w-16 rounded-md border border-brand-300 px-2 py-1 text-[17px] focus:border-brand-500 focus:outline-none"
              aria-label={`Weight for ${task.title}`}
            />
            <span className="text-[15px] text-slate-500">%</span>
          </div>
        ) : (
          <span className="text-[17px] text-slate-600">{task.weight == null ? "—" : `${task.weight}%`}</span>
        )}
      </td>
      <td className="px-2 py-2">
        {canUpdateProgress ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              onBlur={saveProgress}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
              className={`w-20 rounded-md border border-brand-300 px-2 py-1 text-[17px] focus:border-brand-500 focus:outline-none ${progressColor(task.progress)}`}
              aria-label={`Progress for ${task.title}`}
            />
            <span className="text-[15px] text-slate-500">%</span>
          </div>
        ) : (
          <span className={`text-[17px] ${progressColor(task.progress)}`}>{task.progress}%</span>
        )}
      </td>
      <td className="px-2 py-2 text-right text-[17px] text-slate-600">
        {task.weight == null ? "—" : `${Math.round(fulfilled * 10) / 10}%`}
      </td>
      {canEdit && (
        <td className="py-2 pl-2 text-right">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove "${task.title}" from this project?`)) {
                run(() => deleteSiteTaskAction(projectId, task.id));
              }
            }}
            className="rounded-md px-2 py-0.5 text-[19px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-700"
            aria-label={`Remove ${task.title}`}
            title="Not required for this project — remove"
          >
            ✕
          </button>
        </td>
      )}
    </tr>
  );
}

export function SiteTasks({
  projectId,
  tasks,
  missingStandard,
  canEdit,
  canSetWeights,
  canUpdateProgress,
  summary,
}: {
  projectId: string;
  tasks: SiteTask[];
  missingStandard: string[];
  canEdit: boolean;
  canSetWeights: boolean;
  canUpdateProgress: boolean;
  summary: { totalWeight: number; fulfilled: number; completed: number };
}) {
  const [error, setError] = useState<string | null>(null);
  const [toAdd, setToAdd] = useState("");
  const [adding, startAdding] = useTransition();
  const fulfilledPct = Math.min(100, summary.fulfilled);

  return (
    <div>
      {/* Weight fulfilled */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[23px] font-semibold text-emerald-600">{summary.fulfilled}%</div>
          <div className="text-[15px] text-slate-500">Weight fulfilled</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className={`text-[23px] font-semibold ${summary.totalWeight === 100 ? "text-slate-900" : "text-amber-600"}`}>
            {summary.totalWeight}%
          </div>
          <div className="text-[15px] text-slate-500">Weight assigned (of 100%)</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[23px] font-semibold text-slate-900">
            {summary.completed}/{tasks.length}
          </div>
          <div className="text-[15px] text-slate-500">Tasks done</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[23px] font-semibold text-slate-900">{tasks.length}</div>
          <div className="text-[15px] text-slate-500">Required tasks</div>
        </div>
      </div>
      <div className="mb-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${fulfilledPct}%` }} />
      </div>
      <p className="mb-4 text-[15px] text-slate-500">
        {summary.totalWeight === 100
          ? `${summary.fulfilled}% of the project's site work is done (each task's weight × its progress).`
          : summary.totalWeight > 100
            ? `Weights add up to ${summary.totalWeight}% — they should total 100%.`
            : `${100 - summary.totalWeight}% of the weight is still to be given out — weights should total 100%.`}
      </p>

      {error && <p className="mb-2 text-[17px] text-red-600">{error}</p>}

      {tasks.length === 0 ? (
        <p className="text-[17px] text-slate-500">No required site tasks on this project.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[15px] uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-2">Task</th>
                <th className="px-2 py-2">Weight</th>
                <th className="px-2 py-2">Progress</th>
                <th className="px-2 py-2 text-right">Fulfilled</th>
                {canEdit && <th className="py-2 pl-2" />}
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <SiteTaskRow
                  key={t.id}
                  projectId={projectId}
                  task={t}
                  canEdit={canEdit}
                  canSetWeights={canSetWeights}
                  canUpdateProgress={canUpdateProgress}
                  onError={setError}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && missingStandard.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-brand-100 pt-3">
          <select
            value={toAdd}
            onChange={(e) => setToAdd(e.target.value)}
            className="rounded-md border border-brand-300 px-2 py-1.5 text-[17px]"
          >
            <option value="">Add back a removed task…</option>
            {missingStandard.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!toAdd || adding}
            onClick={() =>
              startAdding(async () => {
                setError(null);
                const result = await addSiteTaskAction(projectId, toAdd);
                if (result.error) setError(result.error);
                else setToAdd("");
              })
            }
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-[17px] font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
      )}
      <p className="mt-3 text-[15px] text-slate-400">
        Weights: Abraham or Saroj. Progress: Ram, Abraham, Saroj or Jiyad. Removing/adding tasks: Ram, Abraham or Saroj.
      </p>
    </div>
  );
}
