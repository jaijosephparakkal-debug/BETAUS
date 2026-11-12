import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";

/** Everything a review deck shows. Built from a person's own logged work (see presentationData.ts). */
export type Deck = {
  company: "gasneeds" | "flaretechnical";
  name: string;
  title: string;
  companyName: string;
  kind: "fortnight" | "month";
  periodLabel: string; // "1–14 Nov 2026"
  prevLabel: string; // "previous two weeks"
  entries: number;
  prevEntries: number;
  onTimePct: number | null;
  prevOnTimePct: number | null;
  passedOn: number;
  received: number;
  weekly: { label: string; value: number; current: boolean }[];
  mix: { label: string; count: number }[];
  days: { label: string; inH: number | null; outH: number | null; firstH: number | null; lastH: number | null; late: boolean; entries: number }[];
  cum: { cur: number[]; prev: number[] };
  people: { name: string; count: number }[];
  parties: { name: string; count: number }[];
  deliveries: { date: string; title: string; who: string }[];
  kpis: { name: string; current: number; target: number | null; unit: string | null; score: number | null }[];
  open: { due: string; title: string; overdue: boolean }[];
  handedOpen: number;
  fortnights?: { label: string; entries: number; onTime: number | null; passed: number }[];
};

export type DeckAssets = { logo: Uint8Array; logoIsPng: boolean; art: Uint8Array; photo?: Uint8Array };

const W = 960;
const H = 540;

const THEMES = {
  gasneeds: { ink: "#111217", ice: "#DFE5EB", accent: "#EF233C", hi: "#ff6b7d", chart: ["#EF233C", "#DFE5EB", "#8796a3", "#b50808", "#4a4f5c", "#c9d2da"], brand: "GASNEEDS" },
  flaretechnical: { ink: "#0A1F33", ice: "#DFE5EB", accent: "#F5881F", hi: "#F5A94F", chart: ["#F5881F", "#DFE5EB", "#1f8dcf", "#5d7f9e", "#007EC8", "#c9d2da"], brand: "FLARETECH" },
} as const;

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/** Standard PDF fonts only know Latin-1: map or drop anything else so a stray symbol can never break the file. */
const clean = (s: string) =>
  String(s ?? "")
    .replace(/[→⟶]/g, "->")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E -ÿ–—•]/g, "")
    .replace(/[–—]/g, "-");

class Slide {
  constructor(
    public page: PDFPage,
    public f: PDFFont,
    public fb: PDFFont,
    public th: (typeof THEMES)["gasneeds"] | (typeof THEMES)["flaretechnical"],
  ) {}
  path(d: string, opts: { fill?: string; fillOp?: number; stroke?: string; strokeOp?: number; sw?: number }) {
    this.page.drawSvgPath(d, {
      x: 0,
      y: H,
      color: opts.fill ? hex(opts.fill) : undefined,
      opacity: opts.fillOp ?? 1,
      borderColor: opts.stroke ? hex(opts.stroke) : undefined,
      borderOpacity: opts.strokeOp ?? 1,
      borderWidth: opts.stroke ? opts.sw ?? 1 : 0,
    });
  }
  rrect(x: number, y: number, w: number, h: number, r: number, o: { fill?: string; fillOp?: number; stroke?: string; strokeOp?: number; sw?: number }) {
    const d = `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
    this.path(d, o);
  }
  line(x1: number, y1: number, x2: number, y2: number, color: string, w = 1, op = 1) {
    this.path(`M ${x1} ${y1} L ${x2} ${y2}`, { stroke: color, strokeOp: op, sw: w });
  }
  text(s: string, x: number, y: number, o: { size?: number; bold?: boolean; color?: string; op?: number; align?: "left" | "center" | "right"; max?: number } = {}) {
    const size = o.size ?? 12;
    const font = o.bold ? this.fb : this.f;
    let t = clean(s);
    if (o.max) while (t.length > 1 && font.widthOfTextAtSize(t, size) > o.max) t = t.slice(0, -1);
    const w = font.widthOfTextAtSize(t, size);
    const px = o.align === "center" ? x - w / 2 : o.align === "right" ? x - w : x;
    this.page.drawText(t, { x: px, y: H - y - size, size, font, color: hex(o.color ?? "#ffffff"), opacity: o.op ?? 1 });
  }
  wrap(s: string, x: number, y: number, maxW: number, o: { size?: number; bold?: boolean; color?: string; op?: number; lead?: number; maxLines?: number } = {}) {
    const size = o.size ?? 12;
    const font = o.bold ? this.fb : this.f;
    const words = clean(s).split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    const lead = o.lead ?? size * 1.35;
    lines.slice(0, o.maxLines ?? 99).forEach((l, i) => this.text(l, x, y + i * lead, { ...o, size }));
    return Math.min(lines.length, o.maxLines ?? 99) * lead;
  }
  panel(x: number, y: number, w: number, h: number, r = 12) {
    this.rrect(x, y, w, h, r, { fill: "#ffffff", fillOp: 0.07, stroke: this.th.ice, strokeOp: 0.18, sw: 0.8 });
  }
}

const arc = (cx: number, cy: number, r: number, a0: number, a1: number, steps = 24) => {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts;
};

export async function buildDeckPdf(deck: Deck, assets: DeckAssets): Promise<Uint8Array> {
  const th = THEMES[deck.company];
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${deck.name} - ${deck.periodLabel}`);
  pdf.setAuthor("OWN IT");
  const f = await pdf.embedFont(StandardFonts.Helvetica);
  const fb = await pdf.embedFont(StandardFonts.HelveticaBold);
  const art = await pdf.embedJpg(assets.art);
  const logo: PDFImage = assets.logoIsPng ? await pdf.embedPng(assets.logo) : await pdf.embedJpg(assets.logo);
  const photo = assets.photo ? await pdf.embedJpg(assets.photo) : null;

  const slides: ((s: Slide, n: number, total: number) => void)[] = [];

  // The artwork covers the whole slide, anchored to the right where the pattern is densest.
  const bg = (s: Slide, opacity: number) => {
    const w = (art.width / art.height) * H;
    s.page.drawImage(art, { x: W - w, y: 0, width: w, height: H, opacity });
  };

  // ---- common chrome ----
  const chrome = (s: Slide, kicker: string, title: string, n: number, total: number) => {
    s.text(kicker.toUpperCase(), 44, 34, { size: 9, color: th.hi, bold: true });
    s.text(title, 44, 50, { size: 26, bold: true });
    s.rrect(W - 150, 26, 106, 40, 10, { fill: th.ice });
    const lw = 82;
    const lh = (logo.height / logo.width) * lw;
    const k = Math.min(1, 30 / lh);
    s.page.drawImage(logo, { x: W - 138 + (lw - lw * k) / 2, y: H - 46 - (lh * k) / 2 - 0, width: lw * k, height: lh * k });
    s.text(`OWN IT  |  ${deck.name}  |  ${deck.periodLabel}`, 44, H - 26, { size: 8.5, color: th.ice, op: 0.55 });
    s.text(`${n} / ${total}`, W - 44, H - 26, { size: 8.5, color: th.ice, op: 0.55, align: "right" });
  };

  // ---- 1. cover ----
  slides.push((s, n, total) => {
    bg(s, 1);
    s.rrect(44, 40, 130, 46, 12, { fill: th.ice });
    const lw = 100;
    const lh = (logo.height / logo.width) * lw;
    const k = Math.min(1, 34 / lh);
    s.page.drawImage(logo, { x: 59 + (lw - lw * k) / 2, y: H - 63 - (lh * k) / 2, width: lw * k, height: lh * k });
    s.text((deck.kind === "month" ? "Monthly review" : "Two-week review").toUpperCase(), 44, 150, { size: 11, bold: true, color: th.hi });
    s.text(deck.periodLabel, 44, 168, { size: 14, color: th.ice });
    s.text(deck.name, 44, 206, { size: 46, bold: true });
    s.text(deck.title, 44, 262, { size: 20, color: th.hi, bold: true });
    s.text(deck.companyName, 44, 290, { size: 13, color: th.ice, op: 0.8 });
    s.wrap(`Prepared from ${deck.entries} entries you logged in OWN IT. Figures are actual results; KPI scores are provisional until targets are set.`, 44, 336, 400, { size: 11, color: th.ice, op: 0.75 });
    if (photo) {
      const px = W - 250;
      s.rrect(px - 4, 130 - 4, 188, 188, 16, { fill: th.accent });
      s.page.drawImage(photo, { x: px, y: H - 130 - 180, width: 180, height: 180 });
    }
    s.text(`OWN IT  |  Confidential, for the review meeting`, 44, H - 26, { size: 8.5, color: th.ice, op: 0.55 });
    void n; void total;
  });

  // ---- 2. at a glance ----
  slides.push((s, n, total) => {
    bg(s, 0.3);
    chrome(s, "At a glance", "What you got done", n, total);
    const d = (a: number, b: number) => (a - b >= 0 ? `+${a - b}` : `${a - b}`);
    const tiles = [
      { l: "Entries logged", v: String(deck.entries), n: `${d(deck.entries, deck.prevEntries)} vs ${deck.prevLabel}` },
      { l: "Follow-ups on time", v: deck.onTimePct === null ? "-" : `${deck.onTimePct}%`, n: deck.prevOnTimePct === null || deck.onTimePct === null ? "no earlier figure" : `${deck.onTimePct - deck.prevOnTimePct >= 0 ? "+" : ""}${deck.onTimePct - deck.prevOnTimePct} pts vs ${deck.prevLabel}` },
      { l: "Work passed on", v: String(deck.passedOn), n: "to colleagues" },
      { l: "Work received", v: String(deck.received), n: `${deck.handedOpen} still open` },
    ];
    tiles.forEach((t, i) => {
      const x = 44 + i * 218;
      s.panel(x, 110, 206, 92);
      s.text(t.l.toUpperCase(), x + 14, 124, { size: 8.5, color: th.ice, op: 0.7, bold: true });
      s.text(t.v, x + 14, 142, { size: 34, bold: true });
      s.text(t.n, x + 14, 184, { size: 9, color: th.hi });
    });
    // bars
    s.panel(44, 220, 872, 270);
    s.text(deck.kind === "month" ? "ENTRIES PER WEEK" : "ENTRIES PER WEEK, THIS PERIOD AGAINST THE LAST", 62, 236, { size: 9, bold: true, color: th.ice, op: 0.75 });
    const max = Math.max(1, ...deck.weekly.map((b) => b.value));
    const bw = Math.min(90, 700 / Math.max(1, deck.weekly.length) - 24);
    const gap = 700 / Math.max(1, deck.weekly.length);
    deck.weekly.forEach((b, i) => {
      const bx = 110 + i * gap;
      const bh = (b.value / max) * 170;
      s.rrect(bx, 450 - bh, bw, Math.max(bh, 2), 6, { fill: b.current ? th.accent : th.ice, fillOp: b.current ? 1 : 0.35 });
      s.text(String(b.value), bx + bw / 2, 450 - bh - 17, { size: 13, bold: true, align: "center" });
      s.text(b.label, bx + bw / 2, 458, { size: 9, color: th.ice, op: 0.75, align: "center" });
    });
    s.line(90, 450, 880, 450, th.ice, 0.6, 0.3);
  });

  // ---- 3. work mix ----
  slides.push((s, n, total) => {
    bg(s, 0.3);
    chrome(s, "Work mix", "Where your time went", n, total);
    s.panel(44, 110, 400, 380);
    s.panel(460, 110, 456, 380);
    const total2 = deck.mix.reduce((a, b) => a + b.count, 0) || 1;
    const cx = 244, cy = 300, ro = 118, ri = 70;
    let a0 = -Math.PI / 2;
    deck.mix.slice(0, 6).forEach((m, i) => {
      const a1 = a0 + (m.count / total2) * Math.PI * 2;
      if (m.count > 0) {
        const outer = arc(cx, cy, ro, a0, a1);
        const inner = arc(cx, cy, ri, a1, a0);
        s.path(`M ${outer[0]} L ${outer.slice(1).join(" L ")} L ${inner.join(" L ")} Z`, { fill: th.chart[i % th.chart.length], stroke: th.ink, sw: 1.2 });
      }
      a0 = a1;
    });
    s.text(String(deck.entries), cx, cy - 18, { size: 32, bold: true, align: "center" });
    s.text("entries", cx, cy + 18, { size: 10, color: th.ice, op: 0.7, align: "center" });
    s.text("CATEGORY", 484, 128, { size: 8.5, bold: true, color: th.ice, op: 0.7 });
    s.text("ENTRIES", 760, 128, { size: 8.5, bold: true, color: th.ice, op: 0.7, align: "right" });
    s.text("SHARE", 880, 128, { size: 8.5, bold: true, color: th.ice, op: 0.7, align: "right" });
    deck.mix.slice(0, 8).forEach((m, i) => {
      const y = 152 + i * 38;
      s.rrect(484, y + 3, 10, 10, 2, { fill: th.chart[i % th.chart.length] });
      s.text(m.label, 502, y, { size: 12.5, max: 230 });
      s.text(String(m.count), 760, y, { size: 12.5, bold: true, align: "right" });
      s.text(`${Math.round((m.count / total2) * 100)}%`, 880, y, { size: 12.5, color: th.hi, bold: true, align: "right" });
      s.line(484, y + 26, 892, y + 26, th.ice, 0.5, 0.15);
    });
    if (deck.mix.length === 0) s.text("No logged entries in this period.", 484, 160, { size: 13, color: th.ice, op: 0.7 });
  });

  // ---- 4. daily rhythm (candles) ----
  slides.push((s, n, total) => {
    bg(s, 0.3);
    chrome(s, "Daily rhythm", "Your working day, each day", n, total);
    s.panel(44, 110, 872, 330);
    const top = 140, bottom = 410, h0 = 7, h1 = 19;
    const yH = (h: number) => top + ((h - h0) / (h1 - h0)) * (bottom - top);
    [8, 10, 12, 14, 16, 18].forEach((h) => {
      s.line(96, yH(h), 896, yH(h), th.ice, 0.5, 0.15);
      s.text(`${h}:00`, 62, yH(h) - 5, { size: 8.5, color: th.ice, op: 0.6 });
    });
    const n2 = Math.max(1, deck.days.length);
    const slot = 800 / n2;
    deck.days.forEach((dd, i) => {
      const x = 100 + i * slot + slot / 2;
      const col = dd.late ? th.accent : th.ice;
      if (dd.firstH !== null && dd.lastH !== null) s.line(x, yH(Math.max(h0, dd.firstH)), x, yH(Math.min(h1, dd.lastH)), col, 1.6);
      if (dd.inH !== null && dd.outH !== null) {
        const bh = Math.max(4, yH(Math.min(h1, dd.outH)) - yH(Math.max(h0, dd.inH)));
        s.rrect(x - Math.min(9, slot / 3), yH(Math.max(h0, dd.inH)), Math.min(18, slot * 0.66), bh, 3, { fill: col, fillOp: 0.55, stroke: col, sw: 1 });
      }
      s.text(dd.label, x, 418, { size: 7.5, color: th.ice, op: 0.65, align: "center" });
    });
    const present = deck.days.filter((d) => d.inH !== null);
    const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const fmt = (h: number | null) => (h === null ? "-" : `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`);
    s.text(`Days present: ${present.length}   |   Average clock-in: ${fmt(avg(present.map((d) => d.inH as number)))}   |   Average clock-out: ${fmt(avg(present.filter((d) => d.outH !== null).map((d) => d.outH as number)))}   |   Late starts: ${deck.days.filter((d) => d.late).length}`, 44, 452, { size: 10.5, color: th.ice });
    s.text("Body = clock-in to clock-out. Line = first to last entry logged. Accent colour = late start.", 44, 472, { size: 9, color: th.ice, op: 0.6 });
  });

  // ---- 5. trajectory ----
  slides.push((s, n, total) => {
    bg(s, 0.3);
    chrome(s, "Trajectory", "Are you moving up?", n, total);
    s.panel(44, 110, 872, 380);
    const maxV = Math.max(1, ...deck.cum.cur, ...deck.cum.prev);
    const x0 = 96, x1 = 880, y0 = 150, y1 = 440;
    [0, 0.25, 0.5, 0.75, 1].forEach((g) => {
      const y = y1 - g * (y1 - y0);
      s.line(x0, y, x1, y, th.ice, 0.5, 0.15);
      s.text(String(Math.round(g * maxV)), 62, y - 5, { size: 8.5, color: th.ice, op: 0.6 });
    });
    const pts = (arr: number[], len: number) => arr.map((v, i) => `${(x0 + (i / Math.max(1, len - 1)) * (x1 - x0)).toFixed(1)} ${(y1 - (v / maxV) * (y1 - y0)).toFixed(1)}`);
    const len = Math.max(deck.cum.cur.length, deck.cum.prev.length);
    if (deck.cum.prev.length > 1) s.path(`M ${pts(deck.cum.prev, len).join(" L ")}`, { stroke: th.ice, strokeOp: 0.5, sw: 2 });
    if (deck.cum.cur.length > 1) s.path(`M ${pts(deck.cum.cur, len).join(" L ")}`, { stroke: th.accent, sw: 3.5 });
    const last = pts(deck.cum.cur, len).slice(-1)[0];
    if (last) {
      const [lx, ly] = last.split(" ").map(Number);
      s.path(`M ${lx - 5} ${ly} a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 Z`, { fill: th.accent });
    }
    s.text(`This period: ${deck.cum.cur.slice(-1)[0] ?? 0} entries`, 100, 124, { size: 11, bold: true, color: th.hi });
    s.text(`Before: ${deck.cum.prev.slice(-1)[0] ?? 0} entries (${deck.prevLabel})`, 330, 124, { size: 11, color: th.ice, op: 0.8 });
    s.text("Cumulative entries by day. A steeper line means more work logged earlier.", 62, 456, { size: 9, color: th.ice, op: 0.6 });
  });

  // ---- 6. people ----
  slides.push((s, n, total) => {
    bg(s, 0.3);
    chrome(s, "People and partners", "Who you worked with", n, total);
    const col = (x: number, title: string, rows: { name: string; count: number }[], empty: string) => {
      s.panel(x, 110, 424, 380);
      s.text(title.toUpperCase(), x + 18, 126, { size: 9, bold: true, color: th.ice, op: 0.75 });
      const max = Math.max(1, ...rows.map((r) => r.count));
      rows.slice(0, 7).forEach((r, i) => {
        const y = 156 + i * 44;
        s.text(r.name, x + 18, y, { size: 12.5, max: 250 });
        s.rrect(x + 18, y + 20, 300, 6, 3, { fill: th.ice, fillOp: 0.15 });
        s.rrect(x + 18, y + 20, Math.max(6, (r.count / max) * 300), 6, 3, { fill: th.accent });
        s.text(String(r.count), x + 400, y, { size: 13, bold: true, align: "right" });
      });
      if (rows.length === 0) s.text(empty, x + 18, 160, { size: 12, color: th.ice, op: 0.7 });
    };
    col(44, "Passed to and received from", deck.people, "No hand-overs in this period.");
    col(492, "Customers, suppliers and projects", deck.parties, "No named customers or projects in this period.");
  });

  // ---- 7. key deliveries ----
  slides.push((s, n, total) => {
    bg(s, 0.3);
    chrome(s, "Key deliveries", "What you delivered", n, total);
    s.panel(44, 110, 872, 380);
    s.text("DATE", 64, 126, { size: 8.5, bold: true, color: th.ice, op: 0.7 });
    s.text("WHAT", 140, 126, { size: 8.5, bold: true, color: th.ice, op: 0.7 });
    s.text("FOR", 640, 126, { size: 8.5, bold: true, color: th.ice, op: 0.7 });
    deck.deliveries.slice(0, 9).forEach((d, i) => {
      const y = 150 + i * 37;
      s.text(d.date, 64, y, { size: 11, color: th.hi, bold: true });
      s.text(d.title, 140, y, { size: 11.5, max: 480 });
      s.text(d.who, 640, y, { size: 11, color: th.ice, op: 0.85, max: 250 });
      s.line(64, y + 24, 896, y + 24, th.ice, 0.5, 0.13);
    });
    if (deck.deliveries.length === 0) s.text("No entries in this period.", 64, 154, { size: 12, color: th.ice, op: 0.7 });
  });

  // ---- 8. KPI snapshot ----
  slides.push((s, n, total) => {
    bg(s, 0.3);
    chrome(s, "KPI snapshot", "Your KPIs right now (actual figures)", n, total);
    s.panel(44, 110, 872, 380);
    s.text("KPI", 64, 126, { size: 8.5, bold: true, color: th.ice, op: 0.7 });
    s.text("ACTUAL", 560, 126, { size: 8.5, bold: true, color: th.ice, op: 0.7, align: "right" });
    s.text("TARGET", 650, 126, { size: 8.5, bold: true, color: th.ice, op: 0.7, align: "right" });
    s.text("SCORE", 896, 126, { size: 8.5, bold: true, color: th.ice, op: 0.7, align: "right" });
    deck.kpis.slice(0, 9).forEach((k, i) => {
      const y = 150 + i * 37;
      s.text(k.name, 64, y, { size: 11.5, max: 440 });
      s.text(`${k.current}${k.unit ? ` ${k.unit}` : ""}`, 560, y, { size: 11.5, bold: true, align: "right" });
      if (k.target !== null) s.text(`${k.target}${k.unit ? ` ${k.unit}` : ""}`, 650, y, { size: 11.5, color: th.ice, op: 0.8, align: "right" });
      if (k.score !== null) {
        s.rrect(690, y + 4, 150, 7, 3.5, { fill: th.ice, fillOp: 0.15 });
        s.rrect(690, y + 4, Math.max(5, (Math.min(100, k.score) / 100) * 150), 7, 3.5, { fill: th.accent });
        s.text(`${k.score}`, 896, y, { size: 12, bold: true, align: "right" });
      }
      s.line(64, y + 24, 896, y + 24, th.ice, 0.5, 0.13);
    });
    if (deck.kpis.length === 0) s.text("No KPIs are set up for you yet.", 64, 154, { size: 12, color: th.ice, op: 0.7 });
    s.text("No targets are set yet. Until January these show what you actually do; only percentage rates (such as on-time updates) carry a score.", 64, 470, { size: 9, color: th.hi });
  });

  // ---- month only: fortnight comparison ----
  if (deck.kind === "month" && deck.fortnights) {
    slides.push((s, n, total) => {
      bg(s, 0.3);
      chrome(s, "Month in two halves", "First fortnight against second", n, total);
      deck.fortnights!.forEach((fn, i) => {
        const x = 44 + i * 440;
        s.panel(x, 110, 432, 300);
        s.text(fn.label.toUpperCase(), x + 20, 128, { size: 9.5, bold: true, color: th.hi });
        [["Entries logged", String(fn.entries)], ["Follow-ups on time", fn.onTime === null ? "-" : `${fn.onTime}%`], ["Work passed on", String(fn.passed)]].forEach((r, k) => {
          const y = 168 + k * 70;
          s.text(r[0].toUpperCase(), x + 20, y, { size: 8.5, color: th.ice, op: 0.7, bold: true });
          s.text(r[1], x + 20, y + 16, { size: 30, bold: true });
        });
      });
      const [a, b] = deck.fortnights!;
      const diff = b.entries - a.entries;
      s.panel(44, 426, 872, 64);
      s.text(diff >= 0 ? `The second half was busier: ${diff} more entries than the first.` : `The first half was busier: ${-diff} more entries than the second.`, 64, 448, { size: 13, bold: true, color: th.hi });
    });
  }

  // ---- open items ----
  slides.push((s, n, total) => {
    bg(s, 0.3);
    chrome(s, "Next", "Carried into the next period", n, total);
    s.panel(44, 110, 560, 380);
    s.text("OPEN FOLLOW-UPS", 64, 126, { size: 9, bold: true, color: th.ice, op: 0.75 });
    deck.open.slice(0, 9).forEach((o, i) => {
      const y = 152 + i * 36;
      s.rrect(64, y + 3, 9, 9, 4.5, { fill: o.overdue ? th.accent : th.ice });
      s.text(o.title, 84, y, { size: 11.5, max: 380 });
      s.text(o.overdue ? `Overdue ${o.due}` : o.due, 586, y, { size: 10, bold: true, color: o.overdue ? th.hi : th.ice, align: "right" });
    });
    if (deck.open.length === 0) s.text("Nothing open. You are all caught up.", 64, 154, { size: 12, color: th.ice, op: 0.8 });
    s.panel(620, 110, 296, 380);
    s.text("SUGGESTED FOCUS", 640, 126, { size: 9, bold: true, color: th.ice, op: 0.75 });
    const overdue = deck.open.filter((o) => o.overdue).length;
    const tips = [
      overdue > 0 ? `Close the ${overdue} overdue follow-up${overdue === 1 ? "" : "s"} first.` : "No overdue follow-ups. Keep it that way.",
      deck.handedOpen > 0 ? `${deck.handedOpen} piece${deck.handedOpen === 1 ? "" : "s"} of work handed to you still open.` : "Nothing handed to you is waiting.",
      deck.days.some((d) => d.late) ? "Aim to start on time: some days began late." : "Starts were on time. Good rhythm.",
      "Log work the same day so the numbers stay true.",
    ];
    let y = 154;
    tips.forEach((t) => {
      s.rrect(640, y + 4, 6, 6, 3, { fill: th.accent });
      y += s.wrap(t, 656, y, 244, { size: 11.5 }) + 14;
    });
  });

  const total = slides.length;
  slides.forEach((fn, i) => {
    const page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: hex(th.ink) });
    fn(new Slide(page, f, fb, th), i + 1, total);
  });
  return pdf.save();
}
