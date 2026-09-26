"use client";

import { useState, useTransition } from "react";
import { quickToggleTaskStatusAction } from "./actions";

type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export function QuickStatusToggle({
  taskId,
  initialStatus,
}: {
  taskId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState<Status>(
    initialStatus === "COMPLETED" || initialStatus === "IN_PROGRESS"
      ? initialStatus
      : "NOT_STARTED"
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(target: Exclude<Status, "NOT_STARTED">) {
    const next: Status = status === target ? "NOT_STARTED" : target;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const result = await quickToggleTaskStatusAction(taskId, next);
      if (result.error) {
        setError(result.error);
        setStatus(initialStatus === "COMPLETED" || initialStatus === "IN_PROGRESS" ? initialStatus : "NOT_STARTED");
      }
    });
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

      {error && <p className="text-[17px] text-red-600">{error}</p>}
    </div>
  );
}
