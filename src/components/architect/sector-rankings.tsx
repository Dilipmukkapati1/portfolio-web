"use client";

import { useMemo } from "react";
import type { ArchitectSectorSlice } from "@/lib/architect-types";
import { cn, formatPercent } from "@/lib/utils";

type SectorRankingsProps = {
  sectors: ArchitectSectorSlice[];
  className?: string;
  limit?: number;
};

export function SectorRankings({
  sectors,
  className,
  limit = 6,
}: SectorRankingsProps) {
  const rows = useMemo(
    () =>
      [...sectors]
        .sort(
          (a, b) =>
            (b.livePerfPercent ?? 0) - (a.livePerfPercent ?? 0) ||
            a.label.localeCompare(b.label)
        )
        .slice(0, limit),
    [sectors, limit]
  );

  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-sm font-semibold">Sector Rankings</h2>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card/60">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>Sector</span>
          <span className="text-right">Market cap</span>
          <span className="text-right">Performance</span>
        </div>
        <ul>
          {rows.map((row) => {
            const perf = row.livePerfPercent ?? 0;
            const positive = perf > 0;
            const negative = perf < 0;
            return (
              <li
                key={row.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{
                      backgroundColor: row.accentColor ?? "hsl(var(--primary))",
                    }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.label}</p>
                    {row.assetCount != null && (
                      <p className="text-xs text-muted-foreground">
                        {row.assetCount} assets
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-right text-sm tabular-nums text-muted-foreground">
                  {row.marketCapLabel ?? "—"}
                </span>
                <span
                  className={cn(
                    "text-right text-sm font-medium tabular-nums",
                    positive && "text-emerald-400",
                    negative && "text-red-400",
                    !positive && !negative && "text-muted-foreground"
                  )}
                >
                  {formatPercent(row.livePerfPercent, 1)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
