"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  formatSignedPercent,
  PERF_COLOR_MAX,
  PERF_COLOR_MIN,
  performanceToHeatColor,
} from "@/lib/sector-heatmap";
import { squarifyTreemap } from "@/lib/treemap";
import type { ArchitectSectorSlice } from "@/lib/architect-types";

type SectorTimeframe = "1d" | "1w" | "1m";

const TIMEFRAMES: { id: SectorTimeframe; label: string }[] = [
  { id: "1d", label: "1D" },
  { id: "1w", label: "1W" },
  { id: "1m", label: "1M" },
];

type SectorHeatmapProps = {
  sectors: ArchitectSectorSlice[];
  className?: string;
  onTimeframeChange?: (timeframe: SectorTimeframe) => void;
  timeframe?: SectorTimeframe;
  loading?: boolean;
};

function PerformanceLegend() {
  const stops = Array.from({ length: 9 }, (_, index) => {
    const perf =
      PERF_COLOR_MIN +
      (index / 8) * (PERF_COLOR_MAX - PERF_COLOR_MIN);
    return performanceToHeatColor(perf);
  });

  return (
    <div className="space-y-1.5">
      <div
        className="h-2 w-full rounded-full"
        style={{
          background: `linear-gradient(to right, ${stops.join(", ")})`,
        }}
        role="img"
        aria-label="Performance scale from negative to positive"
      />
      <div className="flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>{PERF_COLOR_MIN}%</span>
        <span>0%</span>
        <span>+{PERF_COLOR_MAX}%</span>
      </div>
    </div>
  );
}

export function SectorHeatmap({
  sectors,
  className,
  onTimeframeChange,
  timeframe: controlledTimeframe,
  loading,
}: SectorHeatmapProps) {
  const [internalTimeframe, setInternalTimeframe] =
    useState<SectorTimeframe>("1d");
  const timeframe = controlledTimeframe ?? internalTimeframe;

  const rects = useMemo(() => {
    const nodes = sectors
      .filter((s) => s.weightPercent > 0)
      .map((s) => ({ id: s.id, value: s.weightPercent }));
    return squarifyTreemap(nodes, 100, 56);
  }, [sectors]);

  const sectorById = useMemo(
    () => new Map(sectors.map((s) => [s.id, s])),
    [sectors]
  );

  const setTimeframe = (next: SectorTimeframe) => {
    if (!controlledTimeframe) setInternalTimeframe(next);
    onTimeframeChange?.(next);
  };

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Segment Heatmap</h2>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            S&amp;P 500 performance by sector
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
          role="group"
          aria-label="Performance timeframe"
        >
          {TIMEFRAMES.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={loading}
              onClick={() => setTimeframe(item.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                timeframe === item.id
                  ? "bg-secondary text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <PerformanceLegend />

      <div
        className={cn(
          "relative aspect-[25/14] w-full overflow-hidden rounded-xl border border-border/80 bg-[#0c1222]",
          loading && "animate-pulse"
        )}
        aria-busy={loading}
      >
        {rects.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No sector data available.
          </p>
        ) : (
          <svg
            viewBox="0 0 100 56"
            className="h-full w-full"
            role="img"
            aria-label="Sector performance treemap"
            preserveAspectRatio="none"
          >
            {rects.map((rect) => {
              const sector = sectorById.get(rect.id);
              if (!sector) return null;
              const perf = sector.livePerfPercent ?? 0;
              const fill = performanceToHeatColor(perf);
              const pad = 0.35;
              const showDetail = rect.width > 12 && rect.height > 10;
              const showTicker = rect.width > 8 && rect.height > 7;

              return (
                <g key={rect.id}>
                  <rect
                    x={rect.x + pad / 2}
                    y={rect.y + pad / 2}
                    width={Math.max(0, rect.width - pad)}
                    height={Math.max(0, rect.height - pad)}
                    rx={0.8}
                    fill={fill}
                  />
                  {showDetail && (
                    <text
                      x={rect.x + 1.8}
                      y={rect.y + 3.2}
                      fill="rgba(255,255,255,0.72)"
                      fontSize="2.1"
                      fontWeight="600"
                    >
                      {(sector.shortLabel ?? sector.label).toUpperCase()}
                    </text>
                  )}
                  {showTicker && sector.leadSymbol && (
                    <>
                      <text
                        x={rect.x + 1.8}
                        y={rect.y + rect.height - 5.5}
                        fill="white"
                        fontSize="3.4"
                        fontWeight="700"
                      >
                        {sector.leadSymbol}
                      </text>
                      <text
                        x={rect.x + 1.8}
                        y={rect.y + rect.height - 2.2}
                        fill="rgba(255,255,255,0.9)"
                        fontSize="2.2"
                        fontWeight="500"
                      >
                        {formatSignedPercent(perf)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </section>
  );
}
