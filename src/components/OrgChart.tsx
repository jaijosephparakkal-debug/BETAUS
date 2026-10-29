import Link from "next/link";
import type { OrgNode } from "@/lib/queries";

function OrgNodeCard({ node }: { node: OrgNode }) {
  return (
    <div
      className={`w-40 rounded-xl border px-3 py-2.5 text-center shadow-sm transition ${
        node.isDirector
          ? "border-brand-500 bg-brand-50"
          : "border-brand-200 bg-surface hover:border-brand-200"
      }`}
    >
      <div className="truncate text-[19px] font-semibold text-slate-900">
        {node.name}
      </div>
      <div className="truncate text-[17px] text-slate-500">{node.title}</div>
      {node.department && (
        <div className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-[15px] font-medium uppercase tracking-wide text-brand-700">
          {node.department}
        </div>
      )}
    </div>
  );
}

function OrgTreeNode({
  node,
  linkable,
  staffLinks = false,
}: {
  node: OrgNode;
  linkable: boolean;
  staffLinks?: boolean;
}) {
  return (
    <li>
      {node.isDirector || !linkable ? (
        <OrgNodeCard node={node} />
      ) : (
        <Link
          href={staffLinks ? `/director/staff/${node.userId}` : `/dashboard/team/${node.id}`}
          className="block hover:opacity-80"
        >
          <OrgNodeCard node={node} />
        </Link>
      )}
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <OrgTreeNode key={child.id} node={child} linkable={linkable} staffLinks={staffLinks} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** The connecting-line org chart. `linkable` opens each node to its team page — only safe when the viewer can actually access every node (e.g. the director's own view). */
export function OrgChart({
  orgTree,
  linkable = false,
}: {
  orgTree: OrgNode | null;
  linkable?: boolean;
}) {
  if (!orgTree) {
    return <p className="text-[19px] text-slate-500">No org chart yet.</p>;
  }
  return (
    <div className="overflow-x-auto pb-2">
      <ul className="org-tree min-w-max px-4">
        <OrgTreeNode node={orgTree} linkable={linkable} />
      </ul>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** One person in the director's chart — avatar, full name and title, never cut off. */
function PersonRow({ node, href, color, lead }: { node: OrgNode; href: string | null; color: string; lead: boolean }) {
  const body = (
    <div className="flex items-center gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${lead ? "h-11 w-11 text-[16px] text-white" : "h-9 w-9 text-[13px]"}`}
        style={lead ? { background: color } : { background: `${color}1a`, color }}
      >
        {initials(node.name)}
      </div>
      <div className="min-w-0">
        <div className={`break-words leading-snug text-slate-900 ${lead ? "text-[18px] font-semibold" : "text-[16px] font-medium"}`}>{node.name}</div>
        <div className="break-words text-[14px] leading-snug text-slate-500">{node.title}</div>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-lg hover:bg-slate-50">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Reports nested under a manager, joined by elbow connectors. */
function Reports({ nodes, staffLinks, color }: { nodes: OrgNode[]; staffLinks: boolean; color: string }) {
  return (
    <div className="mt-3 space-y-3">
      {nodes.map((child, i) => {
        const last = i === nodes.length - 1;
        return (
          <div key={child.id} className="relative pl-6">
            <span className="absolute left-2 top-0 w-px" style={{ background: `${color}55`, height: last ? "18px" : "100%" }} />
            <span className="absolute left-2 top-[18px] h-px w-4" style={{ background: `${color}55` }} />
            <PersonRow node={child} href={staffLinks && child.hasProfile ? `/director/staff/${child.userId}` : null} color={color} lead={false} />
            {child.children.length > 0 && <Reports nodes={child.children} staffLinks={staffLinks} color={color} />}
          </div>
        );
      })}
    </div>
  );
}

/** A manager and their team as one card. */
function TeamCard({ node, staffLinks, color }: { node: OrgNode; staffLinks: boolean; color: string }) {
  const href = staffLinks && node.hasProfile ? `/director/staff/${node.userId}` : null;
  return (
    <div className="overflow-hidden rounded-xl border bg-surface shadow-sm" style={{ borderColor: `${color}33` }}>
      <div className="h-1" style={{ background: color }} />
      <div className="p-4">
        {node.department && (
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color }}>
            {node.department}
          </div>
        )}
        <PersonRow node={node} href={href} color={color} lead />
        {node.children.length > 0 && <Reports nodes={node.children} staffLinks={staffLinks} color={color} />}
      </div>
    </div>
  );
}

/** A thin vertical connector between levels. */
function Drop({ color = "#94a3b8" }: { color?: string }) {
  return <div className="mx-auto h-6 w-px" style={{ background: color }} />;
}

/**
 * One chart spanning two companies that share the same director — the
 * director once at the top, a connector down to each company, and each
 * company as a coloured panel whose teams sit side by side and wrap to the
 * screen width (no sideways scrolling, no cut-off names).
 */
export function MergedOrgChart({
  directorName,
  directorTitle,
  branches,
  staffLinks = false,
}: {
  directorName: string;
  directorTitle: string;
  branches: { label: string; color: string; tree: OrgNode | null }[];
  /** Each person opens their Manage My Staff profile. */
  staffLinks?: boolean;
}) {
  return (
    <div>
      <div className="mx-auto w-fit rounded-xl border border-slate-800 bg-slate-900 px-6 py-3 text-center shadow-md">
        <div className="text-[19px] font-semibold text-white">{directorName}</div>
        <div className="text-[15px] text-slate-300">{directorTitle}</div>
      </div>
      {branches.map((b) => {
        const teams = b.tree?.children ?? [];
        return (
          <div key={b.label}>
            <Drop />
            <section className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: `${b.color}40`, background: `${b.color}08` }}>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-8 w-1.5 rounded-full" style={{ background: b.color }} />
                <h3 className="text-[20px] font-semibold uppercase tracking-wide" style={{ color: b.color }}>
                  {b.label}
                </h3>
              </div>
              {teams.length === 0 ? (
                <p className="text-[15px] text-slate-500">No reports.</p>
              ) : (
                <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {teams.map((t) => (
                    <TeamCard key={t.id} node={t} staffLinks={staffLinks} color={b.color} />
                  ))}
                </div>
              )}
            </section>
          </div>
        );
      })}
    </div>
  );
}
