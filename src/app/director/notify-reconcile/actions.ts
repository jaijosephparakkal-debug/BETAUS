"use server";

import { prisma } from "@/lib/db";
import { getCurrentMembership } from "@/lib/auth";
import { sendReportEmail, sendGroupEmail } from "@/lib/mailer";
import { RECONCILE_WINDOW } from "@/lib/reconcile";
import { sendExtendedWindowNotice } from "@/lib/reconcileNotice";

const EXCLUDED_EMAILS = ["abraham@flaretechnical.com", "alerts@flaretechnical.com"];

export async function getRecipients() {
  const users = await prisma.user.findMany({
    where: { memberships: { some: {} }, email: { notIn: EXCLUDED_EMAILS } },
    orderBy: { name: "asc" },
  });
  return users.map((u) => ({ name: u.name, email: u.email }));
}

export async function sendReconcileNoticeAction(): Promise<{ error?: string; sent?: number; failed?: string[] }> {
  const me = await getCurrentMembership();
  if (!me) return { error: "Not signed in." };
  if (!me.isDirector) return { error: "Only a director can send this." };

  const recipients = await getRecipients();
  const subject = `Attendance reconciliation is open until ${RECONCILE_WINDOW.endLabel} today`;
  const failed: string[] = [];
  let sent = 0;
  for (const r of recipients) {
    const html = `
      <p>Hi ${r.name.split(" ")[0]},</p>
      <p>The attendance reconciliation window is open today until <strong>${RECONCILE_WINDOW.endLabel}</strong> — about half an hour from now.</p>
      <p>If you'd like to, you can reconcile your attendance: open the app, tap <strong>Reconcile my attendance</strong>, and correct a login or logout time or add a shift you missed, with a short reason. This is for your attendance only.</p>
      <p>Changes made in the window are recorded as manual corrections.</p>
      <p>— OWN IT</p>`;
    const ok = await sendReportEmail(r.email, subject, html);
    if (ok) sent++;
    else failed.push(r.email);
    await new Promise((res) => setTimeout(res, 600));
  }
  return { sent, failed };
}

export async function sendFlexieReminderAction(): Promise<{ error?: string; sent?: number }> {
  const me = await getCurrentMembership();
  if (!me) return { error: "Not signed in." };
  if (!me.isDirector) return { error: "Only a director can send this." };
  const r = await sendExtendedWindowNotice(["alerts@flaretechnical.com"]);
  return r.sent ? { sent: r.sent } : { error: "The email could not be sent." };
}

// ---- October attendance + window notice (one email per person, own PDF attached) ----
import { getMonthAttendance, generateAttendanceMonthPdf } from "@/lib/attendanceMonthPdf";

const OCT_EXCLUDED = ["abraham@flaretechnical.com", "maintenance@flaretechnical.com"];

export async function getOctoberRecipients() {
  const users = await prisma.user.findMany({
    where: { memberships: { some: {} }, email: { notIn: OCT_EXCLUDED } },
    orderBy: { name: "asc" },
  });
  return users.map((u) => ({ name: u.name, email: u.email }));
}

export async function sendOctoberAttendanceAction(email: string): Promise<{ ok?: boolean; error?: string }> {
  const me = await getCurrentMembership();
  if (!me) return { error: "Not signed in." };
  if (!me.isDirector) return { error: "Only a director can send this." };
  if (OCT_EXCLUDED.includes(email.toLowerCase())) return { error: "Not a recipient." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Person not found." };
  const data = await getMonthAttendance(user.id, 2026, 10);
  if (!data) return { error: "No membership." };

  const pdf = await generateAttendanceMonthPdf(data);
  const first = user.name.split(" ")[0];
  const html = `
    <p>Hi ${first},</p>
    <p>The attendance reconciliation window is open today until <strong>${RECONCILE_WINDOW.endLabel}</strong>.</p>
    <p>Your October attendance (1–29 Oct) is attached: your first login and last logout for each day, with any day that has no login marked. Please check it. If a time is missing or wrong, open the app, tap <strong>Reconcile my attendance</strong>, and correct a login or logout time or add a missed shift, with a short reason.</p>
    <p>Corrections made in the window are recorded as “Corrected manually”.</p>
    <p>— OWN IT</p>`;
  const ok = await sendReportEmail(
    user.email,
    `Your October attendance — reconciliation open until ${RECONCILE_WINDOW.endLabel} today`,
    html,
    { filename: `October attendance - ${user.name}.pdf`, content: pdf }
  );
  return ok ? { ok: true } : { error: "The email could not be sent." };
}

// ---- One common email to all staff: the whole calendar plus who still has days to fix ----
import { getMonthCalendar, isWorkingDay, keyOf } from "@/lib/attendanceCalendar";
import { dubaiDateKey } from "@/lib/attendance";
import { generateAllStaffCalendarPdf } from "@/lib/attendanceGridPdf";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabel = (key: string) => `${Number(key.slice(8))} ${MONTHS[Number(key.slice(5, 7)) - 1]}`;

export async function getCommonEmailPlan() {
  const users = await prisma.user.findMany({
    where: { memberships: { some: {} }, email: { notIn: OCT_EXCLUDED } },
    orderBy: { name: "asc" },
  });
  const ids = users.map((u) => u.id);
  const calendar = (await getMonthCalendar(2026, 10)).filter((p) => ids.includes(p.userId));
  const today = dubaiDateKey(new Date());
  const people: { name: string; absent: string[]; noLogout: string[] }[] = [];
  for (const p of calendar) {
    const absent: string[] = [];
    const noLogout: string[] = [];
    for (let d = 1; d <= 31; d++) {
      const k = keyOf(2026, 10, d);
      if (k >= today || !isWorkingDay(k) || k < p.joined) continue;
      const rec = p.days.get(k);
      if (!rec) {
        if (!p.leave.has(k)) absent.push(k);
      } else if (rec.last === "not recorded") noLogout.push(k);
    }
    if (absent.length || noLogout.length) people.push({ name: p.name, absent: absent.map(dayLabel), noLogout: noLogout.map(dayLabel) });
  }
  return { people, userIds: ids, recipients: users.map((u) => u.email) };
}

export async function sendCommonEmailAction(): Promise<{ ok?: boolean; error?: string; sent?: number }> {
  const me = await getCurrentMembership();
  if (!me) return { error: "Not signed in." };
  if (!me.isDirector) return { error: "Only a director can send this." };
  const plan = await getCommonEmailPlan();
  if (plan.people.length === 0) return { error: "Nobody has days outstanding." };
  const pdf = await generateAllStaffCalendarPdf(2026, 10, plan.userIds);
  const rows = plan.people
    .map((p) => {
      const parts = [];
      if (p.absent.length) parts.push(`absent: ${p.absent.join(", ")}`);
      if (p.noLogout.length) parts.push(`no logout recorded: ${p.noLogout.join(", ")}`);
      return `<li><strong>${p.name}</strong> — ${parts.join("; ")}</li>`;
    })
    .join("");
  const html = `
    <p>Hi all,</p>
    <p>Despite our repeated emails and reminders, the attendance reconciliation has not been given enough attention. Only the staff who made their corrections properly have managed to complete it.</p>
    <p>The full October attendance calendar for everyone is attached. These are the days still showing as absent or without a logout:</p>
    <ul>${rows}</ul>
    <p>Please fix them now. The reconciliation window is open for everyone until <strong>${RECONCILE_WINDOW.endLabel} today</strong>. Open the app, tap <strong>Reconcile my attendance</strong>, and correct or add each day with a short reason. If you were on leave, say so in the reason.</p>
    <p>Corrections made in the window are recorded as “Corrected manually”. After the window closes the days stay as recorded.</p>
    <p>— OWN IT</p>`;
  const ok = await sendGroupEmail(
    plan.recipients,
    `Attendance calendar — please fix your absent days (window open until ${RECONCILE_WINDOW.endLabel} today)`,
    html,
    { filename: "October attendance calendar.pdf", content: pdf }
  );
  return ok ? { ok: true, sent: plan.recipients.length } : { error: "The email could not be sent." };
}
