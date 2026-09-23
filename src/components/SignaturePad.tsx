"use client";

import { useRef, useState, useTransition } from "react";
import {
  saveSignatureAction,
  clearSignatureAction,
} from "@/app/dashboard/approvals/actions";

export function SignaturePad({ existing }: { existing: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!existing);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e);
    drawing.current = true;
    hasDrawn.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvas.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp() {
    drawing.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
  }

  function handleSave() {
    if (!hasDrawn.current) {
      setError("Draw your signature first.");
      return;
    }
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    setError(null);
    startTransition(async () => {
      const res = await saveSignatureAction(dataUrl);
      if (res.error) setError(res.error);
      else setEditing(false);
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await clearSignatureAction();
      setEditing(true);
    });
  }

  if (!editing && existing) {
    return (
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={existing}
          alt="Your saved signature"
          className="h-16 rounded-lg border border-brand-200 bg-white px-2"
        />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-brand-600 hover:underline"
        >
          Redraw
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={pending}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full max-w-[400px] touch-none rounded-lg border border-brand-300 bg-white"
        style={{ height: 150 }}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save signature"}
        </button>
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Clear
        </button>
        {existing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
