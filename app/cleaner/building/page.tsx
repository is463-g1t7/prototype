import { Suspense } from "react";
import { BuildingPicker } from "@/components/cleaner/BuildingPicker";

export const metadata = { title: "Pick pantry" };

export default function BuildingPage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 py-6 sm:py-10">
      {/* Reads ?cleaner= on the client, so the rest of the route can prerender. */}
      <Suspense>
        <BuildingPicker />
      </Suspense>
    </main>
  );
}
