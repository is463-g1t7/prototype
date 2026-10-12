import { useState } from "react";
import { ago, type BinEvent, type PantryStat } from "@/lib/analytics";
import type { Bin } from "@/lib/bins";
import { BIN_CAPACITY_KG, levelsFor } from "@/lib/bins";

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
      <div className="flex h-full flex-col justify-center rounded-xl border border-leaf/40 bg-tint-leaf p-5 text-sm text-pine">
        <p className="font-semibold">All clear ✓</p>
        <p>No bin needs collection right now.</p>
      </div>
    );
  }
  return (
    <ol className="flex flex-col divide-y divide-line rounded-xl border border-line bg-card">
      {bins.map((b, i) => (
        <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-5 text-sm font-bold tabular-nums text-muted">{i + 1}</span>
          <button type="button" onClick={() => onSelect(b.id)} className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold">{b.name}</span>
            <span className="block text-xs tabular-nums text-muted">
              {b.weightKg.toFixed(2)} kg{etas.get(b.id) ? ` · ${etas.get(b.id)}` : ""}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onCollect(b.id)}
            className="h-8 shrink-0 rounded-md bg-brand px-3 text-xs font-medium text-white hover:opacity-90"
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
    <section className="rounded-xl border border-line bg-card p-5">
      <h2 className="font-semibold">Building leaderboard</h2>
      <p className="text-xs text-muted">Coffee grounds repurposed, all time.</p>
      {ranking.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No collections logged yet.</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {ranking.map((r, i) => (
            <li key={r.binId} className="flex items-center gap-2 text-sm">
              <span className="w-5 font-bold tabular-nums text-muted">{i + 1}</span>
              <span className="w-14 shrink-0 font-medium">{name(r.binId)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.max(4, (r.kg / max) * 100)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right tabular-nums text-muted">
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
  const where = (e: BinEvent) => e.pantry ?? short(e.binId);
  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <h2 className="font-semibold">Recent activity</h2>
      <p className="text-xs text-muted">Deposits and collections as they happen.</p>
      <ol className="mt-3 flex flex-col gap-2 text-sm">
        {events.slice(0, 7).map((e) => (
          <li key={e.id} className="flex items-baseline justify-between gap-2">
            <span>
              {e.type === "collect" ? (
                <>
                  <span className="font-semibold text-pine">✓</span>{" "}
                  Collected <span className="font-semibold tabular-nums">{e.kg.toFixed(1)} kg</span>{" "}
                  from {short(e.binId)}
                </>
              ) : (
                <>
                  <span className="font-semibold tabular-nums">+{e.kg.toFixed(1)} kg</span> →{" "}
                  {where(e)}
                </>
              )}
            </span>
            <span className="shrink-0 text-xs text-muted">
              {now === null ? "·" : ago(e.at, now)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Cleaner log: which building bin + which pantry level is being emptied. */
export function CleanerPanel({
  bins,
  initialBinId,
  onDeposit,
}: {
  bins: Bin[];
  initialBinId: string;
  onDeposit: (binId: string, level: number, kg: number) => void;
}) {
  const [binId, setBinId] = useState(initialBinId);
  const [level, setLevel] = useState(2);
  const [kg, setKg] = useState(0.3);
  const bin = bins.find((b) => b.id === binId) ?? bins[0];
  const levels = levelsFor(bin.id);
  const safeLevel = Math.min(Math.max(1, level), levels);
  const binFull = bin.weightKg >= BIN_CAPACITY_KG;

  return (
    <section className="rounded-xl border border-line bg-card p-4">
      <h2 className="font-semibold">Empty pantry → bin</h2>
      <p className="text-xs text-muted">Cleaners log which pantry they cleared.</p>
      <div className="mt-3 flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">Building bin</span>
          <select
            value={bin.id}
            onChange={(e) => {
              setBinId(e.target.value);
              setLevel(1);
            }}
            className="h-10 rounded-md border border-line bg-background px-2 text-sm"
          >
            {bins.map((b) => (
              <option key={b.id} value={b.id}>
                {b.short} — {b.weightKg.toFixed(1)} kg
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-xs text-muted">Pantry level</span>
            <select
              value={safeLevel}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="h-10 rounded-md border border-line bg-background px-2 text-sm"
            >
              {Array.from({ length: levels }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  L{i + 1}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-xs text-muted">Caddy (kg)</span>
            <input
              type="number"
              min={0.05}
              max={5}
              step={0.05}
              value={kg}
              onChange={(e) => setKg(Number(e.target.value))}
              className="h-10 rounded-md border border-line bg-background px-2 text-sm tabular-nums"
            />
          </label>
        </div>
        <div className="flex gap-1.5">
          {[0.2, 0.3, 0.5, 1].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setKg(q)}
              className={`h-7 flex-1 rounded-full text-xs font-medium tabular-nums ${
                kg === q
                  ? "bg-brand text-white"
                  : "border border-line hover:bg-sand"
              }`}
            >
              {q.toFixed(1)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onDeposit(bin.id, safeLevel, kg)}
          disabled={kg <= 0 || binFull}
          className="h-10 rounded-md bg-brand text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {binFull ? `${bin.short} is FULL — collect first` : `Empty ${bin.short} · L${safeLevel} into bin`}
        </button>
      </div>
    </section>
  );
}

export function PantryLeaderboard({ stats }: { stats: PantryStat[] }) {
  const top = stats.slice(0, 5);
  const max = Math.max(0.01, ...top.map((r) => r.kg));
  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <h2 className="font-semibold">Top pantries · 7d</h2>
      <p className="text-xs text-muted">Where the grounds come from.</p>
      {top.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No pantry deposits logged yet.</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {top.map((r, i) => (
            <li key={`${r.binId}-${r.level}`} className="flex items-center gap-2 text-sm">
              <span className="w-5 font-bold tabular-nums text-muted">{i + 1}</span>
              <span className="w-20 shrink-0 font-medium">{r.pantry}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${Math.max(4, (r.kg / max) * 100)}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right tabular-nums text-muted">
                {r.kg.toFixed(1)} kg · {r.count}×
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function LevelBreakdown({
  binShort,
  rows,
}: {
  binShort: string;
  rows: Array<{ level: number; kg: number; count: number }>;
}) {
  const max = Math.max(0.01, ...rows.map((r) => r.kg));
  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <h2 className="font-semibold">
        {binShort} by level · 7d
      </h2>
      <p className="text-xs text-muted">Which floor fills the bin. Follows the selected bin.</p>
      <ol className="mt-3 flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.level} className="flex items-center gap-2 text-sm">
            <span className="w-8 shrink-0 font-medium tabular-nums">L{r.level}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: r.kg > 0 ? `${Math.max(4, (r.kg / max) * 100)}%` : "0%" }}
              />
            </div>
            <span className="w-20 shrink-0 text-right tabular-nums text-muted">
              {r.kg > 0 ? `${r.kg.toFixed(1)} kg · ${r.count}×` : "—"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PantryWatch({
  quiet,
  avgCaddy,
  week,
}: {
  quiet: string[];
  avgCaddy: number | null;
  week: { count: number; kg: number };
}) {
  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <h2 className="font-semibold">Pantry watch</h2>
      <p className="text-xs text-muted">Supervision cues for the week.</p>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Avg caddy emptied</dt>
          <dd className="tabular-nums">{avgCaddy == null ? "—" : `${avgCaddy.toFixed(2)} kg`}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Collections · 7d</dt>
          <dd className="tabular-nums">
            {week.count}× · {week.kg.toFixed(1)} kg
          </dd>
        </div>
        <div>
          <dt className="text-muted">Quiet pantries · 7d</dt>
          <dd className="mt-1 text-sm">
            {quiet.length === 0 ? (
              <span className="text-pine">
                Every pantry contributed ✓
              </span>
            ) : (
              <>
                {quiet.slice(0, 5).join(" · ")}
                {quiet.length > 5 && (
                  <span className="text-muted"> · +{quiet.length - 5} more</span>
                )}
              </>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
