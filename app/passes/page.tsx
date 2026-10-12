import Link from "next/link";
import { PassCard } from "@/components/cleaner/PassScanner";
import { CLEANERS } from "@/lib/cleaners";

export const metadata = { title: "Staff passes" };

/** Show on a second phone or print, then scan at /cleaner on a camera-equipped device. */
export default function PassesPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <Link href="/cleaner" className="text-sm text-brand underline">
          ← Cleaner check-in
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Demo staff passes</h1>
        <p className="text-muted">
          Each QR encodes the pass number. Open the pass scanner on a phone and point it here.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {CLEANERS.map((c) => (
          <PassCard key={c.id} cleaner={c} />
        ))}
      </div>
    </main>
  );
}
