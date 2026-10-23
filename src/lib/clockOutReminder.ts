import { prisma } from "@/lib/db";
import { DUBAI_OFFSET_MS, OFFICE_END, dubaiDateKey, formatDubaiTime } from "@/lib/attendance";
import { scheduleEmail, cancelScheduledEmail } from "@/lib/mailer";

// "Clock out" reminder: everyone signed in to OWN IT gets an email 15
// minutes before the shift ends (OFFICE_END, 5 PM Dubai). It's scheduled
// with Resend when they clock in — exact to the minute, unlike Vercel Hobby
// cron (which only promises "within the hour") — and cancelled if they sign
// out first. Directors don't get it.
const MINUTES_BEFORE = 15;

/** Today's (Dubai) reminder moment, e.g. 4:45 PM. */
function reminderAt(now: Date) {
  const [y, m, d] = dubaiDateKey(now).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, OFFICE_END.hour, OFFICE_END.minute - MINUTES_BEFORE) - DUBAI_OFFSET_MS);
}

function shiftEndLabel(now: Date) {
  return formatDubaiTime(new Date(reminderAt(now).getTime() + MINUTES_BEFORE * 60000));
}

/**
 * Makes sure this open entry has today's reminder scheduled (once per day —
 * also covers a shift left open from an earlier day). Never throws, so a
 * Resend hiccup can't block anyone from loading the app.
 */
export async function ensureClockOutReminder(entry: { id: string; membershipId: string; reminderDay: string | null }) {
  try {
    const now = new Date();
    const today = dubaiDateKey(now);
    if (entry.reminderDay === today) return;
    const at = reminderAt(now);
    if (now.getTime() > at.getTime() - 60000) return; // too late to remind today

    const membership = await prisma.membership.findUnique({
      where: { id: entry.membershipId },
      include: { user: true },
    });
    if (!membership || membership.isDirector) return;

    // Claim today's reminder first so two pages loading at once can't both schedule one.
    const claimed = await prisma.attendanceEntry.updateMany({
      where: { id: entry.id, OR: [{ reminderDay: null }, { reminderDay: { not: today } }] },
      data: { reminderDay: today, reminderEmailId: null },
    });
    if (claimed.count === 0) return;

    const end = shiftEndLabel(now);
    const html = `
      <p>Hi ${membership.user.name.split(" ")[0]},</p>
      <p>Your shift ends at <strong>${end}</strong> — in 15 minutes.</p>
      <p>Before you leave, please <strong>clock out of OWN IT</strong>: tap the clock at the top of the app, choose <strong>Shift ended</strong>, then <strong>Confirm sign out</strong>.</p>
      <p>If you've already signed out, you can ignore this.</p>
      <p>— OWN IT</p>`;
    const id = await scheduleEmail(membership.user.email, `Reminder: clock out — your shift ends at ${end}`, html, at);
    if (id) await prisma.attendanceEntry.update({ where: { id: entry.id }, data: { reminderEmailId: id } });
  } catch (e) {
    console.error("[team-portal] clock-out reminder:", e);
  }
}

/** Cancels this entry's reminder if it hasn't gone out yet (they signed out early). Never throws. */
export async function cancelClockOutReminder(entry: { reminderDay: string | null; reminderEmailId: string | null }) {
  try {
    if (!entry.reminderEmailId) return;
    const now = new Date();
    if (entry.reminderDay !== dubaiDateKey(now) || now >= reminderAt(now)) return; // already sent
    await cancelScheduledEmail(entry.reminderEmailId);
  } catch (e) {
    console.error("[team-portal] cancel clock-out reminder:", e);
  }
}
