import { ScannerClient } from "@/components/ScannerClient";

export const metadata = { title: "Scale Scanner" };

export default function ScanPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <ScannerClient />
    </main>
  );
}
