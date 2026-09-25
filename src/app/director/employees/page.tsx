import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { Card } from "@/components/ui";
import EmailForm from "./EmailForm";

export default async function EmployeesPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  const employees = await prisma.membership.findMany({
    where: { companyId: membership.companyId },
    include: { user: true, manager: { include: { user: true } } },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[23px] font-semibold text-slate-900">
          Employees — {membership.company.name}
        </h1>
        <p className="text-[19px] text-slate-500">
          Sign-in codes are sent to these addresses — update any placeholder
          emails to the real ones before employees try to sign in.
        </p>
      </div>
      <Card className="!p-0">
        <table className="w-full text-[19px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[17px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Email</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-[21px] font-medium text-slate-900">
                  {e.user.name}
                  {e.isDirector && (
                    <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[17px] text-brand-700">
                      Director
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{e.title}</td>
                <td className="px-4 py-3 text-slate-600">
                  {e.manager?.user.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <EmailForm userId={e.userId} currentEmail={e.user.email} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
