"use client";

import { useState } from "react";
import { statusFor, type Bin } from "@/lib/bins";

// ponytail: pin spots eyeballed off the Sustainability Office art — nudge when confirmed
const PINS: Record<string, { x: number; y: number }> = {
  "bin-soa": { x: 31, y: 22 },
  "bin-soe": { x: 54, y: 38 },
  "bin-scis": { x: 88, y: 40 },
  "bin-yphsl": { x: 75, y: 53 },
  "bin-soss": { x: 25, y: 34 },
  "bin-lib": { x: 14, y: 62 },
  "bin-lkcsb": { x: 63, y: 62 },
};

const DOT: Record<string, string> = {
  ok: "#3f7a34",
  near: "#b45309",
  full: "#b23c26",
};

export function CampusMap({
  bins,
  selectedId,
  dimmedIds,
  onSelect,
}: {
  bins: Bin[];
  selectedId: string;
  dimmedIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/smu-campus-map.jpeg"
          alt="Illustrated map of the SMU campus"
          className="block h-auto w-full"
        />
        {bins.map((b) => {
          const p = PINS[b.id];
          if (!p) return null;
          const s = statusFor(b.weightKg);
          const selected = b.id === selectedId;
          const dim = dimmedIds.has(b.id);
          const pct = Math.min(100, (b.weightKg / 5) * 100);
          // keep edge pins' tooltips inside the map
          const tx = p.x > 78 ? "-85%" : p.x < 22 ? "-15%" : "-50%";
          return (
            <div key={b.id}>
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                onMouseEnter={() => setHoveredId(b.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(b.id)}
                onBlur={() => setHoveredId(null)}
                aria-label={`${b.name}, ${b.weightKg.toFixed(2)} kilograms`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[11px] font-bold text-white shadow-lg transition hover:scale-110 ${
                  s === "full" && !dim ? "animate-pulse" : ""
                } ${dim ? "opacity-25 saturate-0" : ""}`}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  backgroundColor: DOT[s],
                  ...(selected
                    ? { outline: "3px solid #fff", boxShadow: "0 0 0 5px var(--color-brand)" }
                    : undefined),
                }}
              >
                {b.short}
              </button>
              {hoveredId === b.id && (
                <div
                  className="pointer-events-none absolute z-10 w-44 rounded-lg border border-line bg-card p-3 shadow-xl"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: `translate(${tx}, calc(-100% - 18px))`,
                  }}
                >
                  <p className="text-xs font-semibold leading-tight">
                    {b.name} <span className="font-normal text-muted">({b.short})</span>
                  </p>
                  <p className="text-[11px] text-muted">{b.pantry}</p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold tabular-nums">
                      {b.weightKg.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-muted">kg</span>
                    <span
                      className="ml-auto text-[10px] font-bold uppercase"
                      style={{ color: DOT[s] }}
                    >
                      {s === "full" ? "Full" : s === "near" ? "Near full" : "OK"}
                    </span>
                  </p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: DOT[s] }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted">Click pin to inspect →</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <figcaption className="bg-paper px-4 py-2 text-xs text-muted">
        Campus art: SMU Sustainability Office · pins show live fill — green ok, amber
        near-full, red full. Hover a pin for its reading, click to inspect its bin.
      </figcaption>
    </figure>
  );
}
