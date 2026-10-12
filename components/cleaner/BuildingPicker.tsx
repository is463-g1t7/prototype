"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CampusMap } from "@/components/CampusMap";
import { ago } from "@/lib/analytics";
import { BIN_CAPACITY_KG, levelsFor, statusFor } from "@/lib/bins";
import { cleanerById } from "@/lib/cleaners";
import { SCALE_FRAMES } from "@/lib/scales";
import { useMinuteClock, useStoredBins, useStoredEvents } from "@/lib/store";
import { CleanerShell, NeedsPass, StepColumns } from "./CleanerShell";

const NO_DIM = new Set<string>();
const MAX_FRAME_KG = Math.max(...SCALE_FRAMES.map((f) => f.refKg));

export function BuildingPicker() {
  const router = useRouter();
  const cleaner = cleanerById(useSearchParams().get("cleaner"));
  const bins = useStoredBins();
  const events = useStoredEvents();
  const now = useMinuteClock();
  const [binId, setBinId] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);

  if (!cleaner) {
    return (
      <CleanerShell step={2}>
        <NeedsPass />
      </CleanerShell>
    );
  }

  const bin = bins.find((b) => b.id === binId) ?? null;

  function open(id: string) {
    setBinId(id);
    setLevel(null);
  }

  function lastEmptied(id: string, l: number): string | null {
    const e = events.find((x) => x.type === "deposit" && x.binId === id && x.level === l);
    return e && now !== null ? ago(e.at, now) : null;
  }

  function confirm() {
    if (!bin || level == null || !cleaner) return;
    router.push(`/cleaner/weigh?cleaner=${cleaner.id}&bin=${bin.id}&level=${level}`);
  }

  const levelPanel = (titleId: string, onClose?: () => void) =>
    bin && (
      <>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-muted">{bin.short}</p>
            <h2 id={titleId} className="text-lg font-semibold">
              Which pantry did the grounds come from?
            </h2>
            <p className="text-sm text-muted">
              {bin.name} · central bin at {bin.weightKg.toFixed(1)} kg
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-sand"
            >
              ✕
            </button>
          )}
        </div>

        {bin.weightKg >= MAX_FRAME_KG && (
          <p className="mt-3 rounded-md bg-tint-ochre px-3 py-2 text-sm text-ochre">
            This bin is nearly full. You&apos;ll be asked to swap it before weighing.
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          {Array.from({ length: levelsFor(bin.id) }, (_, i) => i + 1).map((l) => {
            const last = lastEmptied(bin.id, l);
            return (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                aria-pressed={level === l}
                className={`flex flex-col items-center rounded-lg border py-3 ${
                  level === l ? "border-brand bg-brand text-white" : "border-line hover:bg-sand"
                }`}
              >
                <span className="text-lg font-bold">L{l}</span>
                <span className={`text-[11px] ${level === l ? "text-white/75" : "text-muted"}`}>
                  {last ? `emptied ${last}` : "no record"}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={level == null}
          className="mt-4 h-12 w-full rounded-md bg-brand text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {level == null ? "Select a level" : `Confirm ${bin.short} · L${level} pantry →`}
        </button>
      </>
    );

  const buildingList = (
    <ul className="grid grid-cols-2 gap-2">
      {bins.map((b) => {
        const s = statusFor(b.weightKg);
        return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => open(b.id)}
              className={`flex w-full flex-col rounded-lg border bg-card px-3 py-2 text-left ${
                b.id === binId
                  ? "border-brand shadow-[0_0_0_2px_var(--color-brand)]"
                  : "border-line hover:border-muted"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{b.short}</span>
                <span
                  className={`h-2 w-2 rounded-full ${s === "full" ? "bg-roof" : s === "near" ? "bg-harvest" : "bg-leaf"}`}
                />
              </span>
              <span className="truncate text-xs text-muted">{b.name}</span>
              <span className="text-xs tabular-nums text-muted">
                Bin {b.weightKg.toFixed(1)} / {BIN_CAPACITY_KG} kg
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <CleanerShell step={2} cleaner={cleaner}>
      <StepColumns
        main={
          <>
            <div>
              <h1 className="text-lg font-semibold lg:text-2xl lg:tracking-tight">
                Which building are you at?
              </h1>
              <p className="text-sm text-muted">Tap a pin on the map or pick from the list.</p>
            </div>

            <CampusMap bins={bins} selectedId={binId ?? ""} dimmedIds={NO_DIM} onSelect={open} />

            <div className="lg:hidden">{buildingList}</div>
          </>
        }
        side={
          // Laptop: buildings, then the level picker, sit beside the map instead of below/over it.
          <section className="hidden rounded-xl border border-line bg-card p-5 lg:block">
            {bin ? (
              <div key={bin.id} className="animate-rise">
                <div className="mb-4 flex flex-wrap gap-1.5" aria-label="Switch building">
                  {bins.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => open(b.id)}
                      aria-pressed={b.id === bin.id}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        b.id === bin.id ? "bg-brand text-white" : "border border-line hover:bg-sand"
                      }`}
                    >
                      {b.short}
                    </button>
                  ))}
                </div>
                {levelPanel("level-title-side")}
              </div>
            ) : (
              <>
                <h2 className="font-semibold">Pick a building</h2>
                <p className="mb-3 text-sm text-muted">
                  Its pantry levels appear here, with when each was last emptied.
                </p>
                {buildingList}
              </>
            )}
          </section>
        }
      />

      {/* Phone: bottom sheet over the map. */}
      {bin && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 sm:items-center lg:hidden"
          onClick={() => setBinId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-rise rounded-t-2xl bg-card p-5 shadow-2xl sm:rounded-2xl"
          >
            {levelPanel("level-title", () => setBinId(null))}
          </div>
        </div>
      )}
    </CleanerShell>
  );
}
