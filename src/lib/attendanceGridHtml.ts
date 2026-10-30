import { getMonthCalendar, daysInMonth, keyOf, isHoliday, isWorkingDay, monthLabel } from "@/lib/attendanceCalendar";
import { dubaiDateKey } from "@/lib/attendance";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Email-safe HTML table of the whole month: first login over last logout, late logins in amber, A = absent, AL = annual leave, H = holiday. */
export async function renderCalendarHtml(year: number, month: number, userIds: string[]): Promise<string> {
  const people = (await getMonthCalendar(year, month)).filter((p) => userIds.includes(p.userId));
  const todayKey = dubaiDateKey(new Date());
  const n = daysInMonth(year, month);
  const th = "padding:3px 2px;border:1px solid #fff;background:#111827;color:#fff;font:600 10px Arial,sans-serif;text-align:center;min-width:34px";
  const head =
    `<tr><th style="${th};text-align:left;padding:4px 8px;min-width:130px">Staff</th>` +
    Array.from({ length: n }, (_, i) => {
      const k = keyOf(year, month, i + 1);
      const dow = new Date(`${k}T00:00:00Z`).getUTCDay();
      return `<th style="${th}${dow === 0 || dow === 6 ? ";background:#374151" : ""}">${i + 1}<br><span style="font-weight:400;font-size:8px">${"SMTWTFS"[dow]}</span></th>`;
    }).join("") +
    `</tr>`;
  const body = people
    .map((p) => {
      const cells = Array.from({ length: n }, (_, i) => {
        const k = keyOf(year, month, i + 1);
        const rec = p.days.get(k);
        let bg = "#ffffff", fg = "#475569", txt = "";
        if (rec) {
          bg = rec.late ? "#fde68a" : "#bbf7d0";
          fg = rec.late ? "#92400e" : "#166534";
          txt = `${rec.first}<br>${rec.last === "still in" ? "in" : rec.last === "not recorded" ? "—" : rec.last}`;
        } else if (p.leave.has(k)) { bg = "#bae6fd"; fg = "#0369a1"; txt = "AL"; }
        else if (isHoliday(k)) { bg = "#f1f5f9"; fg = "#94a3b8"; txt = "H"; }
        else if (isWorkingDay(k) && k >= p.joined && k < todayKey) { bg = "#ef4444"; fg = "#ffffff"; txt = "A"; }
        return `<td style="padding:3px 1px;border:1px solid #fff;background:${bg};color:${fg};font:10px Arial,sans-serif;text-align:center;line-height:1.25">${txt}</td>`;
      }).join("");
      return `<tr><td style="padding:4px 8px;border:1px solid #e5e7eb;font:600 11px Arial,sans-serif;white-space:nowrap">${esc(p.name)}<br><span style="font-weight:400;font-size:9px;color:#64748b">${esc(p.title)}</span></td>${cells}</tr>`;
    })
    .join("");
  return `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse">${head}${body}</table>
    <p style="font:12px Arial,sans-serif;color:#475569">Top time = first login, bottom time = last logout (Dubai). <span style="background:#bbf7d0;padding:0 4px">green</span> on time, <span style="background:#fde68a;padding:0 4px">amber</span> first login after 8:15 AM (9:15 on Saturdays), <span style="background:#ef4444;color:#fff;padding:0 4px">A</span> absent, <span style="background:#bae6fd;padding:0 4px">AL</span> annual leave, <span style="background:#f1f5f9;padding:0 4px">H</span> holiday, — no logout recorded.</p>
    <p style="font:12px Arial,sans-serif;color:#475569">${monthLabel(year, month)}</p>`;
}
