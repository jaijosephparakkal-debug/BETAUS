"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; badge?: number };

/** The tab strip: the current page is a solid ice-gray pill. */
export function NavLinks({ items }: { items: Item[] }) {
  const path = usePathname();
  const exact = new Set(["/dashboard", "/director"]);
  return (
    <>
      {items.map((item) => {
        const on = exact.has(item.href) ? path === item.href : path === item.href || path.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[17px] font-medium transition-colors ${
              on ? "bg-[#DFE5EB] font-semibold text-ink" : "text-slate-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
            {!!item.badge && (
              <span className="rounded-full bg-accent px-1.5 text-[15px] font-bold text-on-accent">{item.badge}</span>
            )}
          </Link>
        );
      })}
    </>
  );
}
