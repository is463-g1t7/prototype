// Language codes accepted by the kevansoon/PaddleOCR Space (LANG_CONFIG in its app.py).
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ch", label: "Chinese" },
  { code: "fr", label: "French" },
  { code: "german", label: "German" },
  { code: "korean", label: "Korean" },
  { code: "japan", label: "Japanese" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANG: Lang = "en";

export function isLang(value: unknown): value is Lang {
  return LANGUAGES.some((l) => l.code === value);
}

// Four [x, y] corner points in original-image pixels.
export type Box = [number, number][];

export type OcrLine = {
  text: string;
  box: Box;
};

export type OcrResponse = { lines: OcrLine[] } | { error: string };

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

// Vercel caps request bodies at 4.5 MB, so stay under that.
export const MAX_BYTES = 4 * 1024 * 1024;
