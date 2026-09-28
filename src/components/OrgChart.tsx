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

function OrgTreeNode({ node, linkable }: { node: OrgNode; linkable: boolean }) {
  return (
    <li>
      {node.isDirector || !linkable ? (
        <OrgNodeCard node={node} />
      ) : (
        <Link href={`/dashboard/team/${node.id}`} className="block hover:opacity-80">
          <OrgNodeCard node={node} />
        </Link>
      )}
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <OrgTreeNode key={child.id} node={child} linkable={linkable} />
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

/**
 * One chart spanning two companies that share the same director — the
 * director's own node is shown once at the top, with each company's
 * reports underneath as a labeled branch, instead of rendering two entirely
 * separate trees (which would repeat the director once per company).
 */
export function MergedOrgChart({
  directorName,
  directorTitle,
  branches,
}: {
  directorName: string;
  directorTitle: string;
  branches: { label: string; color: string; tree: OrgNode | null }[];
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex flex-col items-center px-4">
        <div className="w-44 rounded-xl border border-brand-500 bg-brand-50 px-3 py-2.5 text-center shadow-sm">
          <div className="truncate text-[19px] font-semibold text-slate-900">{directorName}</div>
          <div className="truncate text-[17px] text-slate-500">{directorTitle}</div>
        </div>
        <div className="h-6 w-px bg-brand-200" />
        <ul className="org-tree min-w-max">
          {branches.map((b) => (
            <li key={b.label}>
              <div
                className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[13px] font-semibold uppercase tracking-wide"
                style={{ color: b.color, background: `${b.color}1a` }}
              >
                {b.label}
              </div>
              {b.tree && b.tree.children.length > 0 ? (
                <ul>
                  {b.tree.children.map((child) => (
                    <OrgTreeNode key={child.id} node={child} linkable={false} />
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[15px] text-slate-500">No reports.</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
