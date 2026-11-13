import { NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Product names for the type-ahead (signed-in staff only). */
export async function GET() {
  const m = await getCurrentMembership();
  if (!m) return new NextResponse("Not signed in.", { status: 401 });
  try {
    return NextResponse.json(await getCatalog(), { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch {
    return NextResponse.json([]);
  }
}
