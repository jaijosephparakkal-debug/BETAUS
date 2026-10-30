import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { Card } from "@/components/ui";
import { getOctoberRecipients, getCommonEmailPlan } from "./actions";
import CommonSender from "./CommonSender";
import CalendarSender from "./CalendarSender";
import OctoberSender from "./OctoberSender";

export default async function NotifyReconcilePage() {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!me.isDirector) redirect("/dashboard");
  const recipients = await getOctoberRecipients();
  const common = await getCommonEmailPlan();
  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">Email staff: reconciliation and October attendance</h1>
      <p className="text-[19px] text-slate-500">
        Tells each person the reconciliation window is open today until 6:00 PM, with their own October attendance attached as a PDF. Abraham and the Maintenance Manager placeholder are not included.
      </p>
      <Card>
        <h2 className="mb-2 text-[21px] font-semibold text-slate-900">Final October timesheet to all staff</h2>
        <p className="mb-3 text-[17px] text-slate-500">The October timesheet for everyone, stating it is the final one going to Mr. Abraham tomorrow. Calendar in the message plus the PDF.</p>
        <CalendarSender final />
      </Card>
      <Card>
        <h2 className="mb-2 text-[21px] font-semibold text-slate-900">Whole calendar to all staff</h2>
        <p className="mb-3 text-[17px] text-slate-500">One email with everyone's day-in and day-out for October in the message (late first logins in amber), plus the PDF.</p>
        <CalendarSender />
      </Card>
      <Card>
        <h2 className="mb-2 text-[21px] font-semibold text-slate-900">One common email to all staff</h2>
        <p className="mb-3 text-[17px] text-slate-500">One email to everyone with the whole October calendar attached and a list of who still has absent days or days with no logout. The reconciliation window is open for everyone until 11:00 AM today. Goes to everyone except Abraham and the Maintenance Manager placeholder.</p>
        <CommonSender people={common.people} recipientCount={common.recipients.length} />
      </Card>
      <Card>
        <OctoberSender recipients={recipients} />
      </Card>
    </div>
  );
}
