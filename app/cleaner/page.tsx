import { PassScanner } from "@/components/cleaner/PassScanner";

export const metadata = { title: "Cleaner check-in" };

export default function CleanerPage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 py-6 sm:py-10">
      <PassScanner />
    </main>
  );
}
