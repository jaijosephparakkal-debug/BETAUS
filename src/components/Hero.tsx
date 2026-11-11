import Link from "next/link";
import { Avatar } from "@/components/Avatar";

export type PulsePerson = { name: string; email: string };
export type Journey = { number: string; customer: string; stage: number } | null;

const STAGES = ["Quoted", "Ordered", "Delivered", "Paid"];

/** The home grid at the top of My Tasks: a greeting tile, score ring, quick log tiles, live numbers, team pulse and the quotation in motion. */
export function BentoHome({
  name, email, title, dueCount, handedToMe, nextHref, score, kinds, stats, pulse, journey,
}: {
  name: string;
  email: string;
  title: string;
  dueCount: number;
  handedToMe: number;
  nextHref: string | null;
  score: number | null;
  kinds: { v: string; l: string }[] | null;
  stats: { label: string; value: number; note: string }[];
  pulse: PulsePerson[];
  journey: Journey;
}) {
  const dubai = new Date(Date.now() + 4 * 3600 * 1000);
  const h = dubai.getUTCHours();
  const hello = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const date = dubai.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).toUpperCase().replace(/,/g, " ·");
  const first = name.split(" ")[0];
  const circ = 2 * Math.PI * 40;
  return (
    <section className="grid auto-rows-[minmax(110px,auto)] grid-cols-2 gap-3 md:grid-cols-4">
      <div className="panel-ink col-span-2 row-span-2 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <Avatar name={name} email={email} size={52} className="ring-2 ring-accent" />
          <span className="text-[13px] tracking-[0.14em] text-[#c9d2da]">{date}</span>
        </div>
        <h1 className="mt-4 text-[32px] font-semibold leading-tight tracking-tight">
          {hello},
          <br />
          {first}.
        </h1>
        <p className="mt-2 text-[17px] text-[#c9d2da]">
          {dueCount > 0 ? (
            <>
              <b className="text-highlight">{dueCount}</b> need you
            </>
          ) : (
            "You are all caught up"
          )}
          {handedToMe > 0 && (
            <>
              {" · "}
              <b className="text-white">{handedToMe}</b> handed to you
            </>
          )}
        </p>
        <p className="text-[14px] text-[#9fb0bc]">{title}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {nextHref && (
            <Link href={nextHref} className="rounded-full bg-accent px-4 py-1.5 text-[16px] font-semibold text-on-accent shadow-md hover:opacity-90">
              Open next up
            </Link>
          )}
          <a href="#needs" className="rounded-full border border-white/40 px-4 py-1.5 text-[16px] text-white hover:bg-white/10">
            View all
          </a>
        </div>
      </div>

      <div className="row-span-2 flex flex-col items-center justify-center gap-1 rounded-3xl bg-ink p-4 text-white shadow-lg">
        <div className="text-[12px] tracking-[0.14em] text-[#9fb0bc]">MY SCORE</div>
        <svg viewBox="0 0 100 100" width="104" height="104" aria-label={score === null ? "No score yet" : `Score ${score}`}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(223,229,235,0.18)" strokeWidth="9" />
          {score !== null && (
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(var(--accent))" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(score / 100) * circ} ${circ}`} transform="rotate(-90 50 50)" />
          )}
          <text x="50" y="57" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="600">{score ?? "—"}</text>
        </svg>
        <div className="text-[13px] text-[#9fb0bc]">provisional</div>
      </div>

      {kinds && kinds.length > 0 ? (
        <div className="row-span-2 rounded-3xl bg-ink p-4 text-white shadow-lg">
          <div className="text-[12px] tracking-[0.14em] text-[#9fb0bc]">LOG WORK</div>
          <div className="mt-2 grid gap-1.5">
            {kinds.slice(0, 4).map((k) => (
              <Link key={k.v} href={`/dashboard/tasks?kind=${k.v}#log`} className="rounded-xl bg-white/10 px-3 py-2 text-[15px] hover:bg-white/20">
                {k.l}
              </Link>
            ))}
            <a href="#log" className="px-1 pt-1 text-[14px] text-[#9fb0bc] hover:text-white">All entry types →</a>
          </div>
        </div>
      ) : (
        <div className="row-span-2 rounded-3xl bg-ink p-4 text-white shadow-lg">
          <div className="text-[12px] tracking-[0.14em] text-[#9fb0bc]">ADD</div>
          <a href="#log" className="mt-2 block rounded-xl bg-white/10 px-3 py-2 text-[15px] hover:bg-white/20">Add a task</a>
        </div>
      )}

      {stats.slice(0, 2).map((s) => (
        <div key={s.label} className="rounded-3xl bg-ink p-4 text-white shadow-lg">
          <div className="text-[12px] tracking-[0.14em] text-[#9fb0bc]">{s.label.toUpperCase()}</div>
          <div className="mt-1 text-[34px] font-semibold leading-none">{s.value}</div>
          <div className="mt-2 text-[13px] text-[#9fb0bc]">{s.note}</div>
        </div>
      ))}

      <div className="col-span-2 rounded-3xl bg-ink p-4 text-white shadow-lg">
        <div className="text-[12px] tracking-[0.14em] text-[#9fb0bc]">TEAM PULSE</div>
        {pulse.length === 0 ? (
          <p className="mt-3 text-[14px] text-[#9fb0bc]">Work passed to you and by you will show here.</p>
        ) : (
          <div className="mt-3 flex items-center">
            {pulse.map((p) => (
              <Avatar key={p.email} name={p.name} email={p.email} size={36} className="-mr-2 ring-2 ring-ink" />
            ))}
            <span className="ml-5 text-[14px] text-[#c9d2da]">{pulse.map((p) => p.name.split(" ")[0]).slice(0, 3).join(", ")}{pulse.length > 3 ? " and others" : ""}</span>
          </div>
        )}
      </div>

      <div className="col-span-2 rounded-3xl bg-white p-4 text-ink shadow-lg">
        <div className="text-[12px] tracking-[0.14em] text-slate-500">IN MOTION</div>
        {journey ? (
          <>
            <div className="mt-3 flex items-center gap-1">
              {STAGES.map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-1 last:flex-none">
                  <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[13px] ${i < journey.stage ? "border-ink bg-ink text-white" : i === journey.stage ? "border-accent bg-accent font-semibold text-on-accent" : "border-slate-300 text-slate-500"}`}>{s}</span>
                  {i < STAGES.length - 1 && <span className="h-0.5 flex-1 bg-slate-300" />}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[14px] text-slate-600">{journey.number} · {journey.customer}</div>
          </>
        ) : (
          <p className="mt-3 text-[14px] text-slate-500">No quotation in motion for you right now.</p>
        )}
      </div>
    </section>
  );
}
