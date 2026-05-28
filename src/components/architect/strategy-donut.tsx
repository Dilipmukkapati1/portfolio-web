"use client";

import type { ArchitectStrategy } from "@/lib/architect-types";

const SLICES = [
  { key: "equitiesPercent" as const, label: "Equities", color: "#8b5cf6" },
  { key: "bondsPercent" as const, label: "Bonds", color: "#93c5fd" },
  { key: "cashPercent" as const, label: "Cash", color: "#10b981" },
] as const;

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutRing(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  start: number,
  end: number
) {
  if (end - start >= 359.99) {
    return (
      <>
        <circle cx={cx} cy={cy} r={outerR} fill="currentColor" />
        <circle cx={cx} cy={cy} r={innerR} fill="#0a0e1b" />
      </>
    );
  }
  const outerStart = polar(cx, cy, outerR, end);
  const outerEnd = polar(cx, cy, outerR, start);
  const innerStart = polar(cx, cy, innerR, start);
  const innerEnd = polar(cx, cy, innerR, end);
  const large = end - start <= 180 ? 0 : 1;
  return (
    <path
      d={`M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${large} 0 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${large} 1 ${innerStart.x} ${innerStart.y} Z`}
      fill="currentColor"
    />
  );
}

function DonutRingLayer({
  strategy,
  outerR,
  innerR,
  opacity = 1,
}: {
  strategy: ArchitectStrategy;
  outerR: number;
  innerR: number;
  opacity?: number;
}) {
  let cumulative = 0;
  return (
    <g opacity={opacity}>
      {SLICES.map((slice) => {
        const percent = strategy[slice.key];
        const start = (cumulative / 100) * 360;
        cumulative += percent;
        const end = (cumulative / 100) * 360;
        if (percent <= 0) return null;
        return (
          <g key={slice.key} style={{ color: slice.color }}>
            {donutRing(50, 50, outerR, innerR, start, end)}
          </g>
        );
      })}
    </g>
  );
}

export function StrategyDonut({
  planned,
  executed,
  centerLabel,
}: {
  planned: ArchitectStrategy;
  executed: ArchitectStrategy;
  centerLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto shrink-0 sm:mx-0">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
            <DonutRingLayer strategy={planned} outerR={46} innerR={36} opacity={0.45} />
            <DonutRingLayer strategy={executed} outerR={34} innerR={22} opacity={1} />
            <circle cx="50" cy="50" r="18" fill="#0a0e1b" />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {centerLabel}
            </span>
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded-full bg-muted-foreground/40" />
            Planned
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded-full bg-violet-400" />
            Executed
          </span>
        </div>
      </div>
      <ul className="w-full space-y-3 text-sm">
        {SLICES.map((slice) => (
          <li key={slice.key}>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="font-medium">{slice.label}</span>
            </div>
            <div className="ml-4 mt-0.5 flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>Planned {planned[slice.key].toFixed(0)}%</span>
              <span className="text-foreground">
                Executed {executed[slice.key].toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
