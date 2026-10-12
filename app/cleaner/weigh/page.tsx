import { Suspense } from "react";
import { WeighStation } from "@/components/cleaner/WeighStation";

export const metadata = { title: "Weigh bin" };

export default function WeighPage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 py-6 sm:py-10">
      {/* Reads ?cleaner=&bin=&level= on the client, so the rest of the route can prerender. */}
      <Suspense>
        <WeighStation />
      </Suspense>
    </main>
  );
}
