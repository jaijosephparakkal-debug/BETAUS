import { Card } from "@/components/ui";
import { periodOptions } from "@/lib/presentationData";

/** Download a branded PDF review deck made from the person's own logged work. */
export function DeckDownload({ userId }: { userId?: string }) {
  const opts = periodOptions();
  const q = userId ? `&user=${userId}` : "";
  return (
    <Card>
      <h2 className="text-[21px] font-semibold text-white">Review presentation</h2>
      <p className="mt-1 text-[16px] text-[#c9d2da]">
        A ready-to-present PDF of your work for the review meeting: results, charts, who you worked with, and what is next. Two-week decks for each half of the month, and a full-month deck.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {opts.map((o) => (
          <a
            key={o.range}
            href={`/api/presentation?range=${o.range}${q}`}
            className="rounded-xl border border-white/30 px-4 py-2 text-[17px] text-white hover:bg-white/10"
          >
            <span className="font-semibold">{o.name}</span>
            <span className="ml-2 text-[14px] text-[#c9d2da]">{o.label}</span>
          </a>
        ))}
      </div>
    </Card>
  );
}
