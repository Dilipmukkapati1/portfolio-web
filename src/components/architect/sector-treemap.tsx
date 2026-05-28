"use client";

import type { ArchitectSectorSlice } from "@/lib/architect-types";
import { cn } from "@/lib/utils";

function perfClass(tone: ArchitectSectorSlice["tone"]): string {
  if (tone === "positive") return "text-emerald-400";
  if (tone === "negative") return "text-red-400";
  return "text-muted-foreground";
}

function boxClass(tone: ArchitectSectorSlice["tone"], large: boolean): string {
  const base = large ? "col-span-2 row-span-2" : "";
  if (tone === "positive") {
    return cn(base, "bg-emerald-500/20 border-emerald-500/30");
  }
  if (tone === "negative") {
    return cn(base, "bg-red-500/15 border-red-500/25");
  }
  return cn(base, "bg-muted/30 border-border/60");
}

export function SectorTreemap({ sectors }: { sectors: ArchitectSectorSlice[] }) {
  const sorted = [...sectors].sort((a, b) => b.weightPercent - a.weightPercent);

  return (
    <div className="grid h-44 grid-cols-4 grid-rows-2 gap-2">
      {sorted.map((sector, index) => (
        <div
          key={sector.id}
          className={cn(
            "flex flex-col justify-between rounded-lg border p-2",
            boxClass(sector.tone, index === 0)
          )}
        >
          <span className="text-xs font-semibold">{sector.label}</span>
          <div>
            <p className="text-lg font-bold tabular-nums">
              {sector.weightPercent.toFixed(0)}%
            </p>
            {sector.livePerfPercent != null && (
              <p className={cn("text-xs font-medium tabular-nums", perfClass(sector.tone))}>
                {sector.livePerfPercent > 0 ? "+" : ""}
                {sector.livePerfPercent.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
