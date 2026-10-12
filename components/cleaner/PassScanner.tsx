"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CLEANERS, cleanerByPass, passQrSrc, type Cleaner } from "@/lib/cleaners";
import { CleanerShell, StepColumns } from "./CleanerShell";

// Shape-detection API: Chrome on Android/macOS/ChromeOS. Not in TS's DOM lib yet.
type Detector = { detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string }>> };
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

type Phase = "ready" | "camera" | "presenting" | "verified";

const noSubscribe = () => () => {};

export function PassScanner() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("ready");
  const [cleaner, setCleaner] = useState<Cleaner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canDetect = useSyncExternalStore(
    noSubscribe,
    () => "BarcodeDetector" in window,
    () => false,
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach(clearTimeout);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function verify(c: Cleaner, animate: boolean) {
    stopCamera();
    setError(null);
    setCleaner(c);
    setPhase(animate ? "presenting" : "verified");
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    if (animate) later(1100, () => setPhase("verified"));
    later(animate ? 2300 : 1200, () => router.push(`/cleaner/building?cleaner=${c.id}`));
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setPhase("camera");
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const Ctor = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
      const detector = new Ctor({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const [hit] = await detector.detect(video);
          if (hit) {
            const c = cleanerByPass(hit.rawValue);
            if (c) return verify(c, false);
            setError(`Pass not recognised: ${hit.rawValue}`);
          }
        } catch {
          // frame not ready yet
        }
        timers.current.push(window.setTimeout(tick, 300));
      };
      tick();
    } catch {
      setPhase("ready");
      setError("Camera unavailable. Tap a demo pass below instead.");
    }
  }

  const busy = phase === "presenting" || phase === "verified";

  return (
    <CleanerShell step={1}>
      <StepColumns
        narrowMain
        main={
          <section className="overflow-hidden rounded-xl border border-line bg-card">
            <div className="relative aspect-square bg-[#0b1520]">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover ${phase === "camera" ? "" : "hidden"}`}
              />

              {/* Viewfinder brackets + sweeping scan line */}
              <div className="pointer-events-none absolute inset-[12%]">
                {[
                  "left-0 top-0 border-l-4 border-t-4",
                  "right-0 top-0 border-r-4 border-t-4",
                  "bottom-0 left-0 border-b-4 border-l-4",
                  "bottom-0 right-0 border-b-4 border-r-4",
                ].map((c) => (
                  <span
                    key={c}
                    className={`absolute h-10 w-10 rounded-sm ${phase === "verified" ? "border-leaf" : "border-gold"} ${c}`}
                  />
                ))}
                {phase !== "verified" && (
                  <span className="absolute inset-x-2 h-0.5 animate-scanline bg-gold shadow-[0_0_12px_2px_var(--color-gold)]" />
                )}
              </div>

              {phase === "ready" && (
                <p className="absolute inset-x-0 bottom-5 text-center text-sm text-white/70">
                  Hold your staff pass inside the frame
                </p>
              )}

              {cleaner && busy && (
                <div className="absolute inset-0 grid place-items-center p-[18%]">
                  <PassCard cleaner={cleaner} className="w-full animate-pass-in" />
                </div>
              )}

              {phase === "verified" && cleaner && (
                <div className="absolute inset-0 flex animate-rise flex-col items-center justify-center gap-2 bg-pine/85 text-white">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-3xl text-pine">
                    ✓
                  </span>
                  <p className="text-lg font-semibold">Pass verified</p>
                  <p className="text-sm text-white/85">
                    {cleaner.name} · {cleaner.pass}
                  </p>
                  <p className="text-xs text-white/70">Opening pantry picker…</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 p-3 empty:hidden">
              {canDetect && phase !== "camera" && !busy && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="h-11 rounded-md bg-brand text-sm font-semibold text-white hover:opacity-90"
                >
                  ◎ Scan with camera
                </button>
              )}
              {phase === "camera" && (
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setPhase("ready");
                  }}
                  className="h-11 rounded-md border border-line text-sm font-medium hover:bg-sand"
                >
                  Stop camera
                </button>
              )}
              {error && (
                <p className="rounded-md bg-tint-ember px-3 py-2 text-sm text-ember">{error}</p>
              )}
            </div>
          </section>
        }
        side={
          <section className="flex flex-col gap-2 lg:gap-3">
            <div className="hidden lg:block">
              <h1 className="text-2xl font-semibold tracking-tight">Scan your staff pass</h1>
              <p className="mt-1 text-sm text-muted">
                Your pass signs every drop-off, so the bin&apos;s audit trail shows who emptied
                which pantry and when.
              </p>
            </div>
            <div className="flex items-baseline justify-between lg:mt-2">
              <h2 className="text-sm font-semibold">Demo passes</h2>
              <Link href="/passes" className="text-xs text-muted underline">
                Printable passes →
              </Link>
            </div>
            <p className="text-xs text-muted">
              Tap a pass to present it to the scanner
              {canDetect ? ", or show a printed QR to the camera." : "."}
            </p>
            <div className="grid grid-cols-2 gap-2 lg:gap-3">
              {CLEANERS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={busy}
                  onClick={() => verify(c, true)}
                  className="flex items-center gap-2 rounded-lg border border-line bg-card p-2 text-left hover:border-brand disabled:opacity-50 lg:gap-3 lg:p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={passQrSrc(c)}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded lg:h-16 lg:w-16"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{c.name}</span>
                    <span className="block text-[11px] tabular-nums text-muted">
                      {c.pass} · {c.shift}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        }
      />
    </CleanerShell>
  );
}

export function PassCard({ cleaner, className = "" }: { cleaner: Cleaner; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl bg-card text-ink shadow-xl ${className}`}>
      <div className="flex items-center justify-between bg-brand px-3 py-1.5 text-[10px] font-semibold tracking-[0.15em] text-gold">
        <span>SMU · STAFF PASS</span>
        <span className="text-white/70">{cleaner.shift} SHIFT</span>
      </div>
      <div className="flex items-center gap-3 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={passQrSrc(cleaner)}
          alt={`QR code for ${cleaner.pass}`}
          className="w-2/5 rounded"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">{cleaner.name}</p>
          <p className="text-xs text-muted">{cleaner.vendor}</p>
          <p className="mt-1 font-mono text-xs tabular-nums">{cleaner.pass}</p>
        </div>
      </div>
    </div>
  );
}
