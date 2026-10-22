"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { DUBAI_OFFSET_MS, dubaiDateKey } from "@/lib/attendance";
import { isReconcileOpen, canBulkReconcile, RECONCILE_FROM, RECONCILE_WINDOW } from "@/lib/reconcile";

type State = { error?: string; ok?: boolean };

function parse(dateKey: string, hhmm: string) {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  const tm = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!dm || !tm) return null;
  return new Date(Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +tm[1], +tm[2]) - DUBAI_OFFSET_MS);
}

function checkTimes(dateKey: string, inT: string, outT: string, note: string, now: Date, outRequired: boolean) {
  const clockIn = parse(dateKey, inT);
  const clockOut = outT ? parse(dateKey, outT) : null;
  if (!clockIn) return { error: "Enter the login time." } as const;
  if (outRequired && !clockOut) return { error: "Enter the logout time." } as const;
  if (clockOut && clockOut <= clockIn) return { error: "Logout must be after login." } as const;
  if (clockIn > now || (clockOut && clockOut > now)) return { error: "Times can't be in the future." } as const;
  if (note.trim().length < 3) return { error: "Add a short reason for the change." } as const;
  return { clockIn, clockOut } as const;
}

const closedMsg = `The reconciliation window (${RECONCILE_WINDOW.label}) is closed.`;

export async function saveEntryAction(entryId: string, _prev: State | undefined, formData: FormData): Promise<State> {
  const me = await getCurrentMembership();
  if (!me) return { error: "Not signed in." };
  if (!isReconcileOpen(me.user.email)) return { error: closedMsg };

  const entry = await prisma.attendanceEntry.findUnique({ where: { id: entryId }, include: { membership: true } });
  if (!entry || entry.membership.userId !== me.userId) return { error: "Entry not found." };

  const now = new Date();
  const dateKey = dubaiDateKey(entry.clockIn);
  const stillOpenToday = !entry.clockOut && dateKey === dubaiDateKey(now);
  const note = String(formData.get("note") || "");
  const checked = checkTimes(dateKey, String(formData.get("in") || ""), stillOpenToday ? "" : String(formData.get("out") || ""), note, now, !stillOpenToday);
  if ("error" in checked) return { error: checked.error };

  await prisma.attendanceEntry.update({
    where: { id: entryId },
    data: {
      clockIn: checked.clockIn,
      ...(stillOpenToday ? {} : { clockOut: checked.clockOut, reason: entry.reason ?? "SHIFT_ENDED" }),
      isManual: true,
      manualNote: note.trim(),
      manualAt: now,
      ...(entry.isManual ? {} : { origClockIn: entry.clockIn, origClockOut: entry.clockOut }),
    },
  });
  revalidatePath("/dashboard/reconcile");
  revalidatePath("/director/attendance");
  return { ok: true };
}

export async function addEntryAction(_prev: State | undefined, formData: FormData): Promise<State> {
  const me = await getCurrentMembership();
  if (!me) return { error: "Not signed in." };
  if (!isReconcileOpen(me.user.email)) return { error: closedMsg };

  const membershipId = String(formData.get("membershipId") || "");
  const mine = await prisma.membership.findFirst({ where: { id: membershipId, userId: me.userId } });
  if (!mine) return { error: "Choose one of your own roles." };

  const now = new Date();
  const dateKey = String(formData.get("date") || "");
  if (dateKey < RECONCILE_FROM || dateKey > dubaiDateKey(now)) return { error: "Pick a date from 26 Sep to today." };

  const note = String(formData.get("note") || "");
  const checked = checkTimes(dateKey, String(formData.get("in") || ""), String(formData.get("out") || ""), note, now, true);
  if ("error" in checked) return { error: checked.error };

  await prisma.attendanceEntry.create({
    data: {
      membershipId,
      clockIn: checked.clockIn,
      clockOut: checked.clockOut,
      reason: "SHIFT_ENDED",
      isManual: true,
      manualNote: note.trim(),
      manualAt: now,
    },
  });
  revalidatePath("/dashboard/reconcile");
  revalidatePath("/director/attendance");
  return { ok: true };
}

export async function addBulkEntriesAction(rows: { date: string; in: string; out: string }[]): Promise<{ error?: string; added?: number }> {
  const me = await getCurrentMembership();
  if (!me) return { error: "Not signed in." };
  if (!isReconcileOpen(me.user.email)) return { error: closedMsg };
  if (!canBulkReconcile(me.user.email)) return { error: "Not available for your account." };
  if (rows.length === 0 || rows.length > 40) return { error: "Nothing to save." };

  const now = new Date();
  const note = "Manual entry by director: worked but did not log in; usual hours entered manually";
  const data = [];
  for (const r of rows) {
    if (r.date < RECONCILE_FROM || r.date >= dubaiDateKey(now)) return { error: `${r.date}: pick a date from 26 Sep up to yesterday.` };
    const checked = checkTimes(r.date, r.in, r.out, note, now, true);
    if ("error" in checked) return { error: `${r.date}: ${checked.error}` };
    data.push({
      membershipId: me.id,
      clockIn: checked.clockIn,
      clockOut: checked.clockOut,
      reason: "SHIFT_ENDED",
      isManual: true,
      manualNote: note,
      manualAt: now,
    });
  }
  await prisma.attendanceEntry.createMany({ data });
  revalidatePath("/dashboard/reconcile");
  revalidatePath("/director/attendance");
  return { added: data.length };
}
