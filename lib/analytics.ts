export type BinEventType = "deposit" | "collect";

export type BinEvent = {
  id: string;
  at: string;
  binId: string;
  /** Pantry level the grounds were emptied from (deposits only). */
  level?: number;
  /** Denormalized label at write time, e.g. "SCIS · L3". */
  pantry?: string;
  type: BinEventType;
  kg: number;
};

export const EVENT_LIMIT = 200;

const DAY = 86_400_000;

function ev(
  id: string,
  daysAgo: number,
  binId: string,
  type: BinEventType,
  kg: number,
  level?: number,
  pantry?: string,
): BinEvent {
  return { id, at: new Date(Date.now() - daysAgo * DAY).toISOString(), binId, type, kg, level, pantry };
}

/** Newest first. Enough history that velocity, queue and leaderboard render on first load. */
export function seedEvents(): BinEvent[] {
  return [
    ev("seed-1", 0.1, "bin-lib", "deposit", 0.3, 4, "LIB · L4"),
    ev("seed-2", 0.3, "bin-scis", "deposit", 0.2, 3, "SCIS · L3"),
    ev("seed-3", 0.6, "bin-soa", "deposit", 0.4, 2, "SOA · L2"),
    ev("seed-4", 1.2, "bin-soss", "deposit", 0.6, 1, "SOSS · L1"),
    ev("seed-5", 1.8, "bin-lkcsb", "deposit", 0.9, 2, "LKCSB · L2"),
    ev("seed-6", 2.5, "bin-soe", "deposit", 1.2, 3, "SOE · L3"),
    ev("seed-7", 3.2, "bin-lkcsb", "collect", 4.5),
    ev("seed-8", 4.6, "bin-soe", "collect", 4.8),
  ];
}

export function repurposedMonth(events: BinEvent[], now = Date.now()): number {
  const m = new Date(now).getMonth();
  const y = new Date(now).getFullYear();
  return events.reduce((s, e) => {
    const d = new Date(e.at);
    return e.type === "collect" && d.getMonth() === m && d.getFullYear() === y ? s + e.kg : s;
  }, 0);
}

export function depositsToday(events: BinEvent[], now = Date.now()): number {
  const start = new Date(now).setHours(0, 0, 0, 0);
  return events.filter((e) => e.type === "deposit" && new Date(e.at).getTime() >= start).length;
}

/** kg/day over the trailing 7 days, null until a bin has deposit history. */
export function velocityKgPerDay(events: BinEvent[], binId: string, now = Date.now()): number | null {
  const from = now - 7 * DAY;
  const deps = events.filter(
    (e) => e.type === "deposit" && e.binId === binId && new Date(e.at).getTime() >= from,
  );
  if (!deps.length) return null;
  const oldest = Math.min(...deps.map((e) => new Date(e.at).getTime()));
  const days = Math.min(7, Math.max(1, (now - oldest) / DAY));
  return deps.reduce((s, e) => s + e.kg, 0) / days;
}

export function etaText(weightKg: number, vel: number | null): string | null {
  if (weightKg >= 5) return "FULL";
  if (vel == null || vel <= 0) return null;
  const days = (5 - weightKg) / vel;
  if (days < 1 / 24) return "full in <1h";
  if (days < 1) return `full in ~${Math.max(1, Math.round(days * 24))}h`;
  if (days < 30) return `full in ~${Math.round(days)}d`;
  return null;
}

/** Collected kg per bin, descending. */
export function ranking(events: BinEvent[]): Array<{ binId: string; kg: number }> {
  const sums = new Map<string, number>();
  for (const e of events) {
    if (e.type === "collect") sums.set(e.binId, (sums.get(e.binId) ?? 0) + e.kg);
  }
  return [...sums.entries()]
    .map(([binId, kg]) => ({ binId, kg: Math.round(kg * 100) / 100 }))
    .sort((a, b) => b.kg - a.kg);
}

export function ago(iso: string, now = Date.now()): string {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export type PantryStat = { binId: string; level: number; pantry: string; kg: number; count: number };

/** Deposit sources ranked by kg over the trailing `days` (default 7). */
export function pantriesByKg(
  events: BinEvent[],
  shortOf: (binId: string) => string,
  days = 7,
  now = Date.now(),
): PantryStat[] {
  const from = now - days * DAY;
  const sums = new Map<string, PantryStat>();
  for (const e of events) {
    if (e.type !== "deposit" || new Date(e.at).getTime() < from) continue;
    if (e.level == null) continue; // legacy event without provenance — skip
    const key = `${e.binId}::${e.level}`;
    const cur = sums.get(key) ?? {
      binId: e.binId,
      level: e.level,
      pantry: e.pantry ?? `${shortOf(e.binId)} · L${e.level}`,
      kg: 0,
      count: 0,
    };
    cur.kg = Math.round((cur.kg + e.kg) * 100) / 100;
    cur.count += 1;
    sums.set(key, cur);
  }
  return [...sums.values()].sort((a, b) => b.kg - a.kg);
}

/** Per-level kg/count for one building over the trailing `days` (default 7). */
export function levelBreakdown(
  events: BinEvent[],
  binId: string,
  levels: number,
  days = 7,
  now = Date.now(),
): Array<{ level: number; kg: number; count: number }> {
  const from = now - days * DAY;
  const rows = Array.from({ length: levels }, (_, i) => ({ level: i + 1, kg: 0, count: 0 }));
  for (const e of events) {
    if (e.type !== "deposit" || e.binId !== binId || e.level == null) continue;
    if (new Date(e.at).getTime() < from || e.level < 1 || e.level > levels) continue;
    rows[e.level - 1].kg = Math.round((rows[e.level - 1].kg + e.kg) * 100) / 100;
    rows[e.level - 1].count += 1;
  }
  return rows;
}

/** Pantry labels with no deposits in the trailing `days` — supervision cue. */
export function quietPantries(
  events: BinEvent[],
  bins: Array<{ id: string; short: string }>,
  levelsOf: (binId: string) => number,
  days = 7,
  now = Date.now(),
): string[] {
  const from = now - days * DAY;
  const seen = new Set(
    events
      .filter((e) => e.type === "deposit" && e.level != null && new Date(e.at).getTime() >= from)
      .map((e) => `${e.binId}::${e.level}`),
  );
  const out: string[] = [];
  for (const b of bins) {
    for (let l = 1; l <= levelsOf(b.id); l++) {
      if (!seen.has(`${b.id}::${l}`)) out.push(eLabel(b.short, l));
    }
  }
  return out;
}

function eLabel(short: string, level: number): string {
  return `${short} · L${level}`;
}

/** Mean caddy emptied (kg per deposit) over the trailing `days`. */
export function avgCaddyKg(events: BinEvent[], days = 7, now = Date.now()): number | null {
  const from = now - days * DAY;
  const deps = events.filter((e) => e.type === "deposit" && new Date(e.at).getTime() >= from);
  if (!deps.length) return null;
  return deps.reduce((s, e) => s + e.kg, 0) / deps.length;
}

/** Collections over the trailing `days`: count + total kg. */
export function collectionsWeek(
  events: BinEvent[],
  days = 7,
  now = Date.now(),
): { count: number; kg: number } {
  const from = now - days * DAY;
  const cols = events.filter((e) => e.type === "collect" && new Date(e.at).getTime() >= from);
  return {
    count: cols.length,
    kg: Math.round(cols.reduce((s, e) => s + e.kg, 0) * 100) / 100,
  };
}
