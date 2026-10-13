import Link from "next/link";
import { OcrUploader } from "@/components/OcrUploader";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <div className="flex gap-4">
          <Link href="/dashboard" className="text-sm text-brand underline">
            → Smart Bin Dashboard
          </Link>
          <Link href="/scan" className="text-sm text-brand underline">
            → Scale Scanner
          </Link>
          <Link href="/kiosk" className="text-sm text-brand underline">
            → Grounds to Glow Kiosk
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Image OCR</h1>
        <p className="text-muted">
          Upload an image to extract its text with PaddleOCR. Hover a line to highlight it on the
          image.
        </p>
      </header>
      <OcrUploader />
    </main>
  );
}
