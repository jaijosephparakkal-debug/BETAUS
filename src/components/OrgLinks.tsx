"use client";

import { useEffect, useRef, useState } from "react";

export type OrgPair = { from: string; to: string; kind: "direct" | "second" };

/** Draws the second reporting lines over the org chart (wide screens only), measured from where the cards really are. */
export function OrgLinks({ pairs, children }: { pairs: OrgPair[]; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; kind: OrgPair["kind"] }[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => {
      if (window.innerWidth < 1280) {
        setPaths([]);
        return;
      }
      const box = el.getBoundingClientRect();
      const X = (v: number) => Math.round(v - box.left);
      const Y = (v: number) => Math.round(v - box.top);
      const out: { d: string; kind: OrgPair["kind"] }[] = [];
      for (const p of pairs) {
        const a = el.querySelector(`[data-org-id="${p.from}"]`) as HTMLElement | null;
        const b = (p.to === "md" ? el.querySelector("[data-org-md]") : el.querySelector(`[data-org-id="${p.to}"]`)) as HTMLElement | null;
        if (!a || !b) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const ay = Y(ra.top + ra.height / 2);
        const by = Y(rb.top + rb.height / 2);
        let d: string;
        if (p.to === "md" || (rb.left < ra.right && ra.left < rb.right)) {
          d = `M ${X(ra.left)} ${ay} H 6 V ${by} H ${X(rb.left)}`;
        } else if (rb.left >= ra.right) {
          const mx = Math.round((X(ra.right) + X(rb.left)) / 2);
          d = `M ${X(ra.right)} ${ay} H ${mx} V ${by} H ${X(rb.left)}`;
        } else {
          const mx = Math.round((X(ra.left) + X(rb.right)) / 2);
          d = `M ${X(ra.left)} ${ay} H ${mx} V ${by} H ${X(rb.right)}`;
        }
        out.push({ d, kind: p.kind });
      }
      setPaths(out);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    window.addEventListener("resize", calc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, [pairs]);

  return (
    <div ref={ref} className="relative">
      {children}
      <svg className="pointer-events-none absolute inset-0 hidden h-full w-full xl:block" style={{ overflow: "visible" }} aria-hidden="true">
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke="rgb(var(--highlight))"
            strokeWidth={2}
            strokeDasharray={p.kind === "second" ? "6 5" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}
