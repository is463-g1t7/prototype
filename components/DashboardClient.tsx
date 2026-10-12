"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuditTrail } from "@/components/AuditTrail";
import { BinSpotlight } from "@/components/BinSpotlight";
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
import { CLEANERS, cleanerById } from "@/lib/cleaners";
import { BINS_KEY, EVENTS_KEY, loadBins, loadEvents, rid, round2, saveBins, saveEvents } from "@/lib/store";

type Filter = "all" | "needs" | "ok";

export function DashboardClient() {
  // Bins, events + clock populate after mount: localStorage isn't there during prerender,
  // and Date.now() during static prerender is an error.
  const [bins, setBins] = useState<Bin[]>(INITIAL_BINS);
  const [events, setEvents] = useState<BinEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState("bin-soe");
  const [filter, setFilter] = useState<Filter>("all");
  const [demoOn, setDemoOn] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [live, setLive] = useState<BinEvent | null>(null);
  const binsRef = useRef(bins);
  binsRef.current = bins;

  // Guarded so the empty pre-mount state never overwrites what's stored.
  useEffect(() => {
    if (hydrated) saveBins(bins);
  }, [bins, hydrated]);

  useEffect(() => {
    if (hydrated) saveEvents(events);
  }, [events, hydrated]);

  function pushEvent(e: BinEvent) {
    setEvents((prev) => [e, ...prev].slice(0, EVENT_LIMIT));
  }

  function collect(id: string) {
    const b = binsRef.current.find((x) => x.id === id);
    if (!b || b.weightKg <= 0) return;
    const at = new Date().toISOString();
    pushEvent({ id: rid(), at, binId: id, type: "collect", kg: b.weightKg, beforeKg: b.weightKg, afterKg: 0 });
    setBins((prev) =>
      prev.map((x) => (x.id === id ? { ...x, weightKg: 0, updatedAt: at } : x)),
    );
  }

  /** Cleaner empties a pantry caddy into the building's smart bin (hand-logged). */
  function deposit(binId: string, level: number, kg: number, cleanerId: string) {
    if (!(kg > 0)) return;
    const b = binsRef.current.find((x) => x.id === binId);
    if (!b || b.weightKg >= BIN_CAPACITY_KG) return;
    const w = Math.min(BIN_CAPACITY_KG, round2(b.weightKg + kg));
    const added = round2(w - b.weightKg);
    if (added <= 0) return;
    const at = new Date().toISOString();
    pushEvent({
      id: rid(),
      at,
      binId,
      level,
      pantry: pantryLabel(b, level),
      type: "deposit",
      kg: added,
      cleanerId,
      source: "manual",
      beforeKg: b.weightKg,
      afterKg: w,
    });
    setBins((prev) =>
      prev.map((x) => (x.id === binId ? { ...x, weightKg: w, updatedAt: at } : x)),
    );
  }

  /** Map pin, bin tab or queue row: switch the spotlight card to this bin and bring it into view. */
  function select(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() =>
      document
        .getElementById("bin-spotlight")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
  }

  /** Filter chips: if the spotlighted bin drops out of the filter, jump to the first that's in it. */
  function applyFilter(f: Filter) {
    setFilter(f);
    const keep = (b: Bin) =>
      f === "all" ? true : f === "needs" ? statusFor(b.weightKg) !== "ok" : statusFor(b.weightKg) === "ok";
    const current = bins.find((b) => b.id === selectedId);
    if (current && !keep(current)) {
      const first = bins.find(keep);
      if (first) setSelectedId(first.id);
    }
  }

  function resetDemo() {
    setDemoOn(false);
    setLive(null);
    // Stamp now so older server readings don't re-apply on the next sync.
    const at = new Date().toISOString();
    setBins(INITIAL_BINS.map((b) => ({ ...b, updatedAt: at })));
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
      const add = round2(0.2 + Math.random() * 0.6);
      const w = Math.min(BIN_CAPACITY_KG, round2(pick.weightKg + add));
      const at = new Date().toISOString();
      const level = 1 + Math.floor(Math.random() * levelsFor(pick.id));
      const cleaner = CLEANERS[Math.floor(Math.random() * CLEANERS.length)];
      pushEvent({
        id: rid(),
        at,
        binId: pick.id,
        level,
        pantry: pantryLabel(pick, level),
        type: "deposit",
        kg: round2(w - pick.weightKg),
        cleanerId: cleaner.id,
        source: "demo",
        beforeKg: pick.weightKg,
        afterKg: w,
      });
      let next = prev.map((b) => (b.id === pick.id ? { ...b, weightKg: w, updatedAt: at } : b));
      const fulls = next.filter((b) => b.weightKg >= BIN_CAPACITY_KG);
      if (fulls.length >= 2) {
        const oldest = [...fulls].sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1))[0];
        pushEvent({ id: rid(), at, binId: oldest.id, type: "collect", kg: oldest.weightKg, beforeKg: oldest.weightKg, afterKg: 0 });
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
    setBins(loadBins());
    setEvents(loadEvents());
    setHydrated(true);
    setNow(Date.now());
    // Deep link from the cleaner flow: /dashboard?bin=bin-scis
    const bin = new URLSearchParams(window.location.search).get("bin");
    if (bin && INITIAL_BINS.some((b) => b.id === bin)) setSelectedId(bin);
    syncFromServer();

    // Cleaner flow in another tab writes the same storage: follow it live.
    function onStorage(e: StorageEvent) {
      if (e.key !== BINS_KEY && e.key !== EVENTS_KEY) return;
      setBins(loadBins());
      const next = loadEvents();
      setEvents(next);
      setNow(Date.now());
      const newest = next[0];
      if (e.key === EVENTS_KEY && newest && newest.cleanerId && Date.now() - Date.parse(newest.at) < 60_000) {
        setLive(newest);
        setSelectedId(newest.binId);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
      <div className="overflow-hidden rounded-xl bg-brand text-white">
        <div className="h-1 bg-gold" />
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-6 sm:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-gold">
              SMU SUSTAINABILITY · CAMPUS COFFEE LOOP
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Smart Bin Dashboard</h1>
            <p className="mt-1 text-sm text-white/70">
              Spent coffee grounds, weighed live across {bins.length} smart bins ·{" "}
              {totalPantries()} pantries.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/cleaner"
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center rounded-md border border-white/30 px-3 text-sm font-medium text-white hover:bg-white/10"
              title="Opens the cleaner app in a new tab; drop-offs appear here live"
            >
              Cleaner app ↗
            </Link>
            <button
              type="button"
              onClick={() => setDemoOn((v) => !v)}
              className={`h-10 rounded-md px-4 text-sm font-semibold ${
                demoOn ? "bg-gold text-brand" : "bg-card text-brand"
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

      {live && (
        <div
          role="status"
          className="flex animate-rise flex-wrap items-center gap-3 rounded-xl border border-leaf/40 bg-tint-leaf px-4 py-3 text-sm"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">
            {cleanerById(live.cleanerId)?.initials ?? "?"}
          </span>
          <p className="min-w-0 flex-1">
            <span className="font-semibold text-pine">Live drop-off · </span>
            {cleanerById(live.cleanerId)?.name ?? "A cleaner"} emptied{" "}
            <span className="font-medium">{live.pantry}</span> into the central bin:{" "}
            <span className="font-semibold tabular-nums">+{live.kg.toFixed(2)} kg</span>{" "}
            <span className="text-muted tabular-nums">
              ({live.beforeKg?.toFixed(2)} → {live.afterKg?.toFixed(2)} kg
              {live.source === "ocr" ? ", read by scale OCR" : live.source === "reference" ? ", OCR fallback" : ""})
            </span>
          </p>
          <button
            type="button"
            onClick={() => setLive(null)}
            className="shrink-0 text-xs font-medium text-muted underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-line bg-card px-4 py-3"
          >
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {value}
              {label === "Needs collection" && needs > 0 && (
                <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-roof" />
              )}
            </dd>
          </div>
        ))}
      </dl>

      <section>
        <div>
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
                onClick={() => applyFilter(f)}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  filter === f
                    ? "bg-brand text-white"
                    : "border border-line bg-card hover:bg-sand"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={syncFromServer}
              className="ml-auto rounded-full border border-line bg-card px-3 py-1 text-sm font-medium hover:bg-sand"
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
      </section>

      <BinSpotlight
        bins={bins}
        selectedId={selectedId}
        dimmedIds={dimmed}
        etas={etas}
        topPantries={topByBin}
        onSelect={select}
        onCollect={collect}
      />

      {selected && (
        <AuditTrail bin={selected} events={events} now={now} highlightId={live?.id ?? null} />
      )}

      {/* grid-cols-1 = minmax(0,1fr): stops long <select> options widening the phone column */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <CleanerPanel bins={bins} initialBinId={selectedId} onDeposit={deposit} />
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">
            Collection queue{" "}
            <span className="font-normal text-muted">
              {demoOn ? "· live" : "· sorted by urgency"}
            </span>
          </h2>
          <CollectionQueue bins={queue} etas={etas} onCollect={collect} onSelect={select} />
        </div>
      </section>

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

      <p className="text-sm text-muted">
        Cleaners check in at <Link href="/cleaner" className="underline">the cleaner app</Link>. Weighing a bin by
        hand? <Link href="/scan" className="underline">Scan it with the camera</Link> or{" "}
        <Link href="/" className="underline">upload a scale photo</Link>.
      </p>
    </div>
  );
}
