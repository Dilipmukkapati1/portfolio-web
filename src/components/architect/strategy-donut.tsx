"use client";

import type { ArchitectStrategy } from "@/lib/architect-types";

const SLICES = [
  { key: "equitiesPercent" as const, label: "Equities", color: "#8b5cf6" },
  { key: "bondsPercent" as const, label: "Bonds", color: "#93c5fd" },
  { key: "cashPercent" as const, label: "Cash", color: "#10b981" },
] as const;

const CHART_BG = "#0a0e1b";
/** Degrees of space between slice boundaries on each ring */
const SLICE_GAP_DEG = 2.5;

/** Outer planned ring */
const PLANNED_OUTER = 48;
const PLANNED_INNER = 39;
/** Inner executed ring — separated from planned (no radial overlap) */
const EXECUTED_OUTER = 35;
const EXECUTED_INNER = 26;
const CENTER_R = 20;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function ringSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number
) {
  const sweep = endDeg - startDeg;
  if (sweep <= 0) return null;
  if (sweep >= 359.99) {
    return `M ${cx} ${cy} m 0 -${outerR} a ${outerR} ${outerR} 0 1 1 0 ${outerR * 2} a ${outerR} ${outerR} 0 1 1 0 -${outerR * 2} M ${cx} ${cy} m 0 -${innerR} a ${innerR} ${innerR} 0 1 0 0 ${innerR * 2} a ${innerR} ${innerR} 0 1 0 0 -${innerR * 2} Z`;
  }

  const outerStart = polar(cx, cy, outerR, endDeg);
  const outerEnd = polar(cx, cy, outerR, startDeg);
  const innerStart = polar(cx, cy, innerR, startDeg);
  const innerEnd = polar(cx, cy, innerR, endDeg);
  const large = sweep <= 180 ? 0 : 1;

  return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${large} 0 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${large} 1 ${innerStart.x} ${innerStart.y} Z`;
}

type SliceArc = {
  key: (typeof SLICES)[number]["key"];
  start: number;
  end: number;
  color: string;
};

function buildSliceArcs(strategy: ArchitectStrategy): SliceArc[] {
  const active = SLICES.filter((s) => strategy[s.key] > 0);
  if (active.length === 0) return [];

  const totalGap = active.length * SLICE_GAP_DEG;
  const available = 360 - totalGap;
  let cursor = 0;
  const arcs: SliceArc[] = [];

  for (const slice of active) {
    const sweep = (strategy[slice.key] / 100) * available;
    arcs.push({
      key: slice.key,
      start: cursor + SLICE_GAP_DEG / 2,
      end: cursor + SLICE_GAP_DEG / 2 + sweep,
      color: slice.color,
    });
    cursor += sweep + SLICE_GAP_DEG;
  }

  return arcs;
}

function StrategyRing({
  strategy,
  outerR,
  innerR,
  variant,
}: {
  strategy: ArchitectStrategy;
  outerR: number;
  innerR: number;
  variant: "planned" | "executed";
}) {
  const arcs = buildSliceArcs(strategy);

  return (
    <g>
      {arcs.map((arc) => {
        const d = ringSegmentPath(50, 50, outerR, innerR, arc.start, arc.end);
        if (!d) return null;
        return (
          <path
            key={arc.key}
            d={d}
            fill={arc.color}
            fillOpacity={variant === "planned" ? 0.28 : 1}
            stroke={arc.color}
            strokeOpacity={variant === "planned" ? 0.85 : 1}
            strokeWidth={variant === "planned" ? 1.8 : 0}
            strokeLinejoin="round"
          />
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
        <div className="relative h-48 w-48">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
            <StrategyRing
              strategy={planned}
              outerR={PLANNED_OUTER}
              innerR={PLANNED_INNER}
              variant="planned"
            />
            <StrategyRing
              strategy={executed}
              outerR={EXECUTED_OUTER}
              innerR={EXECUTED_INNER}
              variant="executed"
            />
            <circle cx={50} cy={50} r={CENTER_R} fill={CHART_BG} />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center">
            <span className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
              {centerLabel}
            </span>
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full border-2"
              style={{ borderColor: "#8b5cf6", backgroundColor: "transparent" }}
            />
            Planned (outer)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#8b5cf6" }}
            />
            Executed (inner)
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
              <span className="font-medium text-foreground">
                Executed {executed[slice.key].toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
