import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { Card } from "@/components/ui";
import { getOctoberRecipients } from "./actions";
import OctoberSender from "./OctoberSender";

export default async function NotifyReconcilePage() {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!me.isDirector) redirect("/dashboard");
  const recipients = await getOctoberRecipients();
  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">Email staff: reconciliation and October attendance</h1>
      <p className="text-[19px] text-slate-500">
        Tells each person the reconciliation window is open today until 6:00 PM, with their own October attendance attached as a PDF. Abraham and the Maintenance Manager placeholder are not included.
      </p>
      <Card>
        <OctoberSender recipients={recipients} />
      </Card>
    </div>
  );
}
