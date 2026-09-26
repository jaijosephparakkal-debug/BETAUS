import { prisma } from "@/lib/db";

export const SIGN_OUT_REASONS = {
  OFFICE_USE: "Going out for office use",
  SICKNESS: "Leaving due to sickness",
  SHIFT_ENDED: "Shift ended",
} as const;

export type SignOutReason = keyof typeof SIGN_OUT_REASONS;

/** Opens a new attendance entry unless one is already open for this membership. */
export async function clockInIfNeeded(membershipId: string) {
  const open = await prisma.attendanceEntry.findFirst({
    where: { membershipId, clockOut: null },
  });
  if (open) return open;
  return prisma.attendanceEntry.create({ data: { membershipId } });
}

/** Closes the currently-open attendance entry for this membership, if any. */
export async function clockOut(membershipId: string, reason: SignOutReason) {
  const open = await prisma.attendanceEntry.findFirst({
    where: { membershipId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (!open) return;
  await prisma.attendanceEntry.update({
    where: { id: open.id },
    data: { clockOut: new Date(), reason },
  });
}

export function getOpenEntry(membershipId: string) {
  return prisma.attendanceEntry.findFirst({
    where: { membershipId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
}
