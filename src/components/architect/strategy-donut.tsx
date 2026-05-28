"use client";

import type { ArchitectStrategy } from "@/lib/architect-types";

const SLICES = [
  { key: "equitiesPercent" as const, label: "Equities", color: "#8b5cf6" },
  { key: "bondsPercent" as const, label: "Bonds", color: "#93c5fd" },
  { key: "cashPercent" as const, label: "Cash", color: "#10b981" },
];

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number
) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
}

export function StrategyDonut({
  strategy,
  centerLabel,
}: {
  strategy: ArchitectStrategy;
  centerLabel: string;
}) {
  let cumulative = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
          {SLICES.map((slice) => {
            const percent = strategy[slice.key];
            const start = (cumulative / 100) * 360;
            cumulative += percent;
            const end = (cumulative / 100) * 360;
            if (percent <= 0) return null;
            if (percent >= 99.9) {
              return (
                <circle key={slice.key} cx="50" cy="50" r="42" fill={slice.color} />
              );
            }
            return (
              <path
                key={slice.key}
                d={arcPath(50, 50, 42, start, end)}
                fill={slice.color}
                stroke="#0a0e1b"
                strokeWidth="0.6"
              />
            );
          })}
          <circle cx="50" cy="50" r="26" fill="#0a0e1b" />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {centerLabel.split(" ")[0]}
          </span>
          <span className="text-lg font-bold text-foreground">
            {centerLabel.split(" ").slice(1).join(" ")}
          </span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {SLICES.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-muted-foreground">{slice.label}</span>
            <span className="ml-auto font-medium tabular-nums">
              {strategy[slice.key].toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
