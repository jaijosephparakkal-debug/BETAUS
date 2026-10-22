import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth";
import { Card } from "@/components/ui";
import { getRecipients } from "./actions";
import SendButton, { FlexieButton } from "./SendButton";

export default async function NotifyReconcilePage() {
  const me = await getCurrentMembership();
  if (!me) redirect("/login");
  if (!me.isDirector) redirect("/dashboard");
  const recipients = await getRecipients();
  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">Email staff: reconciliation window</h1>
      <p className="text-[19px] text-slate-500">
        Tells staff the attendance reconciliation window is open until 1:00 PM today. Abraham and the alerts account are not included.
      </p>
      <Card>
        <ul className="mb-4 space-y-1 text-[19px] text-slate-700">
          {recipients.map((r) => (
            <li key={r.email}>
              {r.name} <span className="text-slate-400">· {r.email}</span>
            </li>
          ))}
        </ul>
        <SendButton count={recipients.length} />
      </Card>
      <Card>
        <h2 className="mb-1 text-[21px] font-semibold text-slate-900">Window open until 10 PM — Flexie</h2>
        <p className="mb-3 text-[19px] text-slate-500">
          Antony, Jiyad and Ram get the same reminder automatically at about 3 PM today.
        </p>
        <FlexieButton />
      </Card>
    </div>
  );
}
