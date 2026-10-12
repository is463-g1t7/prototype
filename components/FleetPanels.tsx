import { ago, type BinEvent } from "@/lib/analytics";
import type { Bin } from "@/lib/bins";

export function CollectionQueue({
  bins,
  etas,
  onCollect,
  onSelect,
}: {
  bins: Bin[];
  etas: Map<string, string | null>;
  onCollect: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  if (!bins.length) {
    return (
      <div className="flex h-full flex-col justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
        <p className="font-semibold">All clear ✓</p>
        <p>No bin needs collection right now.</p>
      </div>
    );
  }
  return (
    <ol className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {bins.map((b, i) => (
        <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-5 text-sm font-bold tabular-nums text-zinc-400">{i + 1}</span>
          <button type="button" onClick={() => onSelect(b.id)} className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold">{b.name}</span>
            <span className="block text-xs tabular-nums text-zinc-500">
              {b.weightKg.toFixed(2)} kg{etas.get(b.id) ? ` · ${etas.get(b.id)}` : ""}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onCollect(b.id)}
            className="h-8 shrink-0 rounded-md bg-[#0e2a47] px-3 text-xs font-medium text-white hover:opacity-90"
          >
            Collect
          </button>
        </li>
      ))}
    </ol>
  );
}

export function Leaderboard({
  ranking,
  bins,
}: {
  ranking: Array<{ binId: string; kg: number }>;
  bins: Bin[];
}) {
  const max = Math.max(0.01, ...ranking.map((r) => r.kg));
  const name = (id: string) => bins.find((b) => b.id === id)?.short ?? id;
  return (
    <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="font-semibold">Building leaderboard</h2>
      <p className="text-xs text-zinc-500">Coffee grounds repurposed, all time.</p>
      {ranking.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No collections logged yet.</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {ranking.map((r, i) => (
            <li key={r.binId} className="flex items-center gap-2 text-sm">
              <span className="w-5 font-bold tabular-nums text-zinc-400">{i + 1}</span>
              <span className="w-14 shrink-0 font-medium">{name(r.binId)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#0e2a47] dark:bg-white"
                  style={{ width: `${Math.max(4, (r.kg / max) * 100)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right tabular-nums text-zinc-500">
                {r.kg.toFixed(1)} kg
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function ActivityFeed({
  events,
  bins,
  now,
}: {
  events: BinEvent[];
  bins: Bin[];
  now: number | null;
}) {
  const short = (id: string) => bins.find((b) => b.id === id)?.short ?? id;
  return (
    <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="font-semibold">Recent activity</h2>
      <p className="text-xs text-zinc-500">Deposits and collections as they happen.</p>
      <ol className="mt-3 flex flex-col gap-2 text-sm">
        {events.slice(0, 7).map((e) => (
          <li key={e.id} className="flex items-baseline justify-between gap-2">
            <span>
              {e.type === "collect" ? (
                <>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓</span>{" "}
                  Collected <span className="font-semibold tabular-nums">{e.kg.toFixed(1)} kg</span>{" "}
                  from {short(e.binId)}
                </>
              ) : (
                <>
                  <span className="font-semibold tabular-nums">+{e.kg.toFixed(1)} kg</span> →{" "}
                  {short(e.binId)}
                </>
              )}
            </span>
            <span className="shrink-0 text-xs text-zinc-400">
              {now === null ? "·" : ago(e.at, now)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
