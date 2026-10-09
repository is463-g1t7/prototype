"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACCEPTED_TYPES,
  DEFAULT_LANG,
  LANGUAGES,
  MAX_BYTES,
  type Lang,
  type OcrLine,
  type OcrResponse,
} from "@/lib/languages";
import { BoxOverlay } from "./BoxOverlay";

type Status = "idle" | "loading" | "done" | "error";

export function OcrUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<OcrLine[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (status !== "loading") return;
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(id);
  }, [status]);

  function selectFile(next: File | undefined) {
    if (!next) return;
    if (!ACCEPTED_TYPES.includes(next.type)) {
      setStatus("error");
      setError("Please choose a PNG, JPEG or WebP image.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setStatus("error");
      setError("Image must be 4 MB or smaller.");
      return;
    }
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    setImageSize(null);
    setLines([]);
    setError(null);
    setStatus("idle");
  }

  async function runOcr() {
    if (!file) return;
    setStatus("loading");
    setElapsed(0);
    setError(null);
    setLines([]);

    const body = new FormData();
    body.append("image", file);
    body.append("lang", lang);

    try {
      const res = await fetch("/api/ocr", { method: "POST", body });
      const data = (await res.json()) as OcrResponse;
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : `Request failed (${res.status})`);
      }
      setLines(data.lines);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  async function copyAll() {
    await navigator.clipboard.writeText(lines.map((l) => l.text).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            selectFile(e.dataTransfer.files[0]);
          }}
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragging
              ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
              : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
          }`}
        >
          <p className="font-medium">{file ? file.name : "Drop an image here or click to browse"}</p>
          <p className="text-sm text-zinc-500">PNG, JPEG or WebP, up to 4 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              selectFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Language</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="h-10 rounded-md border border-zinc-300 bg-background px-3 dark:border-zinc-700"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={runOcr}
            disabled={!file || status === "loading"}
            className="h-10 rounded-md bg-foreground px-5 font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "loading" ? `Reading… ${elapsed}s` : "Extract text"}
          </button>
        </div>

        {status === "loading" && elapsed >= 10 && (
          <p className="text-sm text-zinc-500">
            The OCR Space may be waking up from sleep. The first request can take up to a minute.
          </p>
        )}
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {previewUrl && (
          <BoxOverlay
            src={previewUrl}
            lines={lines}
            size={imageSize}
            activeIndex={activeIndex}
            onActiveChange={setActiveIndex}
            onLoad={setImageSize}
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            Results{status === "done" && ` (${lines.length} line${lines.length === 1 ? "" : "s"})`}
          </h2>
          {lines.length > 0 && (
            <button
              type="button"
              onClick={copyAll}
              className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              {copied ? "Copied" : "Copy all"}
            </button>
          )}
        </div>

        {status === "done" && lines.length === 0 && (
          <p className="text-sm text-zinc-500">No text found in this image.</p>
        )}
        {status !== "done" && lines.length === 0 && (
          <p className="text-sm text-zinc-500">Extracted text will appear here.</p>
        )}

        {lines.length > 0 && (
          <ol className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {lines.map((line, i) => (
              <li
                key={i}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`px-3 py-2 text-sm transition-colors ${
                  i === activeIndex ? "bg-amber-100 dark:bg-amber-900/30" : ""
                }`}
              >
                {line.text}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
