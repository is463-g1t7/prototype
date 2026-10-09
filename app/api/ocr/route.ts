import { ACCEPTED_TYPES, MAX_BYTES, isLang } from "@/lib/languages";
import { OcrUpstreamError, runOcr } from "@/lib/ocr";

// A cold Space loads 8 PaddleOCR models before it can answer.
export const maxDuration = 60;

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const image = form.get("image");
  const lang = form.get("lang") ?? "en";

  if (!(image instanceof File) || image.size === 0) {
    return Response.json({ error: "No image uploaded." }, { status: 400 });
  }
  if (!ACCEPTED_TYPES.includes(image.type)) {
    return Response.json({ error: "Image must be PNG, JPEG or WebP." }, { status: 400 });
  }
  if (image.size > MAX_BYTES) {
    return Response.json({ error: "Image must be 4 MB or smaller." }, { status: 400 });
  }
  if (!isLang(lang)) {
    return Response.json({ error: `Unsupported language: ${lang}` }, { status: 400 });
  }

  try {
    const lines = await runOcr(image, lang);
    return Response.json({ lines });
  } catch (err) {
    const message = err instanceof OcrUpstreamError ? err.message : "Unexpected error.";
    console.error("[ocr]", message);
    const waking = /sleep|starting|building|timeout|timed out|503/i.test(message);
    return Response.json(
      {
        error: waking
          ? "The OCR service is waking up. Try again in a minute."
          : `OCR failed: ${message}`,
      },
      { status: waking ? 503 : 502 },
    );
  }
}
