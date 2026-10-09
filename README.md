# prototype

A Next.js app that extracts text from uploaded images. The browser sends the image to the
`/api/ocr` route, and the server forwards it to the
[kevansoon/PaddleOCR](https://huggingface.co/spaces/kevansoon/PaddleOCR) Hugging Face Space
with `@gradio/client`.

```
Browser ──multipart──▶ /api/ocr ──@gradio/client──▶ kevansoon-paddleocr.hf.space /predict
        ◀──{ lines }──          ◀──[{ text, box }]──
```

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

| Variable      | Default               | Notes                         |
| ------------- | --------------------- | ----------------------------- |
| `HF_SPACE_ID` | `kevansoon/PaddleOCR` | Space to call                 |
| `HF_TOKEN`    | (unset)               | Only needed for private Space |

## API

`POST /api/ocr` with `multipart/form-data` fields:

- `image`: PNG, JPEG or WebP, 4 MB or smaller
- `lang`: `en` (default), `ch`, `fr`, `german`, `korean` or `japan`

```bash
curl -F image=@receipt.jpg -F lang=en http://localhost:3000/api/ocr
```

Returns `{ "lines": [{ "text": "...", "box": [[x, y], [x, y], [x, y], [x, y]] }] }`, with box
corners in original-image pixels. Errors return `{ "error": "..." }` with status 400 (bad
input), 503 (Space waking up) or 502 (other upstream failure).

## Files

- `app/api/ocr/route.ts`: validates the upload and calls the Space
- `lib/ocr.ts`: server-only Gradio client wrapper (cached connection, one retry)
- `lib/languages.ts`: shared language list, types and upload limits
- `components/OcrUploader.tsx`: upload form and results list
- `components/BoxOverlay.tsx`: draws detected text boxes over the image

## Notes

- The free Space sleeps when idle. The first request afterwards can take up to a minute
  while it loads its models.
- The Space has 2 workers for `en`/`ch` and 1 for other languages, so concurrent requests queue.
