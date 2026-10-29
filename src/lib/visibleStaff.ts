import type { Prisma } from "@prisma/client";

export const MANAGING_DIRECTOR_EMAIL = "abraham@flaretechnical.com";
// Jai is listed under Gasneeds only; his Flaretech membership stays (access) but is not shown or counted.
const HOME_ONLY_EMAIL = "jai@gasneeds.com";
const HIDDEN_FROM_SLUG = "flaretechnical";

/**
 * Membership filter for staff views (calendar, KPI, profiles, counts): everyone
 * except the Managing Director. Jai is included so Abraham can see his
 * attendance, tasks and KPIs like any other team member's.
 */
export const staffWhere: Prisma.MembershipWhereInput = {
  NOT: [
    { user: { email: { equals: MANAGING_DIRECTOR_EMAIL, mode: "insensitive" } } },
    { company: { slug: HIDDEN_FROM_SLUG }, user: { email: { equals: HOME_ONLY_EMAIL, mode: "insensitive" } } },
  ],
};

/** False for a membership that is kept but not shown in that company's counts and chart. */
export function shownInCompany(email: string, companySlug: string) {
  return !(companySlug === HIDDEN_FROM_SLUG && email.toLowerCase() === HOME_ONLY_EMAIL);
}

export function hasStaffProfile(email: string) {
  return email.toLowerCase() !== MANAGING_DIRECTOR_EMAIL;
}
