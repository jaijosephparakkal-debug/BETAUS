import { cookies } from "next/headers";

/** Light or dark look. A person's own choice (cookie) wins; without one, Antony keeps the light look made for him. */
export function themeIsLight(email: string): boolean {
  const c = cookies().get("ownit-theme")?.value;
  if (c === "light") return true;
  if (c === "dark") return false;
  return email.toLowerCase() === "sales@gasneeds.com";
}
