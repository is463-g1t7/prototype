"use client";

import { useState } from "react";
import { ago, type BinEvent, type EventSource } from "@/lib/analytics";
import { BIN_CAPACITY_KG, levelsFor, type Bin } from "@/lib/bins";
import { CLEANERS, cleanerById } from "@/lib/cleaners";

const SOURCE: Record<EventSource, [string, string]> = {
  ocr: ["Scale OCR", "bg-tint-leaf text-pine"],
  reference: ["OCR fallback", "bg-tint-ochre text-ochre"],
  manual: ["Manual", "bg-sand text-muted"],
  demo: ["Demo sim", "bg-sand text-muted"],
};

const PAGE = 8;

function stamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Per-building chain of custody: who emptied which pantry, and the bin total either side. */
export function AuditTrail({
  bin,
  events,
  now,
  highlightId,
}: {
  bin: Bin;
  events: BinEvent[];
  now: number | null;
  highlightId: string | null;
}) {
  const [cleanerId, setCleanerId] = useState("all");
  const [level, setLevel] = useState("all");
  const [expanded, setExpanded] = useState(false);

  const rows = events.filter(
    (e) =>
      e.binId === bin.id &&
      (cleanerId === "all" || e.cleanerId === cleanerId) &&
      (level === "all" || (e.type === "deposit" && String(e.level) === level)),
  );
  const shown = expanded ? rows : rows.slice(0, PAGE);
  const deposited = rows.filter((e) => e.type === "deposit").reduce((s, e) => s + e.kg, 0);

  function exportCsv() {
    const head = ["time", "building", "action", "pantry", "cleaner", "pass", "kg", "bin_before_kg", "bin_after_kg", "source", "photo"];
    const body = rows.map((e) => {
      const c = cleanerById(e.cleanerId);
      return [
        e.at,
        bin.short,
        e.type,
        e.pantry ?? "",
        c?.name ?? "",
        c?.pass ?? "",
        e.kg.toFixed(2),
        e.beforeKg?.toFixed(2) ?? "",
        e.afterKg?.toFixed(2) ?? "",
        e.source ?? "",
        e.photo ?? "",
      ];
    });
    const csv = [head, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bin.short.toLowerCase()}-audit-trail.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const select = "h-8 rounded-md border border-line bg-background px-2 text-xs";

  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            {bin.short} audit trail{" "}
            <span className="font-normal text-muted">· central bin {bin.weightKg.toFixed(2)} / {BIN_CAPACITY_KG} kg</span>
          </h2>
          <p className="text-xs text-muted">
            Every drop-off, signed by the cleaner&apos;s pass. Follows the selected bin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Filter by cleaner" value={cleanerId} onChange={(e) => setCleanerId(e.target.value)} className={select}>
            <option value="all">All cleaners</option>
            {CLEANERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select aria-label="Filter by pantry level" value={level} onChange={(e) => setLevel(e.target.value)} className={select}>
            <option value="all">All levels</option>
            {Array.from({ length: levelsFor(bin.id) }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                L{i + 1}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!rows.length}
            className="h-8 rounded-md border border-line px-3 text-xs font-medium hover:bg-sand disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No drop-offs match these filters yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 pr-3 font-medium">Cleaner</th>
                <th className="py-2 pr-3 font-medium">Pantry</th>
                <th className="py-2 pr-3 text-right font-medium">Change</th>
                <th className="py-2 pr-3 text-right font-medium">Bin total</th>
                <th className="py-2 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => {
                const c = cleanerById(e.cleanerId);
                const collect = e.type === "collect";
                const src = e.source ? SOURCE[e.source] : null;
                return (
                  <tr
                    key={e.id}
                    className={`border-b border-line/70 last:border-0 ${e.id === highlightId ? "animate-rise bg-tint-leaf" : ""}`}
                  >
                    <td className="py-2 pr-3 align-top">
                      <span className="block tabular-nums" suppressHydrationWarning>
                        {stamp(e.at)}
                      </span>
                      <span className="text-xs text-muted">{now === null ? "" : ago(e.at, now)}</span>
                    </td>
                    <td className="py-2 pr-3 align-top">
                      {c ? (
                        <span className="flex items-center gap-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
                            {c.initials}
                          </span>
                          <span>
                            <span className="block leading-tight">{c.name}</span>
                            <span className="font-mono text-[11px] text-muted">{c.pass}</span>
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted">{collect ? "Collection crew" : "Unattributed"}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 align-top">
                      {collect ? (
                        <span className="font-medium text-pine">✓ Bin collected</span>
                      ) : (
                        <span className="font-medium">{e.level != null ? `L${e.level} pantry` : (e.pantry ?? "—")}</span>
                      )}
                    </td>
                    <td className={`py-2 pr-3 text-right align-top font-semibold tabular-nums ${collect ? "text-pine" : ""}`}>
                      {collect ? "−" : "+"}
                      {e.kg.toFixed(2)} kg
                    </td>
                    <td className="py-2 pr-3 text-right align-top tabular-nums text-muted">
                      {e.beforeKg != null && e.afterKg != null
                        ? `${e.beforeKg.toFixed(2)} → ${e.afterKg.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-2 align-top">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {src && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${src[1]}`}>{src[0]}</span>
                        )}
                        {e.photo && (
                          <a href={e.photo} target="_blank" rel="noreferrer" className="text-xs underline">
                            scale photo
                          </a>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {rows.length} entr{rows.length === 1 ? "y" : "ies"} · {deposited.toFixed(2)} kg deposited
        </span>
        {rows.length > PAGE && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="font-medium text-brand underline">
            {expanded ? "Show fewer" : `Show all ${rows.length}`}
          </button>
        )}
      </div>
    </section>
  );
}
