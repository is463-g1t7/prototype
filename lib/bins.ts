export const BIN_CAPACITY_KG = 5;
export const NEAR_FULL_KG = 4;

export type BinStatus = "ok" | "near" | "full";

export type Bin = {
  id: string;
  short: string;
  name: string;
  /** Home location of the building's single smart bin (pantries live one-per-level). */
  pantry: string;
  weightKg: number;
  updatedAt: string;
};

export const INITIAL_BINS: Bin[] = [
  { id: "bin-soa", short: "SOA", name: "School of Accountancy", pantry: "SOA Lobby · L1", weightKg: 2.4, updatedAt: "2026-10-12T08:02:00.000Z" },
  { id: "bin-lkcsb", short: "LKCSB", name: "Lee Kong Chian School of Business", pantry: "LKCSB Lobby · L1", weightKg: 4.2, updatedAt: "2026-10-12T08:04:00.000Z" },
  { id: "bin-soe", short: "SOE", name: "School of Economics", pantry: "SOE Lobby · L1", weightKg: 5.0, updatedAt: "2026-10-12T08:06:00.000Z" },
  { id: "bin-scis", short: "SCIS", name: "School of Computing and Information Systems", pantry: "SCIS Lobby · L1", weightKg: 0.6, updatedAt: "2026-10-12T08:08:00.000Z" },
  { id: "bin-yphsl", short: "YPHSL", name: "Yong Pung How School of Law", pantry: "YPHSL Lobby · L1", weightKg: 1.8, updatedAt: "2026-10-12T08:10:00.000Z" },
  { id: "bin-soss", short: "SOSS", name: "School of Social Sciences", pantry: "SOSS Lobby · L1", weightKg: 3.2, updatedAt: "2026-10-12T08:12:00.000Z" },
  { id: "bin-lib", short: "LIB", name: "Li Ka Shing Library", pantry: "LIB Lobby · L1", weightKg: 1.1, updatedAt: "2026-10-12T08:14:00.000Z" },
];

/** One pantry per level, one smart bin per building. Levels per building. */
export const BUILDING_LEVELS: Record<string, number> = {
  "bin-soa": 5,
  "bin-lkcsb": 4,
  "bin-soe": 4,
  "bin-scis": 5,
  "bin-yphsl": 6,
  "bin-soss": 4,
  "bin-lib": 5,
};

export function levelsFor(binId: string): number {
  return BUILDING_LEVELS[binId] ?? 4;
}

export function pantryLabel(bin: Pick<Bin, "short">, level: number): string {
  return `${bin.short} · L${level}`;
}

export function totalPantries(): number {
  return INITIAL_BINS.reduce((s, b) => s + levelsFor(b.id), 0);
}

export function statusFor(weightKg: number): BinStatus {
  if (weightKg >= BIN_CAPACITY_KG) return "full";
  if (weightKg >= NEAR_FULL_KG) return "near";
  return "ok";
}

export function parseKgFromOcrText(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (Number.isNaN(n)) return null;
  return Math.min(BIN_CAPACITY_KG, Math.max(0, n));
}
