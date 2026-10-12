"use client";

import { useMemo } from "react";
import { barY, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { Chart } from "@tanstack/charts/react";

export function MonthlyChart({ currentTotalKg }: { currentTotalKg: number }) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(
            [
              { month: "Aug", kg: 58.4 },
              { month: "Sep", kg: 71.2 },
              { month: "Oct", kg: currentTotalKg },
            ],
            { x: "month", y: "kg" },
          ),
        ],
        scales: {
          x: { scale: () => scaleBand<string>().padding(0.25) },
          y: { scale: scaleLinear, nice: true },
        },
      }),
    [currentTotalKg],
  );

  return (
    <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="text-sm text-zinc-500">Repurposed this month</h2>
      <p className="mt-1 text-3xl font-bold">{currentTotalKg.toFixed(1)} kg</p>
      <div className="mt-3">
        <Chart definition={definition} height={260} ariaLabel="Monthly coffee grounds" />
      </div>
      <p className="mt-2 text-sm text-zinc-500">Coffee grounds diverted from landfill, by month.</p>
    </section>
  );
}
