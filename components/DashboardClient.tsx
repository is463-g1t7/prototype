"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BinCard } from "@/components/BinCard";
import { CampusMap } from "@/components/CampusMap";
import { MonthlyChart } from "@/components/MonthlyChart";
import {
  INITIAL_BINS,
  parseKgFromOcrText,
  statusFor,
  type Bin,
} from "@/lib/bins";

const STORAGE_KEY = "smartbin-weights-v1";

type Filter = "all" | "needs" | "ok";

function loadBins(): Bin[] {
  if (typeof window === "undefined") return INITIAL_BINS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_BINS;
    const parsed = JSON.parse(raw) as Bin[];
    // ponytail: shape-check by id set, full schema validation if contract drifts
    const ids = new Set(INITIAL_BINS.map((b) => b.id));
    if (Array.isArray(parsed) && parsed.every((b) => b && ids.has(b.id))) return parsed;
    return INITIAL_BINS;
  } catch {
    return INITIAL_BINS;
  }
}

export function DashboardClient() {
  const [bins, setBins] = useState<Bin[]>(loadBins);
  const [selectedId, setSelectedId] = useState("bin-soe");
  const [filter, setFilter] = useState<Filter>("all");
  const [ocrText, setOcrText] = useState("");
  const [ocrBinId, setOcrBinId] = useState(INITIAL_BINS[0]?.id ?? "");
  const [ocrMsg, setOcrMsg] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bins));
    } catch {
      // storage full/blocked — dashboard still works in-memory
    }
  }, [bins]);

  async function syncFromServer() {
    try {
      const res = await fetch("/api/readings");
      const data = (await res.json()) as {
        readings: Array<{ binId: string; weightKg: number; at: string }>;
      };
      if (!res.ok || !Array.isArray(data.readings)) return;
      setBins((prev) =>
        prev.map((b) => {
          const latest = data.readings.find((r) => r.binId === b.id);
          return latest && latest.at > b.updatedAt
            ? { ...b, weightKg: latest.weightKg, updatedAt: latest.at }
            : b;
        }),
      );
      setSyncedAt(new Date().toLocaleTimeString());
    } catch {
      // offline — local state stands
    }
  }

  useEffect(() => {
    syncFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(id: string, kg: number) {
    setBins((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, weightKg: Math.min(5, Math.max(0, kg)), updatedAt: new Date().toISOString() }
          : b,
      ),
    );
  }

  function deposit(id: string) {
    const b = bins.find((x) => x.id === id);
    if (b) handleChange(id, b.weightKg + 0.3);
  }

  function collect(id: string) {
    handleChange(id, 0);
  }

  function select(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() =>
      document
        .getElementById(`bin-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }

  function applyOcr() {
    const kg = parseKgFromOcrText(ocrText);
    if (kg == null) {
      setOcrMsg("No weight found in that text — try e.g. “2.40 kg”.");
      return;
    }
    handleChange(ocrBinId, kg);
    setOcrMsg(`Set to ${kg.toFixed(2)} kg.`);
    select(ocrBinId);
  }

  const total = bins.reduce((s, b) => s + b.weightKg, 0);
  const full = bins.filter((b) => statusFor(b.weightKg) === "full").length;
  const near = bins.filter((b) => statusFor(b.weightKg) === "near").length;
  const needs = full + near;

  const visible = bins.filter((b) =>
    filter === "all"
      ? true
      : filter === "needs"
        ? statusFor(b.weightKg) !== "ok"
        : statusFor(b.weightKg) === "ok",
  );
  const dimmed = new Set(
    bins.filter((b) => !visible.includes(b)).map((b) => b.id),
  );

  const stats: Array<[string, string]> = [
    ["Fleet total", `${total.toFixed(2)} kg`],
    ["Full bins", String(full)],
    ["Near-full bins", String(near)],
    ["Month total", `${total.toFixed(2)} kg`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl bg-[#0e2a47] text-white">
        <div className="h-1 bg-[#c5a253]" />
        <div className="px-5 py-6 sm:px-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#c5a253]">
            SMU SUSTAINABILITY · CAMPUS COFFEE LOOP
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Smart Bin Dashboard</h1>
          <p className="mt-1 text-sm text-white/70">
            Spent coffee grounds, weighed live across seven pantries. Click a map pin
            to inspect a bin.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <dt className="text-sm text-zinc-500">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["all", "All bins"],
              ["needs", `Needs collection (${needs})`],
              ["ok", "OK"],
            ] as Array<[Filter, string]>
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                filter === f
                  ? "bg-[#0e2a47] text-white"
                  : "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={syncFromServer}
            className="ml-auto rounded-full border border-zinc-300 px-3 py-1 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            ↻ Sync{syncedAt ? ` · ${syncedAt}` : ""}
          </button>
        </div>
        <CampusMap
          bins={bins}
          selectedId={selectedId}
          dimmedIds={dimmed}
          onSelect={select}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((bin) => (
          <BinCard
            key={bin.id}
            bin={bin}
            selected={bin.id === selectedId}
            onChange={handleChange}
            onDeposit={deposit}
            onCollect={collect}
          />
        ))}
      </section>
      {visible.length === 0 && (
        <p className="text-sm text-zinc-500">
          Nothing here — every bin is clear. Switch the filter to see the fleet.
        </p>
      )}

      <MonthlyChart currentTotalKg={total} />

      <section className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold">Fill from OCR text</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ocrBinId}
            onChange={(e) => setOcrBinId(e.target.value)}
            className="h-10 rounded-md border border-zinc-300 bg-background px-3 text-sm dark:border-zinc-700"
            aria-label="Bin for OCR weight"
          >
            {bins.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.short})
              </option>
            ))}
          </select>
          <input
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            placeholder="Paste OCR line (e.g. 2.40 kg)"
            className="h-10 min-w-52 flex-1 rounded-md border border-zinc-300 bg-background px-3 text-sm dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={applyOcr}
            className="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Apply
          </button>
        </div>
        {ocrMsg && <p className="text-sm text-zinc-500">{ocrMsg}</p>}
        <p className="text-sm text-zinc-500">
          Need the real thing? <Link href="/" className="underline">Upload a scale photo</Link> and
          paste a line here.
        </p>
      </section>
    </div>
  );
}
