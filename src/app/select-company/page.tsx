import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getCompanyTheme } from "@/lib/theme";
import { selectCompanyAction } from "./actions";

export default async function SelectCompanyPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { company: true, user: true },
  });

  if (memberships.length === 0) redirect("/login");
  if (memberships.length === 1) redirect("/dashboard");

  const { user, title } = memberships[0];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">
        WELCOME!
      </h1>
      <p className="mt-1 text-base text-slate-900">
        Mr. {user.name}{" "}
        <span className="text-sm italic text-slate-500">
          ({title.toUpperCase()})
        </span>
      </p>

      <div className="mt-10 flex items-center gap-10">
        {memberships.map((m) => {
          const theme = getCompanyTheme(m.company.slug);
          return (
            <form action={selectCompanyAction} key={m.id}>
              <input type="hidden" name="companyId" value={m.companyId} />
              <button
                className="rounded-xl border border-amber-300 bg-amber-400/40 p-6 shadow-sm transition hover:border-amber-200 hover:shadow-md"
                aria-label={m.company.name}
              >
                <Image
                  src={theme.logo}
                  alt={theme.displayName}
                  width={theme.logoWidth}
                  height={theme.logoHeight}
                  className="h-20 w-auto"
                />
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
