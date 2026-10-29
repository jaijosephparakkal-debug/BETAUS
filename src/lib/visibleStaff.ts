import type { Prisma } from "@prisma/client";

export const MANAGING_DIRECTOR_EMAIL = "abraham@flaretechnical.com";

/**
 * Membership filter for staff views (calendar, KPI, profiles, counts): everyone
 * except the Managing Director. Jai is included so Abraham can see his
 * attendance, tasks and KPIs like any other team member's.
 */
export const staffWhere: Prisma.MembershipWhereInput = {
  NOT: { user: { email: { equals: MANAGING_DIRECTOR_EMAIL, mode: "insensitive" } } },
};

export function hasStaffProfile(email: string) {
  return email.toLowerCase() !== MANAGING_DIRECTOR_EMAIL;
}
