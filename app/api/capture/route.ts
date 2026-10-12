import { INITIAL_BINS, parseKgFromOcrText } from "@/lib/bins";
import { OcrUpstreamError, runOcr } from "@/lib/ocr";
import { addReading, latestPerBin } from "@/lib/readings";

// OCR cold starts can take a while.
export const maxDuration = 60;

/**
 * Hourly capture tick (vercel.json cron). Verifies Vercel's CRON_SECRET when set.
 * With SCALE_PHOTO_URL it OCRs the scale camera; without hardware it records a
 * clearly-marked simulated reading so the pipeline stays demonstrable.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const binId = searchParams.get("bin") ?? "bin-soa";
  if (!INITIAL_BINS.some((b) => b.id === binId)) {
    return Response.json({ error: "Unknown bin." }, { status: 400 });
  }

  const photoUrl = process.env.SCALE_PHOTO_URL;
  if (photoUrl) {
    try {
      const res = await fetch(photoUrl);
      if (!res.ok) throw new Error(`Camera returned ${res.status}.`);
      const lines = await runOcr(await res.blob(), "en");
      const kg = parseKgFromOcrText(lines.map((l) => l.text).join("\n"));
      if (kg != null) {
        const reading = addReading({
          binId,
          weightKg: kg,
          at: new Date().toISOString(),
          source: "ocr",
        });
        return Response.json({ reading });
      }
    } catch (err) {
      const message = err instanceof OcrUpstreamError ? err.message : String(err);
      console.error("[capture]", message);
    }
  }

  const prev = latestPerBin()[binId]?.weightKg ?? 2.4;
  const weightKg =
    Math.round(Math.min(5, Math.max(0, prev + (Math.random() - 0.35) * 0.2)) * 100) / 100;
  const reading = addReading({
    binId,
    weightKg,
    at: new Date().toISOString(),
    source: "simulated",
  });
  return Response.json({
    reading,
    note: photoUrl
      ? "Camera OCR found no weight; simulated fallback."
      : "No SCALE_PHOTO_URL set; simulated. Point a camera frame at that URL to go live.",
  });
}
