export type ReadingSource = "ocr" | "simulated" | "manual";

export type Reading = {
  binId: string;
  weightKg: number;
  at: string;
  source: ReadingSource;
  /** Pantry the weighed grounds came from, e.g. "SCIS · L3" (scan provenance). */
  pantry?: string;
};

// ponytail: in-memory — readings vanish on redeploy/scale-out; move to Vercel KV/Postgres when history must survive
const store: Reading[] = [];

export function addReading(r: Reading): Reading {
  store.push(r);
  return r;
}

/** Newest first. */
export function listReadings(): Reading[] {
  return [...store].reverse();
}

export function latestPerBin(): Record<string, Reading> {
  const out: Record<string, Reading> = {};
  for (const r of store) {
    if (!out[r.binId] || out[r.binId].at < r.at) out[r.binId] = r;
  }
  return out;
}
