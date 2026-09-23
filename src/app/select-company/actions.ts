"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId, setActiveCompanyCookie } from "@/lib/auth";

export async function selectCompanyAction(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const companyId = String(formData.get("companyId") || "");
  const membership = await prisma.membership.findFirst({
    where: { userId, companyId },
  });
  if (!membership) redirect("/select-company");

  setActiveCompanyCookie(companyId);
  redirect("/dashboard");
}
