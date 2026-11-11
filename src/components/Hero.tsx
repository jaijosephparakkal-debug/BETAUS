import { Avatar } from "@/components/Avatar";

/** The greeting panel at the top of My Tasks: photo, a line that says what needs doing, and three live numbers. */
export function Hero({
  name, email, title, dueCount, tiles,
}: {
  name: string;
  email: string;
  title: string;
  dueCount: number;
  tiles: { label: string; value: number }[];
}) {
  const dubai = new Date(Date.now() + 4 * 3600 * 1000);
  const h = dubai.getUTCHours();
  const hello = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const date = dubai.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase().replace(/,/g, " ·");
  const first = name.split(" ")[0];
  return (
    <section className="panel-ink rounded-2xl p-6 shadow-lg">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={name} email={email} size={76} className="ring-2 ring-accent" />
        <div>
          <span className="inline-block rounded-full border border-white/30 px-3 py-0.5 text-[13px] tracking-[0.14em] text-[#DFE5EB]">{date}</span>
          <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight">
            {hello}, {first}.
            <br />
            {dueCount > 0 ? (
              <>
                <span className="text-highlight">{dueCount} follow-up{dueCount === 1 ? "" : "s"}</span> need{dueCount === 1 ? "s" : ""} you.
              </>
            ) : (
              <span className="text-[#DFE5EB]">You are all caught up.</span>
            )}
          </h1>
          <p className="mt-1 text-[16px] text-[#c9d2da]">{title}</p>
        </div>
      </div>
      <div className="mt-5 grid max-w-xl grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
            <div className="text-[13px] uppercase tracking-[0.1em] text-[#c9d2da]">{t.label}</div>
            <div className="text-[28px] font-semibold text-white">{t.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
