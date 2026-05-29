"use client";

import type { ArchitectStrategy } from "@/lib/architect-types";

const SLICES = [
  { key: "equitiesPercent" as const, label: "Equities", color: "#8b5cf6" },
  { key: "bondsPercent" as const, label: "Bonds", color: "#93c5fd" },
  { key: "cashPercent" as const, label: "Cash", color: "#10b981" },
] as const;

const CX = 50;
const CY = 50;
const CHART_BG = "#0a0e1b";

/** Mid-radius + stroke width for each ring (no overlap between rings) */
const PLANNED = { radius: 43, thickness: 7 };
const EXECUTED = { radius: 33, thickness: 7 };
const CENTER_R = 21;

const GAP_DEG = 3;

function DonutRing({
  strategy,
  radius,
  thickness,
  variant,
}: {
  strategy: ArchitectStrategy;
  radius: number;
  thickness: number;
  variant: "planned" | "executed";
}) {
  const circumference = 2 * Math.PI * radius;
  const active = SLICES.filter((s) => strategy[s.key] > 0.5);
  if (active.length === 0) return null;

  const totalGap = active.length * GAP_DEG;
  const availableDeg = 360 - totalGap;
  let angleCursor = 0;

  return (
    <g>
      {/* Subtle track */}
      <circle
        cx={CX}
        cy={CY}
        r={radius}
        fill="none"
        stroke="hsl(217 33% 22%)"
        strokeWidth={thickness}
        opacity={0.6}
      />
      {active.map((slice) => {
        const sweepDeg = (strategy[slice.key] / 100) * availableDeg;
        const arcLen = (sweepDeg / 360) * circumference;
        const dashOffset = circumference - (angleCursor / 360) * circumference;
        angleCursor += sweepDeg + GAP_DEG;

        return (
          <circle
            key={`${variant}-${slice.key}`}
            cx={CX}
            cy={CY}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={thickness}
            strokeDasharray={`${arcLen} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
            opacity={variant === "planned" ? 0.5 : 1}
            transform={`rotate(-90 ${CX} ${CY})`}
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
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            role="img"
            aria-label="Planned versus executed allocation"
          >
            <DonutRing
              strategy={planned}
              radius={PLANNED.radius}
              thickness={PLANNED.thickness}
              variant="planned"
            />
            <DonutRing
              strategy={executed}
              radius={EXECUTED.radius}
              thickness={EXECUTED.thickness}
              variant="executed"
            />
            <circle cx={CX} cy={CY} r={CENTER_R} fill={CHART_BG} />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center">
            <span className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
              {centerLabel}
            </span>
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-5 rounded-sm opacity-50"
              style={{ backgroundColor: "#8b5cf6" }}
            />
            Planned (outer)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-5 rounded-sm"
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
