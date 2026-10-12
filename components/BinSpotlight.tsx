import type { KeyboardEvent } from "react";
import type { Bin } from "@/lib/bins";
import { BIN_CAPACITY_KG, levelsFor, statusFor } from "@/lib/bins";

const DOT = { ok: "bg-leaf", near: "bg-harvest", full: "bg-roof" } as const;

/** One bin at a time: building tabs (synced with the map selection) over a wide detail card. */
export function BinSpotlight({
  bins,
  selectedId,
  dimmedIds,
  etas,
  topPantries,
  onSelect,
  onCollect,
}: {
  bins: Bin[];
  selectedId: string;
  dimmedIds: Set<string>;
  etas: Map<string, string | null>;
  topPantries: Map<string, string>;
  onSelect: (id: string) => void;
  onCollect: (id: string) => void;
}) {
  const bin = bins.find((b) => b.id === selectedId) ?? bins[0];
  const status = statusFor(bin.weightKg);
  const pct = Math.min(100, (bin.weightKg / BIN_CAPACITY_KG) * 100);
  const badge =
    status === "full"
      ? "bg-tint-ember text-ember"
      : status === "near"
        ? "bg-tint-ochre text-ochre"
        : "bg-tint-leaf text-pine";
  const label = status === "full" ? "FULL" : status === "near" ? "Near full" : "OK";
  const bar = status === "full" ? "bg-roof" : status === "near" ? "bg-harvest" : "bg-leaf";
  const eta = etas.get(bin.id);
  const top = topPantries.get(bin.id);

  // Tablist keyboard pattern: arrows move (and select), Home/End jump.
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = bins.findIndex((b) => b.id === bin.id);
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % bins.length
        : e.key === "ArrowLeft"
          ? (i - 1 + bins.length) % bins.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? bins.length - 1
              : null;
    if (next == null) return;
    e.preventDefault();
    onSelect(bins[next].id);
    document.getElementById(`bin-tab-${bins[next].id}`)?.focus();
  }

  return (
    <section
      id="bin-spotlight"
      className="scroll-mt-6 overflow-hidden rounded-xl border border-line bg-card"
    >
      <div
        role="tablist"
        aria-label="Smart bins by building"
        onKeyDown={onKey}
        className="flex gap-1.5 overflow-x-auto border-b border-line bg-paper/60 p-2"
      >
        {bins.map((b) => {
          const on = b.id === bin.id;
          return (
            <button
              key={b.id}
              id={`bin-tab-${b.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="bin-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => onSelect(b.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                on ? "bg-brand text-white" : "hover:bg-sand"
              } ${dimmedIds.has(b.id) && !on ? "opacity-40" : ""}`}
            >
              <span className={`h-2 w-2 rounded-full ${DOT[statusFor(b.weightKg)]}`} />
              {b.short}
              <span className={`text-xs tabular-nums ${on ? "text-white/70" : "text-muted"}`}>
                {b.weightKg.toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>

      <div
        key={bin.id}
        id="bin-panel"
        role="tabpanel"
        aria-labelledby={`bin-tab-${bin.id}`}
        className="grid animate-rise gap-5 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-8"
      >
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <h2 className="text-lg font-semibold">
              {bin.name} <span className="text-muted">({bin.short})</span>
            </h2>
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}
            >
              {label}
            </span>
          </div>
          <p className="text-sm text-muted">
            {bin.pantry} · {levelsFor(bin.id)} pantries
            {eta && eta !== "FULL" ? ` · ${eta}` : ""}
            {top ? ` · top ${top}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted" suppressHydrationWarning>
            Updated {new Date(bin.updatedAt).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm">
            <span className="text-3xl font-semibold tabular-nums">{bin.weightKg.toFixed(2)}</span>{" "}
            <span className="text-muted">kg / {BIN_CAPACITY_KG} kg</span>
          </p>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-sand"
            role="progressbar"
            aria-label={`${bin.short} fill`}
            aria-valuenow={bin.weightKg}
            aria-valuemin={0}
            aria-valuemax={BIN_CAPACITY_KG}
          >
            <div
              className={`h-full rounded-full transition-[width] ${bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onCollect(bin.id)}
          disabled={bin.weightKg <= 0}
          className="h-10 rounded-md bg-brand px-5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mark collected
        </button>
      </div>
    </section>
  );
}
