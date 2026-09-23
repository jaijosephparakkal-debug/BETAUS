import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import type { Membership } from "@prisma/client";

const SESSION_COOKIE = "session";
const COMPANY_COOKIE = "activeCompany";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-me"
);

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  cookies().delete(SESSION_COOKIE);
  cookies().delete(COMPANY_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.userId as string) ?? null;
  } catch {
    return null;
  }
}

export function setActiveCompanyCookie(companyId: string) {
  cookies().set(COMPANY_COOKIE, companyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function getActiveCompanyId(): string | null {
  return cookies().get(COMPANY_COOKIE)?.value ?? null;
}

export type FullMembership = Membership & {
  user: { id: string; name: string; email: string; signature: string | null };
  company: { id: string; name: string; slug: string };
  manager: Membership | null;
};

/** Resolves the signed-in user's active membership (their role at the currently-selected company). */
export async function getCurrentMembership(): Promise<FullMembership | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { user: true, company: true, manager: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) return null;

  const activeCompanyId = getActiveCompanyId();
  const active =
    memberships.find((m) => m.companyId === activeCompanyId) ?? memberships[0];

  if (!activeCompanyId || activeCompanyId !== active.companyId) {
    setActiveCompanyCookie(active.companyId);
  }

  return active as FullMembership;
}

export async function getMembershipCount(): Promise<number> {
  const userId = await getSessionUserId();
  if (!userId) return 0;
  return prisma.membership.count({ where: { userId } });
}

/** Returns true if `managerMembershipId` manages `targetMembershipId`, directly or transitively. */
export async function isManagerOf(
  managerMembershipId: string,
  targetMembershipId: string
): Promise<boolean> {
  let current = await prisma.membership.findUnique({
    where: { id: targetMembershipId },
    select: { managerId: true },
  });
  const seen = new Set<string>();
  while (current?.managerId) {
    if (current.managerId === managerMembershipId) return true;
    if (seen.has(current.managerId)) break; // guard against bad data cycles
    seen.add(current.managerId);
    current = await prisma.membership.findUnique({
      where: { id: current.managerId },
      select: { managerId: true },
    });
  }
  return false;
}

/** All membership ids in `rootId`'s reporting tree (not including rootId itself). */
export async function getReportTreeIds(rootId: string): Promise<string[]> {
  const result: string[] = [];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const reports = await prisma.membership.findMany({
      where: { managerId: { in: frontier } },
      select: { id: true },
    });
    const ids = reports.map((r) => r.id);
    result.push(...ids);
    frontier = ids;
  }
  return result;
}
