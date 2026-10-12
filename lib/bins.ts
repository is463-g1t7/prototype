export const BIN_CAPACITY_KG = 5;
export const NEAR_FULL_KG = 4;

export type BinStatus = "ok" | "near" | "full";

export type Bin = {
  id: string;
  short: string;
  name: string;
  pantry: string;
  weightKg: number;
  updatedAt: string;
};

export const INITIAL_BINS: Bin[] = [
  { id: "bin-soa", short: "SOA", name: "School of Accountancy", pantry: "SOA Pantry L1", weightKg: 2.4, updatedAt: "2026-10-12T08:02:00.000Z" },
  { id: "bin-lkcsb", short: "LKCSB", name: "Lee Kong Chian School of Business", pantry: "LKCSB Pantry L2", weightKg: 4.2, updatedAt: "2026-10-12T08:04:00.000Z" },
  { id: "bin-soe", short: "SOE", name: "School of Economics", pantry: "SOE Pantry L1", weightKg: 5.0, updatedAt: "2026-10-12T08:06:00.000Z" },
  { id: "bin-scis", short: "SCIS", name: "School of Computing and Information Systems", pantry: "SCIS Pantry L3", weightKg: 0.6, updatedAt: "2026-10-12T08:08:00.000Z" },
  { id: "bin-yphsl", short: "YPHSL", name: "Yong Pung How School of Law", pantry: "YPHSL Pantry L2", weightKg: 1.8, updatedAt: "2026-10-12T08:10:00.000Z" },
  { id: "bin-soss", short: "SOSS", name: "School of Social Sciences", pantry: "SOSS Pantry L1", weightKg: 3.2, updatedAt: "2026-10-12T08:12:00.000Z" },
  { id: "bin-lib", short: "LIB", name: "Li Ka Shing Library", pantry: "LIB Pantry L4", weightKg: 1.1, updatedAt: "2026-10-12T08:14:00.000Z" },
];

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
