import { DashboardClient } from "@/components/DashboardClient";

export const metadata = { title: "Smart Bin Dashboard" };

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <DashboardClient />
    </main>
  );
}
