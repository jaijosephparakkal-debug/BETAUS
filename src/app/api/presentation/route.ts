import { NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/auth";
import { buildDeckData, type PeriodRange } from "@/lib/presentationData";
import { buildDeckPdf } from "@/lib/deckPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RANGES: PeriodRange[] = ["cur", "prev", "month", "prevmonth"];

/** A review deck (PDF) made from the signed-in person's own logged work. Management can ask for anyone's. */
export async function GET(req: Request) {
  const m = await getCurrentMembership();
  if (!m) return new NextResponse("Not signed in.", { status: 401 });
  const url = new URL(req.url);
  const range = (RANGES.includes(url.searchParams.get("range") as PeriodRange) ? url.searchParams.get("range") : "cur") as PeriodRange;
  const asked = url.searchParams.get("user");
  const userId = asked && m.isDirector ? asked : m.userId;

  const built = await buildDeckData(userId, m.company.slug, range);
  if (!built) return new NextResponse("No such person.", { status: 404 });
  // ?format=json shows the numbers a deck is built from, so a blank or short deck can be explained.
  if (url.searchParams.get("format") === "json") {
    const d = built.deck;
    return NextResponse.json({ period: d.periodLabel, entries: d.entries, previous: d.prevEntries, mix: d.mix.length, people: d.people.length, parties: d.parties.length, deliveries: d.deliveries.length, kpis: d.kpis.length, open: d.open.length, attendanceDaysEdited: d.attendanceEdits?.days ?? 0 });
  }
  const get = async (path: string) => {
    const r = await fetch(new URL(path, url.origin), { cache: "no-store" });
    if (!r.ok) throw new Error(`asset ${path} ${r.status}`);
    return new Uint8Array(await r.arrayBuffer());
  };
  const art = await get(built.deck.company === "gasneeds" ? "/art/gasneeds-mesh-dark.jpg" : "/art/flaretech-smoke.jpg");
  const logo = await get(built.logoPath);
  let photo: Uint8Array | undefined;
  if (built.photoPath) {
    try {
      photo = await get(built.photoPath);
    } catch {
      photo = undefined;
    }
  }
  const pdf = await buildDeckPdf(built.deck, { logo, logoIsPng: true, art, photo });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${built.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
