"use client";

import type { ArchitectExecutionAsset } from "@/lib/architect-types";
import { cn } from "@/lib/utils";

const BAR_COLORS: Record<ArchitectExecutionAsset["barColor"], string> = {
  purple: "bg-violet-500",
  blue: "bg-sky-300",
  green: "bg-emerald-500",
  orange: "bg-amber-500",
};

function fillTone(fill: number): string {
  if (fill >= 90) return "text-emerald-400";
  if (fill >= 50) return "text-amber-400";
  return "text-amber-500";
}

export function AssetCard({ asset }: { asset: ArchitectExecutionAsset }) {
  const plannedWidth = Math.min(100, asset.plannedPercent);
  const actualWidth = Math.min(100, asset.actualPercent);

  return (
    <article className="rounded-xl border border-border/80 bg-card/80 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#12182b] text-xs font-bold tracking-wide text-foreground">
          {asset.symbol}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{asset.name}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Asset class
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Fill status
          </p>
          <p className={cn("text-sm font-bold tabular-nums", fillTone(asset.fillStatusPercent))}>
            {Math.round(asset.fillStatusPercent)}%
          </p>
        </div>
      </div>
      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-muted/40">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/25"
          style={{ width: `${plannedWidth}%` }}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            BAR_COLORS[asset.barColor]
          )}
          style={{ width: `${actualWidth}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
        <span>Planned: {asset.plannedPercent.toFixed(0)}%</span>
        <span>Actual: {asset.actualPercent.toFixed(0)}%</span>
      </div>
    </article>
  );
}
