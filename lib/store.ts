import { useSyncExternalStore } from "react";
import { EVENT_LIMIT, seedEvents, type BinEvent, type EventSource } from "./analytics";
import { BIN_CAPACITY_KG, INITIAL_BINS, pantryLabel, type Bin } from "./bins";

// Browser-side source of truth for the demo: the dashboard and the cleaner flow share it,
// and other tabs pick up writes via the `storage` event.
// v3/v2: 10 kg bins + audit fields — older keys hold 5 kg-era state.
export const BINS_KEY = "smartbin-weights-v3";
export const EVENTS_KEY = "smartbin-events-v2";

export function loadBins(): Bin[] {
  if (typeof window === "undefined") return INITIAL_BINS;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BINS_KEY) ?? "null") as Bin[];
    // ponytail: shape-check by id set, full schema validation if contract drifts
    const ids = new Set(INITIAL_BINS.map((b) => b.id));
    if (Array.isArray(parsed) && parsed.every((b) => b && ids.has(b.id))) return parsed;
    return INITIAL_BINS;
  } catch {
    return INITIAL_BINS;
  }
}

export function loadEvents(): BinEvent[] {
  if (typeof window === "undefined") return seedEvents();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(EVENTS_KEY) ?? "null") as BinEvent[];
    if (
      Array.isArray(parsed) &&
      parsed.every((e) => e && typeof e.at === "string" && typeof e.kg === "number")
    )
      return parsed;
    return seedEvents();
  } catch {
    return seedEvents();
  }
}

export function saveBins(bins: Bin[]) {
  try {
    window.localStorage.setItem(BINS_KEY, JSON.stringify(bins));
  } catch {
    // storage full/blocked — callers keep working in-memory
  }
}

export function saveEvents(events: BinEvent[]) {
  try {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, EVENT_LIMIT)));
  } catch {
    // storage full/blocked — callers keep working in-memory
  }
}

export function rid(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)}`;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Cleaner flow: the floor scale under the central bin shows its new total, so the
 * deposit is the difference from the last known total. Returns null when the
 * reading isn't an increase (nothing to attribute).
 */
export function recordScaleReading(input: {
  binId: string;
  level: number;
  cleanerId: string;
  afterKg: number;
  source: EventSource;
  photo?: string;
  at?: string;
}): BinEvent | null {
  const bins = loadBins();
  const bin = bins.find((b) => b.id === input.binId);
  if (!bin) return null;
  const afterKg = round2(Math.min(BIN_CAPACITY_KG, Math.max(0, input.afterKg)));
  const beforeKg = round2(bin.weightKg);
  if (afterKg <= beforeKg) return null;
  const at = input.at ?? new Date().toISOString();
  const event: BinEvent = {
    id: rid(),
    at,
    binId: bin.id,
    type: "deposit",
    kg: round2(afterKg - beforeKg),
    level: input.level,
    pantry: pantryLabel(bin, input.level),
    cleanerId: input.cleanerId,
    source: input.source,
    beforeKg,
    afterKg,
    photo: input.photo,
  };
  saveEvents([event, ...loadEvents()]);
  saveBins(bins.map((b) => (b.id === bin.id ? { ...b, weightKg: afterKg, updatedAt: at } : b)));
  return event;
}

/** Empty a building's central bin (collection crew or the cleaner on site). */
export function recordCollect(binId: string, cleanerId?: string): BinEvent | null {
  const bins = loadBins();
  const bin = bins.find((b) => b.id === binId);
  if (!bin || bin.weightKg <= 0) return null;
  const at = new Date().toISOString();
  const event: BinEvent = {
    id: rid(),
    at,
    binId,
    type: "collect",
    kg: round2(bin.weightKg),
    cleanerId,
    beforeKg: round2(bin.weightKg),
    afterKg: 0,
  };
  saveEvents([event, ...loadEvents()]);
  saveBins(bins.map((b) => (b.id === binId ? { ...b, weightKg: 0, updatedAt: at } : b)));
  return event;
}

// --- React bindings (read-only views; writers above notify via the storage event in other tabs) ---

function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

// Snapshots must be referentially stable between changes, so cache by the raw string.
function cachedReader<T>(key: string, load: () => T) {
  let raw: string | null | undefined;
  let value: T;
  return () => {
    const next = window.localStorage.getItem(key);
    if (next !== raw || value === undefined) {
      raw = next;
      value = load();
    }
    return value;
  };
}

const readBins = cachedReader(BINS_KEY, loadBins);
const readEvents = cachedReader(EVENTS_KEY, loadEvents);
const NO_EVENTS: BinEvent[] = [];

export function useStoredBins(): Bin[] {
  return useSyncExternalStore(subscribeStorage, readBins, () => INITIAL_BINS);
}

export function useStoredEvents(): BinEvent[] {
  return useSyncExternalStore(subscribeStorage, readEvents, () => NO_EVENTS);
}

function subscribeMinute(cb: () => void) {
  const id = window.setInterval(cb, 30_000);
  return () => window.clearInterval(id);
}

/** Wall clock rounded to the minute (null during prerender) — for "5m ago" labels. */
export function useMinuteClock(): number | null {
  return useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => null,
  );
}
