"use client";

import type { OcrLine } from "@/lib/languages";

type Props = {
  src: string;
  lines: OcrLine[];
  size: { width: number; height: number } | null;
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
  onLoad: (size: { width: number; height: number }) => void;
};

// Draws OCR boxes over the image. The SVG viewBox uses the image's natural pixel size,
// so box coordinates from the Space map directly without manual scaling.
export function BoxOverlay({ src, lines, size, activeIndex, onActiveChange, onLoad }: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL preview */}
      <img
        src={src}
        alt="Uploaded image"
        className="block h-auto w-full"
        onLoad={(e) =>
          onLoad({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })
        }
      />
      {size && lines.length > 0 && (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${size.width} ${size.height}`}
          preserveAspectRatio="none"
        >
          {lines.map((line, i) => (
            <polygon
              key={i}
              points={line.box.map(([x, y]) => `${x},${y}`).join(" ")}
              vectorEffect="non-scaling-stroke"
              className={
                i === activeIndex
                  ? "fill-amber-400/35 stroke-amber-500 stroke-[3px]"
                  : "fill-sky-400/10 stroke-sky-500 stroke-[1.5px]"
              }
              onMouseEnter={() => onActiveChange(i)}
              onMouseLeave={() => onActiveChange(null)}
            >
              <title>{line.text}</title>
            </polygon>
          ))}
        </svg>
      )}
    </div>
  );
}
