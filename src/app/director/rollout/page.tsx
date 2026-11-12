import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { canManageAllStaff, getCurrentMembership } from "@/lib/auth";
import { Card } from "@/components/ui";
import { RECIPIENTS, buildEmail, ML_RECIPIENTS, buildMalayalamEmail } from "@/lib/rolloutEmail";
import { SendButton, SendMalayalamButton } from "./SendButton";

export default async function RolloutPage() {
  const m = await getCurrentMembership();
  if (!m || !canManageAllStaff(m)) redirect("/dashboard");
  const done = await prisma.numberCounter.findUnique({ where: { key: "rollout-email-2026-11" } });
  const sample = buildEmail(RECIPIENTS[0]);
  const mlDone = await prisma.numberCounter.findUnique({ where: { key: "rollout-email-ml-2026-11" } });
  const mlSample = buildMalayalamEmail(ML_RECIPIENTS[0]);
  return (
    <div className="space-y-4">
      <h1 className="text-[23px] font-semibold text-slate-900">Roll-out email</h1>
      <Card>
        <p className="text-[19px] text-slate-700">
          One personalised email to each of these {RECIPIENTS.length} people. It can be sent once only. Subject: <b>{sample.subject}</b>
        </p>
        <ul className="mt-3 grid gap-1 text-[18px] text-slate-700 sm:grid-cols-2">
          {RECIPIENTS.map((r) => (
            <li key={r.email}>
              <b>{r.name}</b> · {r.email}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <SendButton alreadySent={!!done} />
        </div>
      </Card>
      <Card>
        <p className="mb-2 text-[19px] font-medium text-slate-800">Preview, as it reads for {RECIPIENTS[0].name}</p>
        <div className="rounded-lg p-4" style={{ background: "#fff" }} dangerouslySetInnerHTML={{ __html: sample.html }} />
      </Card>
      <Card>
        <p className="mb-2 text-[19px] font-medium text-slate-800">
          Malayalam email for {ML_RECIPIENTS.map((r) => r.name).join(" and ")}
        </p>
        <div className="mb-4"><SendMalayalamButton alreadySent={!!mlDone} /></div>
        <div className="rounded-lg p-4" style={{ background: "#fff" }} dangerouslySetInnerHTML={{ __html: mlSample.html }} />
      </Card>
    </div>
  );
}
