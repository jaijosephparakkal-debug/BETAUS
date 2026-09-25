import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { getLatestDirectorMessage } from "@/lib/queries";
import { Card, formatDate } from "@/components/ui";
import MessageForm from "./MessageForm";

export default async function DirectorMessagePage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (!membership.isDirector) redirect("/dashboard");

  const latest = await getLatestDirectorMessage(membership.companyId);

  return (
    <div className="space-y-6">
      <h1 className="text-[23px] font-semibold text-slate-900">
        Message to {membership.company.name}
      </h1>
      <Card>
        <MessageForm />
      </Card>
      {latest && (
        <Card>
          <div className="text-[17px] font-semibold uppercase tracking-wide text-slate-500">
            Currently showing on everyone&rsquo;s dashboard
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[19px] text-slate-800">
            {latest.body}
          </p>
          <div className="mt-2 text-[17px] text-slate-500">
            {latest.author.user.name} · {formatDate(latest.createdAt)}
          </div>
        </Card>
      )}
    </div>
  );
}
