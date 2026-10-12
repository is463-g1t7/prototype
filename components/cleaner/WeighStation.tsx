"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BoxOverlay } from "@/components/BoxOverlay";
import type { BinEvent } from "@/lib/analytics";
import { BIN_CAPACITY_KG, INITIAL_BINS, levelsFor, pantryLabel } from "@/lib/bins";
import { cleanerById } from "@/lib/cleaners";
import type { OcrLine } from "@/lib/languages";
import { pickFrame, type ScaleFrame } from "@/lib/scales";
import { loadBins, recordCollect, recordScaleReading } from "@/lib/store";
import { CleanerShell, NeedsPass, StepColumns } from "./CleanerShell";

type Phase = "aligning" | "locked" | "captured" | "ocr" | "saved" | "rejected" | "failed" | "swap";

// LCD window within the overhead frames (fractions of width/height).
const LCD = { x: 0.425, y: 0.12, w: 0.15, h: 0.12 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** What the phone would upload: a downscaled JPEG of the current frame. */
async function captureFrame(src: string, maxW = 1600): Promise<Blob> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const scale = Math.min(1, maxW / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Capture failed."))),
      "image/jpeg",
      0.85,
    ),
  );
}

export function WeighStation() {
  const params = useSearchParams();
  const cleaner = cleanerById(params.get("cleaner"));
  const bin = INITIAL_BINS.find((b) => b.id === params.get("bin"));
  const level = Number(params.get("level"));
  const validLevel =
    bin != null && Number.isInteger(level) && level >= 1 && level <= levelsFor(bin.id);

  const [phase, setPhase] = useState<Phase>("aligning");
  const [frame, setFrame] = useState<ScaleFrame | null>(null);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [lines, setLines] = useState<OcrLine[]>([]);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [beforeKg, setBeforeKg] = useState<number | null>(null);
  const [readKg, setReadKg] = useState<number | null>(null);
  const [event, setEvent] = useState<BinEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [ocrMs, setOcrMs] = useState<number | null>(null);
  const runRef = useRef(0);

  async function run(exclude?: string) {
    if (!bin || !cleaner || !validLevel) return;
    const id = ++runRef.current;
    const live = () => runRef.current === id;
    setLines([]);
    setReadKg(null);
    setEvent(null);
    setError(null);
    setOcrMs(null);
    setShotUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    const before = loadBins().find((b) => b.id === bin.id)?.weightKg ?? 0;
    setBeforeKg(before);
    const next = pickFrame(before, exclude);
    if (!next) {
      setPhase("swap");
      return;
    }
    setFrame(next);
    setPhase("aligning");
    await sleep(1500);
    if (!live()) return;
    setPhase("locked");
    await sleep(900);
    if (!live()) return;

    let blob: Blob;
    try {
      blob = await captureFrame(next.src);
    } catch {
      setError("Camera capture failed.");
      setPhase("failed");
      return;
    }
    if (!live()) return;
    setShotUrl(URL.createObjectURL(blob));
    setPhase("captured");
    await sleep(500);
    if (!live()) return;

    setElapsed(0);
    setPhase("ocr");
    const body = new FormData();
    body.append("image", blob, "scale.jpg");
    body.append("bin", bin.id);
    body.append("level", String(level));
    body.append("cleaner", cleaner.id);
    body.append("prev", String(before));
    const started = Date.now();
    try {
      const res = await fetch("/api/scale-photo", { method: "POST", body });
      const data = await res.json();
      if (!live()) return;
      setOcrMs(Date.now() - started);
      if (Array.isArray(data.lines)) setLines(data.lines);
      if (res.status === 409) {
        setReadKg(data.kg ?? null);
        setPhase("rejected");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? `OCR failed (${res.status}).`);
      setReadKg(data.reading.weightKg);
      const saved = recordScaleReading({
        binId: bin.id,
        level,
        cleanerId: cleaner.id,
        afterKg: data.reading.weightKg,
        source: "ocr",
        photo: next.src,
        at: data.reading.at,
      });
      if (!saved) {
        setPhase("rejected");
        return;
      }
      setEvent(saved);
      setPhase("saved");
    } catch (err) {
      if (!live()) return;
      setError(err instanceof Error ? err.message : "OCR failed.");
      setPhase("failed");
    }
  }

  // Auto-start like a phone camera that captures once the display is in frame.
  // Deferred a tick so a StrictMode double-mount cancels the first run before it uploads.
  useEffect(() => {
    const t = window.setTimeout(() => run(), 0);
    const runs = runRef;
    return () => {
      window.clearTimeout(t);
      runs.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "ocr") return;
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(id);
  }, [phase]);

  if (!cleaner || !bin || !validLevel) {
    return (
      <CleanerShell step={3} cleaner={cleaner}>
        {cleaner ? (
          <div className="rounded-xl border border-line bg-card p-5 text-sm">
            <p className="font-semibold">Pick a building and pantry first</p>
            <Link
              href={`/cleaner/building?cleaner=${cleaner.id}`}
              className="mt-2 inline-block underline"
            >
              Back to pantry picker
            </Link>
          </div>
        ) : (
          <NeedsPass />
        )}
      </CleanerShell>
    );
  }

  const pantry = pantryLabel(bin, level);

  function applyReference() {
    if (!frame || !bin || !cleaner) return;
    const saved = recordScaleReading({
      binId: bin.id,
      level,
      cleanerId: cleaner.id,
      afterKg: frame.refKg,
      source: "reference",
      photo: frame.src,
    });
    setReadKg(frame.refKg);
    if (saved) {
      setEvent(saved);
      setPhase("saved");
    } else {
      setPhase("rejected");
    }
  }

  function swapBin() {
    if (!bin || !cleaner) return;
    recordCollect(bin.id, cleaner.id);
    run();
  }

  const showShot = shotUrl && phase !== "aligning" && phase !== "locked";
  const busy =
    phase === "aligning" || phase === "locked" || phase === "captured" || phase === "ocr";
  const steps: Array<[string, string | null, boolean]> = [
    [
      "Camera",
      phase === "aligning"
        ? "finding display…"
        : phase === "locked"
          ? "steady…"
          : shotUrl
            ? "auto-captured"
            : null,
      !!shotUrl,
    ],
    [
      "Upload",
      phase === "ocr" ? "/api/scale-photo…" : shotUrl && phase !== "captured" ? "sent" : null,
      !!ocrMs,
    ],
    [
      "PaddleOCR",
      phase === "ocr"
        ? `reading… ${elapsed}s`
        : lines.length
          ? lines.map((l) => `“${l.text}”`).join(" ")
          : ocrMs
            ? "no text"
            : null,
      lines.length > 0,
    ],
    ["Weight", readKg != null ? `${readKg.toFixed(2)} kg total` : null, readKg != null],
    ["Dashboard", phase === "saved" ? "updated" : null, phase === "saved"],
  ];

  return (
    <CleanerShell step={3} cleaner={cleaner}>
      <StepColumns
        main={
          <>
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <h1 className="text-lg font-semibold lg:text-2xl lg:tracking-tight">
                  Weigh the {bin.short} central bin
                </h1>
                <p className="text-sm text-muted">
                  Grounds from <span className="font-medium text-ink">{pantry}</span> pantry
                </p>
              </div>
              <Link
                href={`/cleaner/building?cleaner=${cleaner.id}`}
                className="shrink-0 text-xs text-muted underline"
              >
                Change
              </Link>
            </div>

            <section className="overflow-hidden rounded-xl border border-line bg-card">
              <div className="relative overflow-hidden bg-[#0b1520]">
                {showShot ? (
                  <BoxOverlay
                    src={shotUrl}
                    lines={lines}
                    size={size}
                    activeIndex={activeLine}
                    onActiveChange={setActiveLine}
                    onLoad={setSize}
                  />
                ) : frame ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={frame.src}
                    alt="Overhead camera view of the floor scale"
                    className={`block h-auto w-full transition-[filter,transform] duration-[1400ms] ease-out ${
                      phase === "aligning" ? "scale-110 blur-[3px]" : "scale-100 blur-0"
                    }`}
                  />
                ) : (
                  <div className="grid aspect-[16/9] place-items-center text-xs text-white/60">
                    {phase === "swap" ? "Camera paused · bin needs swapping" : "Starting camera…"}
                  </div>
                )}

                {(phase === "aligning" || phase === "locked") && frame && (
                  <>
                    <span
                      className={`pointer-events-none absolute rounded border-2 transition-colors ${
                        phase === "locked" ? "border-leaf" : "animate-pulse border-gold"
                      }`}
                      style={{
                        left: `${LCD.x * 100}%`,
                        top: `${LCD.y * 100}%`,
                        width: `${LCD.w * 100}%`,
                        height: `${LCD.h * 100}%`,
                      }}
                    />
                    <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-roof" /> LIVE ·
                      overhead cam
                    </span>
                    <span className="absolute inset-x-0 bottom-2 text-center text-xs font-medium text-white drop-shadow">
                      {phase === "aligning"
                        ? "Detecting scale display…"
                        : "Reading stable · capturing"}
                    </span>
                  </>
                )}
                {showShot && frame && (
                  // Zoomed LCD inset: the display is small in a whole-scale overhead frame.
                  <div
                    aria-hidden
                    className="absolute right-2 top-2 w-[34%] overflow-hidden rounded-md border-2 border-white shadow-lg"
                    style={{
                      aspectRatio: `${(LCD.w * 2752) / (LCD.h * 1536)}`,
                      backgroundImage: `url(${frame.src})`,
                      backgroundSize: `${100 / LCD.w}% auto`,
                      backgroundPosition: `${(LCD.x / (1 - LCD.w)) * 100}% ${(LCD.y / (1 - LCD.h)) * 100}%`,
                    }}
                  />
                )}
                {phase === "captured" && (
                  <span className="pointer-events-none absolute inset-0 animate-shutter bg-white" />
                )}
                {phase === "ocr" && (
                  <span className="absolute inset-x-0 bottom-2 text-center text-xs font-medium text-white drop-shadow">
                    Sending frame to PaddleOCR… {elapsed}s
                  </span>
                )}
              </div>

              <dl
                className={`flex flex-col gap-1.5 p-4 font-mono text-xs ${phase === "swap" ? "hidden" : ""}`}
              >
                {steps.map(([label, value, ok]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-muted">{label}</dt>
                    <dd className={`truncate text-right ${ok ? "text-pine" : ""}`}>
                      {value ?? "…"} {ok ? "✓" : ""}
                    </dd>
                  </div>
                ))}
              </dl>
              {phase === "ocr" && elapsed >= 8 && (
                <p className="mx-4 mb-4 rounded-md bg-tint-ochre px-3 py-2 text-xs text-ochre">
                  The OCR Space is waking from sleep. The first read can take up to a minute.
                </p>
              )}
            </section>
          </>
        }
        side={
          <>
            {busy && (
              // Laptop only: fills the side column while the camera works.
              <section className="hidden rounded-xl border border-line bg-card p-5 lg:block">
                <p className="text-xs font-semibold tracking-[0.15em] text-muted">
                  WEIGHING IN PROGRESS
                </p>
                <dl className="mt-3 flex flex-col gap-2 text-sm">
                  {(
                    [
                      ["Cleaner", `${cleaner.name} · ${cleaner.pass}`],
                      ["Building", bin.name],
                      ["Pantry", pantry],
                      [
                        "Bin before",
                        beforeKg == null ? "…" : `${beforeKg.toFixed(2)} / ${BIN_CAPACITY_KG} kg`,
                      ],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted">{k}</dt>
                      <dd className="text-right font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 flex items-center gap-2 rounded-md bg-sand px-3 py-2 text-xs text-muted">
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-gold" />
                  {phase === "ocr"
                    ? `Reading the scale display with PaddleOCR… ${elapsed}s`
                    : "Hold the bin still. The camera captures once the display is steady."}
                </p>
              </section>
            )}

            {phase === "saved" && event && (
              <section className="animate-rise rounded-xl border border-leaf/40 bg-tint-leaf p-5">
                <p className="text-xs font-semibold tracking-[0.15em] text-pine">
                  LOGGED TO AUDIT TRAIL
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-pine">
                  +{event.kg.toFixed(2)} kg
                </p>
                <p className="text-sm">
                  from {event.pantry} · bin {event.beforeKg?.toFixed(2)} →{" "}
                  {event.afterKg?.toFixed(2)} kg
                  <span className="text-muted"> / {BIN_CAPACITY_KG} kg</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {cleaner.name} ·{" "}
                  <span suppressHydrationWarning>{new Date(event.at).toLocaleTimeString()}</span> ·{" "}
                  {event.source === "ocr"
                    ? `OCR in ${((ocrMs ?? 0) / 1000).toFixed(1)}s`
                    : "reference reading"}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/dashboard?bin=${bin.id}`}
                    className="col-span-2 flex h-11 items-center justify-center rounded-md bg-brand text-sm font-semibold text-white hover:opacity-90"
                  >
                    View {bin.short} on dashboard →
                  </Link>
                  <Link
                    href={`/cleaner/building?cleaner=${cleaner.id}`}
                    className="flex h-10 items-center justify-center rounded-md border border-line bg-card text-sm font-medium hover:bg-sand"
                  >
                    Log another pantry
                  </Link>
                  <Link
                    href="/cleaner"
                    className="flex h-10 items-center justify-center rounded-md border border-line bg-card text-sm font-medium hover:bg-sand"
                  >
                    Sign out
                  </Link>
                </div>
              </section>
            )}

            {phase === "rejected" && (
              <section className="animate-rise rounded-xl border border-harvest/40 bg-tint-ochre p-5 text-sm">
                <p className="font-semibold text-ochre">
                  Reading isn&apos;t above the bin&apos;s last total
                </p>
                <p className="mt-1">
                  Scale shows {readKg != null ? `${readKg.toFixed(2)} kg` : "no change"}, bin was{" "}
                  {beforeKg?.toFixed(2)} kg. The camera may have caught the scale before the grounds
                  settled.
                </p>
                <button
                  type="button"
                  onClick={() => run(frame?.src)}
                  className="mt-3 h-10 w-full rounded-md bg-brand text-sm font-semibold text-white"
                >
                  Retake photo
                </button>
              </section>
            )}

            {phase === "failed" && (
              <section className="animate-rise rounded-xl border border-roof/30 bg-tint-ember p-5 text-sm">
                <p className="font-semibold text-ember">Couldn&apos;t read the scale</p>
                <p className="mt-1 text-ember">{error}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => run()}
                    className="h-10 rounded-md bg-brand text-sm font-semibold text-white"
                  >
                    Retry OCR
                  </button>
                  {frame && (
                    <button
                      type="button"
                      onClick={applyReference}
                      className="h-10 rounded-md border border-line bg-card text-sm font-medium hover:bg-sand"
                      title="Logs the frame's known reading, flagged as a fallback in the audit trail"
                    >
                      Use reference {frame.refKg} kg
                    </button>
                  )}
                </div>
              </section>
            )}

            {phase === "swap" && (
              <section className="animate-rise rounded-xl border border-roof/30 bg-tint-ember p-5 text-sm">
                <p className="font-semibold text-ember">{bin.short} bin is too full to weigh</p>
                <p className="mt-1">
                  It already holds {beforeKg?.toFixed(1)} kg of {BIN_CAPACITY_KG} kg. Swap in an
                  empty bin, then weigh again.
                </p>
                <button
                  type="button"
                  onClick={swapBin}
                  className="mt-3 h-10 w-full rounded-md bg-brand text-sm font-semibold text-white"
                >
                  I&apos;ve swapped the bin · log collection
                </button>
              </section>
            )}
          </>
        }
      />
    </CleanerShell>
  );
}
