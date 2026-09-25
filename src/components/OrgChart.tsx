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
      <div className="truncate text-sm font-semibold text-slate-900">
        {node.name}
      </div>
      <div className="truncate text-xs text-slate-500">{node.title}</div>
      {node.department && (
        <div className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700">
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
    return <p className="text-sm text-slate-500">No org chart yet.</p>;
  }
  return (
    <div className="overflow-x-auto pb-2">
      <ul className="org-tree min-w-max px-4">
        <OrgTreeNode node={orgTree} linkable={linkable} />
      </ul>
    </div>
  );
}
