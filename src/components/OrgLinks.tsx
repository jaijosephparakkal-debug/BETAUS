"use client";

import { useEffect, useRef, useState } from "react";

export type OrgPair = { from: string; to: string; kind: "direct" | "second" };

/** Draws the second reporting lines over the org chart (wide screens only), measured from where the cards really are. */
export function OrgLinks({ pairs, children }: { pairs: OrgPair[]; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; kind: OrgPair["kind"]; dots: [number, number][] }[]>([]);

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
      const out: { d: string; kind: OrgPair["kind"]; dots: [number, number][] }[] = [];
      for (const p of pairs) {
        const a = el.querySelector(`[data-org-id="${p.from}"]`) as HTMLElement | null;
        const b = (p.to === "md" ? el.querySelector("[data-org-md]") : el.querySelector(`[data-org-id="${p.to}"]`)) as HTMLElement | null;
        if (!a || !b) continue;
        const ha = (a.closest("[data-org-team]") as HTMLElement | null) ?? a;
        const hb = p.to === "md" ? b : ((b.closest("[data-org-team]") as HTMLElement | null) ?? b);
        const ra = ha.getBoundingClientRect();
        const rb = hb.getBoundingClientRect();
        const ay = Y(a.getBoundingClientRect().top + a.getBoundingClientRect().height / 2);
        const by = Y(b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2);
        let d: string;
        let dots: [number, number][];
        if (p.to === "md") {
          // Out of the left edge of the team card, up the gutter, into the Managing Director's card.
          d = `M ${X(ra.left)} ${ay} H 8 V ${by} H ${X(rb.left)}`;
          dots = [[X(ra.left), ay], [X(rb.left), by]];
        } else if (rb.left >= ra.right) {
          const mx = Math.round((X(ra.right) + X(rb.left)) / 2);
          d = `M ${X(ra.right)} ${ay} H ${mx} V ${by} H ${X(rb.left)}`;
          dots = [[X(ra.right), ay], [X(rb.left), by]];
        } else {
          const mx = Math.round((X(ra.left) + X(rb.right)) / 2);
          d = `M ${X(ra.left)} ${ay} H ${mx} V ${by} H ${X(rb.right)}`;
          dots = [[X(ra.left), ay], [X(rb.right), by]];
        }
        out.push({ d, kind: p.kind, dots });
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
          <g key={i} stroke="rgba(223,229,235,0.85)" fill="rgba(223,229,235,0.95)">
            <path d={p.d} fill="none" strokeWidth={2} strokeDasharray={p.kind === "second" ? "6 5" : undefined} strokeLinecap="round" strokeLinejoin="round" />
            {p.dots.map((c, k) => (
              <circle key={k} cx={c[0]} cy={c[1]} r={4} stroke="none" />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
