import { ACCEPTED_TYPES, MAX_BYTES } from "@/lib/languages";
import { INITIAL_BINS, parseKgFromOcrText } from "@/lib/bins";
import { OcrUpstreamError, runOcr } from "@/lib/ocr";
import { addReading } from "@/lib/readings";

// A cold Space loads 8 PaddleOCR models before it can answer.
export const maxDuration = 60;

/**
 * Phone webhook: POST multipart/form-data with `image` (LCD photo) + `bin`.
 * Runs OCR inline and stores the reading. Open for class demo —
 * require a shared secret here before exposing it publicly.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const bin = form.get("bin");
  if (typeof bin !== "string" || !INITIAL_BINS.some((b) => b.id === bin)) {
    return Response.json({ error: "Unknown bin." }, { status: 400 });
  }
  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return Response.json({ error: "No image uploaded." }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.includes(image.type)) {
    return Response.json({ error: "Image must be PNG, JPEG or WebP." }, { status: 400 });
  }
  if (image.size > MAX_BYTES) {
    return Response.json({ error: "Image must be 4 MB or smaller." }, { status: 400 });
  }

  try {
    const lines = await runOcr(image, "en");
    const kg = parseKgFromOcrText(lines.map((l) => l.text).join("\n"));
    if (kg == null) {
      return Response.json({ error: "No weight readable in that photo." }, { status: 422 });
    }
    const reading = addReading({
      binId: bin,
      weightKg: kg,
      at: new Date().toISOString(),
      source: "ocr",
    });
    return Response.json({ reading }, { status: 201 });
  } catch (err) {
    const message = err instanceof OcrUpstreamError ? err.message : "Unexpected error.";
    console.error("[scale-photo]", message);
    return Response.json({ error: `OCR failed: ${message}` }, { status: 502 });
  }
}
