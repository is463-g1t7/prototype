"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { INITIAL_BINS, levelsFor } from "@/lib/bins";

type Phase = "idle" | "camera" | "sending" | "done";
type ScanResult = { kg: number; at: string; pantry: string | null };

export function ScannerClient() {
  const [binId, setBinId] = useState(INITIAL_BINS[0]?.id ?? "");
  const [level, setLevel] = useState(3);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stream = streamRef.current;
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  function keepShot(url: string) {
    setShotUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("camera");
    } catch {
      setError("Camera unavailable — upload a photo of the scale LCD instead.");
    }
  }

  async function postBlob(blob: Blob) {
    setPhase("sending");
    setError(null);
    setResult(null);
    const body = new FormData();
    body.append("image", blob, "scale.jpg");
    body.append("bin", binId);
    body.append("level", String(safeLevel));
    try {
      const res = await fetch("/api/scale-photo", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status}).`);
      setResult({
        kg: data.reading.weightKg,
        at: data.reading.at,
        pantry: data.reading.pantry ?? null,
      });
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPhase("camera");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Camera not ready yet — wait a second and retry.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Capture failed — try again.");
          return;
        }
        keepShot(URL.createObjectURL(blob));
        postBlob(blob);
      },
      "image/jpeg",
      0.9,
    );
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    keepShot(URL.createObjectURL(file));
    postBlob(file);
  }

  const bin = INITIAL_BINS.find((b) => b.id === binId);
  const levels = levelsFor(binId);
  const safeLevel = Math.min(Math.max(1, level), levels);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl bg-brand text-white">
        <div className="h-1 bg-gold" />
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-6 sm:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-gold">
              PHONE AS IOT NODE · CAMERA OCR ON LCD
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Scale Scanner</h1>
            <p className="mt-1 text-sm text-white/70">
              Point the overhead phone at the scale LCD, scan, and the weight posts
              straight to the dashboard.
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-white underline">
            → Dashboard
          </Link>
        </div>
      </div>

      <div className="flex max-w-sm flex-wrap gap-2">
        <label className="flex min-w-52 flex-1 flex-col gap-1 text-sm">
          <span className="text-muted">Bin under the scale</span>
          <select
            value={binId}
            onChange={(e) => setBinId(e.target.value)}
            className="h-10 rounded-md border border-line bg-background px-3"
          >
            {INITIAL_BINS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.short})
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-28 flex-col gap-1 text-sm">
          <span className="text-muted">Pantry level</span>
          <select
            value={safeLevel}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="h-10 rounded-md border border-line bg-background px-3"
          >
            {Array.from({ length: levels }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                L{i + 1}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-line bg-card">
          <div className="relative bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`block aspect-[4/3] w-full object-cover ${phase === "camera" || phase === "sending" ? "" : "hidden"}`}
            />
            {phase !== "camera" && phase !== "sending" && (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-zinc-400">
                  Phone&apos;s view — LCD faces up, 0.05 kg resolution
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="h-10 rounded-md bg-[#0e2a47] px-5 text-sm font-medium text-white hover:opacity-90"
                  >
                    Open camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="h-10 rounded-md border border-zinc-600 px-5 text-sm font-medium text-white hover:bg-zinc-900"
                  >
                    Upload LCD photo
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    onFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </div>
          {(phase === "camera" || phase === "sending") && (
            <div className="flex gap-2 p-3">
              <button
                type="button"
                onClick={capture}
                disabled={phase === "sending"}
                className="h-11 flex-1 rounded-md bg-brand text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {phase === "sending" ? "Reading LCD…" : "◎ Scan LCD"}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-11 rounded-md border border-line px-4 text-sm font-medium hover:bg-sand"
              >
                Upload instead
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-card p-5 font-mono text-sm">
          <h2 className="font-sans font-semibold">Cloud endpoint</h2>
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">scale photo</dt>
              <dd>{shotUrl ? "captured ✓" : "…"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">phone ocr</dt>
              <dd className="tabular-nums">
                {result ? `${result.kg.toFixed(2)} kg` : "…"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">upload</dt>
              <dd className="text-pine">
                {result ? "sent ✓" : "…"}
              </dd>
            </div>
          </dl>
          {shotUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shotUrl}
              alt="Captured scale LCD"
              className="mt-1 max-h-48 rounded-lg border border-line object-contain"
            />
          )}
          {result && (
            <p className="font-sans text-sm text-muted">
              {result.pantry ?? bin?.name} now reads {result.kg.toFixed(2)} kg ·{" "}
              <Link href="/dashboard" className="underline">
                View on dashboard →
              </Link>
            </p>
          )}
          {error && (
            <p className="rounded-md bg-tint-ember px-3 py-2 font-sans text-sm text-ember">
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
