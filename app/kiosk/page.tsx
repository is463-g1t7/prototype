import { Suspense } from "react";
import type { Metadata } from "next";
import { KioskApp, KioskGate } from "@/components/kiosk/KioskApp";

export const metadata: Metadata = {
  title: "Grounds to Glow · Coffee Scrub Station",
  description:
    "SMU coffee scrub kiosk: learn the collection loop, find your recipe, and dispense a fresh scrub.",
  robots: { index: false },
};

export default function KioskPage() {
  // KioskGate reads ?chat=1 on the client; the Suspense boundary lets the
  // route prerender (cacheComponents). Fallback is the default kiosk view.
  return (
    <Suspense fallback={<KioskApp />}>
      <KioskGate />
    </Suspense>
  );
}
