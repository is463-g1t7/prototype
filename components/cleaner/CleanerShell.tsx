import Link from "next/link";
import type { Cleaner } from "@/lib/cleaners";

const STEPS = ["Scan pass", "Pick pantry", "Weigh bin"] as const;

/**
 * Frame shared by the three cleaner steps: phone-width column on small screens,
 * wide two-column steps from `lg` up (laptop/projector demos).
 */
export function CleanerShell({
  step,
  cleaner,
  children,
}: {
  step: 1 | 2 | 3;
  cleaner?: Cleaner;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 lg:max-w-6xl lg:gap-6">
      <div className="overflow-hidden rounded-xl bg-brand text-white">
        <div className="h-1 bg-gold" />
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:flex-nowrap lg:gap-8 lg:px-6 lg:py-4">
          {/* basis-0 on phones so the cleaner chip stays on the title row instead of wrapping */}
          <div className="min-w-0 max-lg:flex-1 max-lg:basis-0 lg:shrink-0">
            <p className="truncate text-[10px] font-semibold tracking-[0.2em] text-gold">
              SMU COFFEE LOOP<span className="max-sm:hidden"> · CLEANER</span>
            </p>
            <p className="text-lg font-bold lg:text-xl">Grounds drop-off</p>
          </div>
          <Steps step={step} className="order-last w-full lg:order-none lg:max-w-lg lg:flex-1" />
          {cleaner ? (
            <Link
              href="/cleaner"
              className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-xs hover:bg-white/20"
              title="Sign out"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-[11px] font-bold text-brand">
                {cleaner.initials}
              </span>
              <span className="max-w-28 truncate">{cleaner.name}</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="text-xs text-white/80 underline lg:shrink-0">
              Dashboard →
            </Link>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Steps({ step, className }: { step: number; className: string }) {
  return (
    <ol className={`grid grid-cols-3 gap-1 lg:gap-2 ${className}`}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "now" : "next";
        return (
          <li
            key={label}
            className="flex flex-col gap-1"
            aria-current={state === "now" ? "step" : undefined}
          >
            <span className={`h-1 rounded-full ${state === "next" ? "bg-white/20" : "bg-gold"}`} />
            <span
              className={`text-[11px] lg:text-xs ${state === "now" ? "font-semibold text-white" : "text-white/60"}`}
            >
              {n}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Two-column step body from `lg` up: main visual left, side panel right.
 * `narrowMain` suits a square viewfinder that would otherwise grow taller than the screen.
 */
export function StepColumns({
  main,
  side,
  narrowMain = false,
}: {
  main: React.ReactNode;
  side: React.ReactNode;
  narrowMain?: boolean;
}) {
  const cols = narrowMain
    ? "lg:grid-cols-[440px_minmax(0,1fr)]"
    : "lg:grid-cols-[minmax(0,1fr)_380px]";
  return (
    <div className={`flex flex-col gap-4 lg:grid lg:items-start lg:gap-6 ${cols}`}>
      <div className="flex min-w-0 flex-col gap-4">{main}</div>
      <div className="flex flex-col gap-4 lg:sticky lg:top-6">{side}</div>
    </div>
  );
}

export function NeedsPass() {
  return (
    <div className="rounded-xl border border-line bg-card p-5 text-sm">
      <p className="font-semibold">Scan your staff pass first</p>
      <p className="mt-1 text-muted">
        Every drop-off is logged against a cleaner for the audit trail.
      </p>
      <Link
        href="/cleaner"
        className="mt-3 inline-flex h-10 items-center rounded-md bg-brand px-4 font-medium text-white"
      >
        Go to pass scanner
      </Link>
    </div>
  );
}
