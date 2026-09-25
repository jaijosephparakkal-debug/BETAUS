import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId, getMembershipCount } from "@/lib/auth";
import { getCompanyTheme } from "@/lib/theme";

const FEATURES = [
  {
    title: "Task tracking",
    body: "Every task has deadlines and a progress slider — update it and the comment is saved to a timeline automatically.",
  },
  {
    title: "KPIs",
    body: "See target vs. current for every role, from store dispatch accuracy to campaigns shipped this quarter.",
  },
  {
    title: "Manager view",
    body: "Anyone with direct reports gets a My Team page — their reports' tasks, KPIs and timelines in one place.",
  },
  {
    title: "Director dashboard",
    body: "Company-wide completion rate, overdue tasks, average KPI achievement, and the full org chart.",
  },
];

export default async function Home() {
  const userId = await getSessionUserId();
  if (userId) {
    const count = await getMembershipCount();
    redirect(count > 1 ? "/select-company" : "/dashboard");
  }

  const flaretech = getCompanyTheme("flaretechnical");
  const gasneeds = getCompanyTheme("gasneeds");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold text-slate-900">Team Portal</span>
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16 text-center sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Welcome!
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            One portal for Flare Technical &amp; Gas Needs — track tasks, log
            progress, and see KPIs in real time, for employees, managers, and
            the director alike.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Sign in with your work email
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            No password needed — we&apos;ll email you a 6-digit code.
          </p>

          <div className="mt-12 flex items-center justify-center gap-6">
            <div className="rounded-xl border border-amber-300 bg-amber-400/40 p-6 shadow-sm">
              <Image
                src={flaretech.logo}
                alt={flaretech.displayName}
                width={flaretech.logoWidth}
                height={flaretech.logoHeight}
                className="h-16 w-auto"
              />
            </div>
            <div className="rounded-xl border border-amber-300 bg-amber-400/40 p-6 shadow-sm">
              <Image
                src={gasneeds.logo}
                alt={gasneeds.displayName}
                width={gasneeds.logoWidth}
                height={gasneeds.logoHeight}
                className="h-16 w-auto"
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 pb-24 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm"
            >
              <h2 className="text-base font-semibold text-slate-900">
                {f.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        Internal tool for Flare Technical and Gas Needs employees.
      </footer>
    </div>
  );
}
