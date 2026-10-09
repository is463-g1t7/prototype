import { OcrUploader } from "@/components/OcrUploader";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Image OCR</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload an image to extract its text with PaddleOCR. Hover a line to highlight it on the
          image.
        </p>
      </header>
      <OcrUploader />
    </main>
  );
}
