"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { INITIAL_BINS } from "@/lib/bins";

type Phase = "idle" | "camera" | "sending" | "done";
type ScanResult = { kg: number; at: string };

export function ScannerClient() {
  const [binId, setBinId] = useState(INITIAL_BINS[0]?.id ?? "");
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
    try {
      const res = await fetch("/api/scale-photo", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status}).`);
      setResult({ kg: data.reading.weightKg, at: data.reading.at });
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

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl bg-[#0e2a47] text-white">
        <div className="h-1 bg-[#c5a253]" />
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-6 sm:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#c5a253]">
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

      <label className="flex max-w-sm flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Bin under the scale</span>
        <select
          value={binId}
          onChange={(e) => setBinId(e.target.value)}
          className="h-10 rounded-md border border-zinc-300 bg-background px-3 dark:border-zinc-700"
        >
          {INITIAL_BINS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.short})
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
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
                className="h-11 flex-1 rounded-md bg-[#0e2a47] text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {phase === "sending" ? "Reading LCD…" : "◎ Scan LCD"}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-11 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
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

        <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 font-mono text-sm dark:border-zinc-800">
          <h2 className="font-sans font-semibold">Cloud endpoint</h2>
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">scale photo</dt>
              <dd>{shotUrl ? "captured ✓" : "…"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">phone ocr</dt>
              <dd className="tabular-nums">
                {result ? `${result.kg.toFixed(2)} kg` : "…"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">upload</dt>
              <dd className="text-emerald-600 dark:text-emerald-400">
                {result ? "sent ✓" : "…"}
              </dd>
            </div>
          </dl>
          {shotUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shotUrl}
              alt="Captured scale LCD"
              className="mt-1 max-h-48 rounded-lg border border-zinc-200 object-contain dark:border-zinc-800"
            />
          )}
          {result && (
            <p className="font-sans text-sm text-zinc-500">
              {bin?.name} now reads {result.kg.toFixed(2)} kg ·{" "}
              <Link href="/dashboard" className="underline">
                View on dashboard →
              </Link>
            </p>
          )}
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 font-sans text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
