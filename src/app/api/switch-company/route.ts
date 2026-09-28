import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, setActiveCompanyCookie } from "@/lib/auth";

/**
 * Switches the active-company cookie then redirects — lets a link on the
 * unified director board (which shows both companies at once) jump straight
 * into a specific company's page, even when that isn't the currently active
 * company. Every company-scoped page (approvals, attendance, etc.) reads the
 * active company from the cookie, not a URL param, so this is the one place
 * that needs to flip it first.
 */
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", request.url));

  const companyId = request.nextUrl.searchParams.get("companyId") || "";
  const nextParam = request.nextUrl.searchParams.get("next") || "/director";
  // Only ever redirect within this app — never to an absolute/external URL.
  const next = nextParam.startsWith("/") ? nextParam : "/director";

  const membership = await prisma.membership.findFirst({ where: { userId, companyId } });
  if (!membership) return NextResponse.redirect(new URL("/director", request.url));

  setActiveCompanyCookie(companyId);
  return NextResponse.redirect(new URL(next, request.url));
}
