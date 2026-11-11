"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getRealMembership, canManageAllStaff, VIEW_AS_COOKIE } from "@/lib/auth";

/** Opens the app as another person, read-only, for an hour. Abraham and Jai only; never another director. */
export async function startViewAsAction(membershipId: string, formData: FormData): Promise<void> {
  void formData;
  const real = await getRealMembership();
  if (!real || !real.isDirector || !canManageAllStaff(real)) return;
  const target = await prisma.membership.findUnique({ where: { id: membershipId }, include: { user: true } });
  if (!target || target.isDirector || target.userId === real.userId) return;
  console.log(`[view-as] ${real.user.email} opened the app as ${target.user.email}`);
  cookies().set(VIEW_AS_COOKIE, target.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  redirect("/dashboard");
}

export async function exitViewAsAction(): Promise<void> {
  cookies().delete(VIEW_AS_COOKIE);
  redirect("/director/staff");
}
