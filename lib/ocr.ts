import "server-only";

import { Client } from "@gradio/client";
import type { Box, Lang, OcrLine } from "./languages";

const SPACE_ID = process.env.HF_SPACE_ID ?? "kevansoon/PaddleOCR";
const HF_TOKEN = process.env.HF_TOKEN as `hf_${string}` | undefined;

// Client.connect() fetches the Space config, so reuse one connection per server instance.
let clientPromise: Promise<Client> | null = null;

function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = Client.connect(SPACE_ID, HF_TOKEN ? { token: HF_TOKEN } : {});
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }
  return clientPromise;
}

export class OcrUpstreamError extends Error {}

export async function runOcr(image: Blob, lang: Lang): Promise<OcrLine[]> {
  try {
    return await predict(image, lang);
  } catch {
    // The Space may have restarted or gone back to sleep: reconnect once and retry.
    clientPromise = null;
    try {
      return await predict(image, lang);
    } catch (err) {
      throw new OcrUpstreamError(describe(err));
    }
  }
}

async function predict(image: Blob, lang: Lang): Promise<OcrLine[]> {
  const client = await getClient();
  const result = await client.predict("/predict", { img: image, lang });
  return normalize((result.data as unknown[])[0]);
}

function normalize(raw: unknown): OcrLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): OcrLine[] => {
    if (!item || typeof item !== "object") return [];
    const { text, box } = item as { text?: unknown; box?: unknown };
    if (typeof text !== "string" || !Array.isArray(box)) return [];
    return [{ text, box: box.map((p) => [Number(p[0]), Number(p[1])]) as Box }];
  });
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) return String(err.message);
  return String(err);
}
