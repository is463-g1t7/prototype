import type { Bin } from "@/lib/bins";
import { BIN_CAPACITY_KG, statusFor } from "@/lib/bins";

export function BinCard({
  bin,
  selected,
  eta,
  levels,
  topPantry,
  onCollect,
  onSelect,
}: {
  bin: Bin;
  selected: boolean;
  eta: string | null;
  levels: number;
  topPantry: string | null;
  onCollect: (id: string) => void;
  onSelect: (id: string) => void;
}) {
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

  return (
    <article
      id={`bin-${bin.id}`}
      onClick={() => onSelect(bin.id)}
      className={`flex scroll-mt-6 cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 transition-shadow ${
        selected ? "border-brand shadow-[0_0_0_2px_var(--color-brand)]" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">
            {bin.name} <span className="text-muted">({bin.short})</span>
          </h2>
          <p className="text-sm text-muted">
            {bin.pantry} · {levels} pantries
            {eta && eta !== "FULL" ? ` · ${eta}` : ""}
            {topPantry ? ` · top ${topPantry}` : ""}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
          {label}
        </span>
      </div>

      <p className="text-sm">
        <span className="text-2xl font-semibold tabular-nums">
          {bin.weightKg.toFixed(2)}
        </span>{" "}
        <span className="text-muted">kg / {BIN_CAPACITY_KG} kg</span>
      </p>
      <div
        className="h-2 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuenow={bin.weightKg}
        aria-valuemin={0}
        aria-valuemax={BIN_CAPACITY_KG}
      >
        <div
          className={`h-full rounded-full transition-[width] ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCollect(bin.id);
          }}
          disabled={bin.weightKg <= 0}
          className="h-9 flex-1 rounded-md bg-brand px-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mark collected
        </button>
      </div>

      <p className="text-xs text-muted" suppressHydrationWarning>
        Updated {new Date(bin.updatedAt).toLocaleString()}
      </p>
    </article>
  );
}
