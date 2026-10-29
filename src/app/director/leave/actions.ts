"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { isHoliday } from "@/lib/attendanceCalendar";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Marks annual leave for a person from one date to another (inclusive). Holidays are skipped. */
export async function addLeaveAction(formData: FormData): Promise<void> {
  const me = await getCurrentMembership();
  if (!me || !me.isDirector) return;
  const userId = String(formData.get("userId") || "");
  const from = String(formData.get("from") || "");
  const to = String(formData.get("to") || from);
  if (!userId || !DATE.test(from) || !DATE.test(to) || to < from) return;
  const days: string[] = [];
  for (let d = new Date(`${from}T00:00:00Z`); d.toISOString().slice(0, 10) <= to && days.length < 90; d.setUTCDate(d.getUTCDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    if (!isHoliday(k)) days.push(k);
  }
  if (days.length === 0) return;
  await prisma.leaveDay.createMany({
    data: days.map((date) => ({ userId, date, createdById: me.id })),
    skipDuplicates: true,
  });
  revalidatePath(`/director/staff/${userId}/calendar`);
  revalidatePath("/director/calendar");
}

export async function removeLeaveAction(formData: FormData): Promise<void> {
  const me = await getCurrentMembership();
  if (!me || !me.isDirector) return;
  const userId = String(formData.get("userId") || "");
  const date = String(formData.get("date") || "");
  if (!userId || !DATE.test(date)) return;
  await prisma.leaveDay.deleteMany({ where: { userId, date } });
  revalidatePath(`/director/staff/${userId}/calendar`);
  revalidatePath("/director/calendar");
}
