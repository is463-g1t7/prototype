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

## Cleaner drop-off flow (demo)

1. `/cleaner`: scan a staff pass. Tap a demo pass, or on Chrome for Android/macOS scan a QR
   from `/passes` with the camera.
2. `/cleaner/building`: pick the building on the campus map, then the pantry level.
3. `/cleaner/weigh`: the "overhead camera" auto-captures one of `public/weighing_scale_{1,2,3}.jpeg`
   (4.2 / 5.7 / 8.3 kg, a frame heavier than the bin's current total), sends it to
   `/api/scale-photo`, and logs the increase against the cleaner and pantry.

For the presentation, open `/dashboard` and click **Cleaner app ↗**. Drop-offs logged in the
cleaner tab appear on the dashboard live: a banner, the bin's new weight, and a row in the
building's **audit trail** (filterable, CSV export). State lives in the browser's localStorage,
so both tabs must be in the same browser. **Reset** on the dashboard restores the seed data.

`lib/cleaners.ts` holds the demo roster, `lib/scales.ts` the scale frames, and `lib/store.ts`
the shared localStorage store.

## Deployment

Production runs at https://prototype-one-green.vercel.app, deployed by the
`Deploy` workflow (`.github/workflows/deploy.yml`) on every push to `main`.

The Vercel project (`prototype`, team `charles-personal`) is driven by CLI with
`VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` repo secrets — native
Vercel↔GitHub integration cannot see the private `is463-g1t7` org repo. If the
`VERCEL_TOKEN` secret is revoked or rotated, update it with a fresh token.

## Notes

- The free Space sleeps when idle. The first request afterwards can take up to a minute
  while it loads its models.
- The Space has 2 workers for `en`/`ch` and 1 for other languages, so concurrent requests queue.
