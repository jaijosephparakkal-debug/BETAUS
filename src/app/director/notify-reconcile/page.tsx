import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { Card } from "@/components/ui";
import { getOctoberRecipients, getOutstandingRecipients } from "./actions";
import OctoberSender from "./OctoberSender";
import OutstandingSender from "./OutstandingSender";

export default async function NotifyReconcilePage() {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!me.isDirector) redirect("/dashboard");
  const recipients = await getOctoberRecipients();
  const outstanding = await getOutstandingRecipients();
  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">Email staff: reconciliation and October attendance</h1>
      <p className="text-[19px] text-slate-500">
        Tells each person the reconciliation window is open today until 6:00 PM, with their own October attendance attached as a PDF. Abraham and the Maintenance Manager placeholder are not included.
      </p>
      <Card>
        <h2 className="mb-2 text-[21px] font-semibold text-slate-900">Follow-up: days still missing a logout</h2>
        <p className="mb-3 text-[17px] text-slate-500">Window open for these people until 11:00 AM today. Each email lists their own days.</p>
        <OutstandingSender people={outstanding} />
      </Card>
      <Card>
        <OctoberSender recipients={recipients} />
      </Card>
    </div>
  );
}
