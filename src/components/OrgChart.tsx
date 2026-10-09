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

/** One person in the director's chart — full name and title, never cut off. */
function PersonCard({ node, href, color }: { node: OrgNode; href: string | null; color: string }) {
  const body = (
    <div
      className="rounded-lg border bg-surface px-3 py-2 shadow-sm transition hover:shadow-md"
      style={{ borderColor: `${color}55` }}
    >
      <div className="break-words text-[17px] font-semibold leading-snug text-slate-900">{node.name}</div>
      <div className="break-words text-[15px] leading-snug text-slate-500">{node.title}</div>
      {node.department && (
        <div
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide"
          style={{ color, background: `${color}14` }}
        >
          {node.department}
        </div>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/** A manager and everyone under them, nested downward with a guide line — wraps instead of scrolling sideways. */
function TeamBranch({ node, staffLinks, color }: { node: OrgNode; staffLinks: boolean; color: string }) {
  const href = staffLinks && !node.isDirector ? `/director/staff/${node.userId}` : null;
  return (
    <div>
      <PersonCard node={node} href={href} color={color} />
      {node.children.length > 0 && (
        <div className="ml-3 mt-2 space-y-2 border-l-2 pl-3" style={{ borderColor: `${color}33` }}>
          {node.children.map((child) => (
            <TeamBranch key={child.id} node={child} staffLinks={staffLinks} color={color} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One chart spanning two companies that share the same director — the
 * director once at the top, then each company as a labelled section whose
 * teams sit side by side and wrap to the screen width (no sideways
 * scrolling, no cut-off names).
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
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="rounded-xl border border-brand-500 bg-brand-50 px-5 py-3 text-center shadow-sm">
          <div className="text-[19px] font-semibold text-slate-900">{directorName}</div>
          <div className="text-[17px] text-slate-500">{directorTitle}</div>
        </div>
      </div>
      {branches.map((b) => {
        const teams = b.tree?.children ?? [];
        return (
          <section key={b.label} className="rounded-xl border p-4" style={{ borderColor: `${b.color}33` }}>
            <div
              className="mb-3 inline-block rounded-full px-3 py-1 text-[14px] font-semibold uppercase tracking-wide"
              style={{ color: b.color, background: `${b.color}1a` }}
            >
              {b.label}
            </div>
            {teams.length === 0 ? (
              <p className="text-[15px] text-slate-500">No reports.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {teams.map((t) => (
                  <TeamBranch key={t.id} node={t} staffLinks={staffLinks} color={b.color} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
