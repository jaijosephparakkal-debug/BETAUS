"use client";

import { useState, useTransition } from "react";
import {
  quickToggleTaskStatusAction,
  setCompletedDateAction,
  setTaskProgressAction,
} from "./actions";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
const PROGRESS_STEPS = [25, 50, 75, 100] as const;

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function QuickStatusToggle({
  taskId,
  initialStatus,
  initialProgress,
  initialCompletedAt,
}: {
  taskId: string;
  initialStatus: string;
  initialProgress: number;
  initialCompletedAt: string | null;
}) {
  const [status, setStatus] = useState<Status>(
    initialStatus === "COMPLETED" || initialStatus === "IN_PROGRESS"
      ? initialStatus
      : "NOT_STARTED"
  );
  const [progress, setProgress] = useState(initialProgress);
  const [completedAt, setCompletedAtValue] = useState(
    toLocalInputValue(initialCompletedAt ? new Date(initialCompletedAt) : new Date())
  );
  const [pending, startTransition] = useTransition();
  const [dateSaving, startDateTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(target: Exclude<Status, "NOT_STARTED">) {
    const next: Status = status === target ? "NOT_STARTED" : target;
    const prevStatus = status;
    const prevProgress = progress;
    setStatus(next);
    setProgress(next === "COMPLETED" ? 100 : next === "NOT_STARTED" ? 0 : progress || 25);
    setError(null);
    startTransition(async () => {
      const result = await quickToggleTaskStatusAction(
        taskId,
        next,
        next === "COMPLETED" ? completedAt : null
      );
      if (result.error) {
        setError(result.error);
        setStatus(prevStatus);
        setProgress(prevProgress);
      }
    });
  }

  function pickProgress(pct: (typeof PROGRESS_STEPS)[number]) {
    const prevStatus = status;
    const prevProgress = progress;
    setProgress(pct);
    setStatus(pct === 100 ? "COMPLETED" : "IN_PROGRESS");
    setError(null);
    startTransition(async () => {
      const result = await setTaskProgressAction(taskId, pct, pct === 100 ? completedAt : null);
      if (result.error) {
        setError(result.error);
        setStatus(prevStatus);
        setProgress(prevProgress);
      }
    });
  }

  function updateCompletedAt(value: string) {
    setCompletedAtValue(value);
    if (status === "COMPLETED") {
      startDateTransition(async () => {
        await setCompletedDateAction(taskId, value);
      });
    }
  }

  const isComplete = status === "COMPLETED";
  const isInProgress = status === "IN_PROGRESS";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[19px] font-medium text-slate-700">Complete</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => toggle("COMPLETED")}
          aria-pressed={isComplete}
          className={`relative h-8 w-16 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            isComplete ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          <span
            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              isComplete ? "translate-x-8" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      <div className="text-[15px] text-slate-500">
        {isComplete ? "Complete" : "Not Completed"}
      </div>

      {isComplete && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-brand-50 px-2.5 py-2">
          <label htmlFor={`completed-at-${taskId}`} className="text-[15px] text-slate-600">
            Finished on
          </label>
          <input
            id={`completed-at-${taskId}`}
            type="datetime-local"
            value={completedAt}
            onChange={(e) => updateCompletedAt(e.target.value)}
            className="rounded-md border border-brand-300 px-2 py-1 text-[15px]"
          />
          {dateSaving && <span className="text-[13px] text-slate-400">Saving…</span>}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <span className="text-[19px] font-medium text-slate-700">In Progress</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => toggle("IN_PROGRESS")}
          aria-pressed={isInProgress}
          className={`relative h-8 w-16 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            isInProgress ? "bg-amber-400" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              isInProgress ? "translate-x-8" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      <div className="text-[15px] text-slate-500">
        {isInProgress ? "In Progress" : "Not Started"}
      </div>

      {isInProgress && (
        <div className="space-y-1.5 rounded-md bg-amber-50 px-2.5 py-2">
          <div className="text-[15px] text-slate-600">How far along?</div>
          <div className="flex gap-1.5">
            {PROGRESS_STEPS.map((pct) => (
              <button
                key={pct}
                type="button"
                disabled={pending}
                onClick={() => pickProgress(pct)}
                className={`flex-1 rounded-md py-1.5 text-[15px] font-medium transition-colors disabled:opacity-60 ${
                  progress === pct
                    ? "bg-amber-500 text-white"
                    : "border border-amber-300 bg-white text-slate-700 hover:bg-amber-100"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-[17px] text-red-600">{error}</p>}
    </div>
  );
}
