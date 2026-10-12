"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BinCard } from "@/components/BinCard";
import { CampusMap } from "@/components/CampusMap";
import { MonthlyChart } from "@/components/MonthlyChart";
import { ActivityFeed, CleanerPanel, CollectionQueue, Leaderboard, LevelBreakdown, PantryLeaderboard, PantryWatch } from "@/components/FleetPanels";
import {
  EVENT_LIMIT,
  avgCaddyKg,
  collectionsWeek,
  depositsToday,
  etaText,
  levelBreakdown,
  pantriesByKg,
  quietPantries,
  ranking,
  repurposedMonth,
  seedEvents,
  velocityKgPerDay,
  type BinEvent,
} from "@/lib/analytics";
import { BIN_CAPACITY_KG, INITIAL_BINS, levelsFor, pantryLabel, statusFor, totalPantries, type Bin } from "@/lib/bins";

const BINS_KEY = "smartbin-weights-v2";
const EVENTS_KEY = "smartbin-events-v1";

function loadBins(): Bin[] {
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

function loadEvents(): BinEvent[] {
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

function rid(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)}`;
}

type Filter = "all" | "needs" | "ok";

export function DashboardClient() {
  const [bins, setBins] = useState<Bin[]>(loadBins);
  // Events + clock populate after mount: Date.now() during static prerender is an error.
  const [events, setEvents] = useState<BinEvent[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState("bin-soe");
  const [filter, setFilter] = useState<Filter>("all");
  const [demoOn, setDemoOn] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const binsRef = useRef(bins);
  binsRef.current = bins;

  useEffect(() => {
    try {
      window.localStorage.setItem(BINS_KEY, JSON.stringify(bins));
    } catch {
      // storage full/blocked — dashboard still works in-memory
    }
  }, [bins]);

  useEffect(() => {
    try {
      window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, EVENT_LIMIT)));
    } catch {
      // storage full/blocked — dashboard still works in-memory
    }
  }, [events]);

  function pushEvent(e: BinEvent) {
    setEvents((prev) => [e, ...prev].slice(0, EVENT_LIMIT));
  }

  function collect(id: string) {
    const b = binsRef.current.find((x) => x.id === id);
    if (!b || b.weightKg <= 0) return;
    const at = new Date().toISOString();
    pushEvent({ id: rid(), at, binId: id, type: "collect", kg: b.weightKg });
    setBins((prev) =>
      prev.map((x) => (x.id === id ? { ...x, weightKg: 0, updatedAt: at } : x)),
    );
  }

  /** Cleaner empties a pantry caddy into the building's smart bin. */
  function deposit(binId: string, level: number, kg: number) {
    if (!(kg > 0)) return;
    const b = binsRef.current.find((x) => x.id === binId);
    if (!b || b.weightKg >= BIN_CAPACITY_KG) return;
    const w = Math.min(BIN_CAPACITY_KG, Math.round((b.weightKg + kg) * 100) / 100);
    const added = Math.round((w - b.weightKg) * 100) / 100;
    if (added <= 0) return;
    const at = new Date().toISOString();
    pushEvent({ id: rid(), at, binId, level, pantry: pantryLabel(b, level), type: "deposit", kg: added });
    setBins((prev) =>
      prev.map((x) => (x.id === binId ? { ...x, weightKg: w, updatedAt: at } : x)),
    );
  }

  function select(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() =>
      document
        .getElementById(`bin-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }

  function resetDemo() {
    setDemoOn(false);
    setBins(INITIAL_BINS);
    setEvents(seedEvents());
  }

  // Single-button demo: live deposits, auto-collect when 2+ bins are full.
  useEffect(() => {
    if (!demoOn) return;
    const id = setInterval(() => {
      const prev = binsRef.current;
      const cands = prev.filter((b) => b.weightKg < BIN_CAPACITY_KG);
      if (!cands.length) {
        setDemoOn(false);
        return;
      }
      const pick = cands[Math.floor(Math.random() * cands.length)];
      const add = Math.round((0.1 + Math.random() * 0.3) * 100) / 100;
      const w = Math.min(BIN_CAPACITY_KG, Math.round((pick.weightKg + add) * 100) / 100);
      const at = new Date().toISOString();
      const level = 1 + Math.floor(Math.random() * levelsFor(pick.id));
      pushEvent({ id: rid(), at, binId: pick.id, level, pantry: pantryLabel(pick, level), type: "deposit", kg: Math.round((w - pick.weightKg) * 100) / 100 });
      let next = prev.map((b) => (b.id === pick.id ? { ...b, weightKg: w, updatedAt: at } : b));
      const fulls = next.filter((b) => b.weightKg >= BIN_CAPACITY_KG);
      if (fulls.length >= 2) {
        const oldest = [...fulls].sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1))[0];
        pushEvent({ id: rid(), at, binId: oldest.id, type: "collect", kg: oldest.weightKg });
        next = next.map((b) => (b.id === oldest.id ? { ...b, weightKg: 0, updatedAt: at } : b));
      }
      setBins(next);
    }, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoOn]);

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
    setEvents(loadEvents());
    setNow(Date.now());
    syncFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = bins.reduce((s, b) => s + b.weightKg, 0);
  const full = bins.filter((b) => statusFor(b.weightKg) === "full").length;
  const near = bins.filter((b) => statusFor(b.weightKg) === "near").length;
  const needs = full + near;
  const repurposed = now === null ? 0 : repurposedMonth(events, now);
  const today = now === null ? 0 : depositsToday(events, now);

  const etas = new Map(
    bins.map(
      (b) =>
        [b.id, now === null ? null : etaText(b.weightKg, velocityKgPerDay(events, b.id, now))] as const,
    ),
  );
  const queue = bins
    .filter((b) => statusFor(b.weightKg) !== "ok")
    .sort((a, b) =>
      statusFor(a.weightKg) === statusFor(b.weightKg)
        ? b.weightKg - a.weightKg
        : statusFor(a.weightKg) === "full"
          ? -1
          : 1,
    );
  const visible = bins.filter((b) =>
    filter === "all"
      ? true
      : filter === "needs"
        ? statusFor(b.weightKg) !== "ok"
        : statusFor(b.weightKg) === "ok",
  );
  const dimmed = new Set(bins.filter((b) => !visible.includes(b)).map((b) => b.id));

  const shortOf = (id: string) => bins.find((b) => b.id === id)?.short ?? id;
  const selected = bins.find((b) => b.id === selectedId) ?? bins[0];
  const pantryStats = now === null ? [] : pantriesByKg(events, shortOf, 7, now);
  const topByBin = new Map<string, string>();
  for (const p of pantryStats) {
    if (!topByBin.has(p.binId)) topByBin.set(p.binId, `L${p.level}`);
  }
  const breakdown =
    now === null || !selected
      ? []
      : levelBreakdown(events, selected.id, levelsFor(selected.id), 7, now);
  const quiet =
    now === null ? [] : quietPantries(events, bins, levelsFor, 7, now);
  const avgCaddy = now === null ? null : avgCaddyKg(events, 7, now);
  const week = now === null ? { count: 0, kg: 0 } : collectionsWeek(events, 7, now);

  const stats: Array<[string, string]> = [
    ["Fleet total", `${total.toFixed(2)} kg`],
    ["Repurposed · month", `${repurposed.toFixed(1)} kg`],
    ["Needs collection", String(needs)],
    ["Pantry empties · today", String(today)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl bg-[#0e2a47] text-white">
        <div className="h-1 bg-[#c5a253]" />
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-6 sm:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#c5a253]">
              SMU SUSTAINABILITY · CAMPUS COFFEE LOOP
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Smart Bin Dashboard</h1>
            <p className="mt-1 text-sm text-white/70">
              Spent coffee grounds, weighed live across {bins.length} smart bins ·{" "}
              {totalPantries()} pantries.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDemoOn((v) => !v)}
              className={`h-10 rounded-md px-4 text-sm font-semibold ${
                demoOn ? "bg-[#c5a253] text-[#0e2a47]" : "bg-white text-[#0e2a47]"
              }`}
            >
              {demoOn ? "⏸ Pause live day" : "▶ Simulate live day"}
            </button>
            <button
              type="button"
              onClick={resetDemo}
              className="h-10 rounded-md border border-white/30 px-3 text-sm text-white/80 hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <dt className="text-sm text-zinc-500">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {value}
              {label === "Needs collection" && needs > 0 && (
                <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
              )}
            </dd>
          </div>
        ))}
      </dl>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
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
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <CleanerPanel bins={bins} initialBinId={selectedId} onDeposit={deposit} />
          <h2 className="font-semibold">
            Collection queue{" "}
            <span className="font-normal text-zinc-500">
              {demoOn ? "· live" : "· sorted by urgency"}
            </span>
          </h2>
          <CollectionQueue bins={queue} etas={etas} onCollect={collect} onSelect={select} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((bin) => (
          <BinCard
            key={bin.id}
            bin={bin}
            selected={bin.id === selectedId}
            eta={etas.get(bin.id) ?? null}
            levels={levelsFor(bin.id)}
            topPantry={topByBin.get(bin.id) ?? null}
            onCollect={collect}
            onSelect={setSelectedId}
          />
        ))}
      </section>
      {visible.length === 0 && (
        <p className="text-sm text-zinc-500">
          Nothing here — every bin is clear. Switch the filter to see the fleet.
        </p>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <PantryLeaderboard stats={pantryStats} />
        <LevelBreakdown binShort={selected?.short ?? ""} rows={breakdown} />
        <PantryWatch quiet={quiet} avgCaddy={avgCaddy} week={week} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <MonthlyChart currentTotalKg={repurposed} />
        <Leaderboard ranking={ranking(events)} bins={bins} />
        <ActivityFeed events={events} bins={bins} now={now} />
      </section>

      <p className="text-sm text-zinc-500">
        Weighing a bin by hand? <Link href="/scan" className="underline">Scan it with the camera</Link> or{" "}
        <Link href="/" className="underline">upload a scale photo</Link>.
      </p>
    </div>
  );
}
