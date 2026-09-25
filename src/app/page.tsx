import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId, getMembershipCount } from "@/lib/auth";
import { getCompanyTheme } from "@/lib/theme";

export default async function Home() {
  const userId = await getSessionUserId();
  if (userId) {
    const count = await getMembershipCount();
    redirect(count > 1 ? "/select-company" : "/dashboard");
  }

  const flaretech = getCompanyTheme("flaretechnical");
  const gasneeds = getCompanyTheme("gasneeds");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
        Welcome!
      </h1>

      <div className="mt-12 flex items-center justify-center gap-6">
        <Link
          href="/login?company=flaretechnical"
          className="rounded-xl border border-amber-300 bg-amber-400/40 p-6 shadow-sm transition hover:border-amber-200 hover:shadow-md"
          aria-label={flaretech.displayName}
        >
          <Image
            src={flaretech.logo}
            alt={flaretech.displayName}
            width={flaretech.logoWidth}
            height={flaretech.logoHeight}
            className="h-16 w-auto sm:h-24"
          />
        </Link>
        <Link
          href="/login?company=gasneeds"
          className="rounded-xl border border-amber-300 bg-amber-400/40 p-6 shadow-sm transition hover:border-amber-200 hover:shadow-md"
          aria-label={gasneeds.displayName}
        >
          <Image
            src={gasneeds.logo}
            alt={gasneeds.displayName}
            width={gasneeds.logoWidth}
            height={gasneeds.logoHeight}
            className="h-16 w-auto sm:h-24"
          />
        </Link>
      </div>
    </div>
  );
}
