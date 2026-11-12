"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setThemeAction(mode: "light" | "dark") {
  cookies().set("ownit-theme", mode === "light" ? "light" : "dark", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
