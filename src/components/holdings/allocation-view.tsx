"use client";

import { useMemo } from "react";
import type { AllocationSlice } from "@/lib/holdings";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CHART_COLORS = [
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(280 65% 60%)",
  "hsl(0 72% 51%)",
  "hsl(189 94% 43%)",
  "hsl(330 81% 60%)",
  "hsl(84 81% 44%)",
  "hsl(24 95% 53%)",
  "hsl(199 89% 48%)",
];

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function AllocationPieChart({ slices }: { slices: AllocationSlice[] }) {
  const visibleSlices = slices.filter((slice) => slice.value > 0);
  let cumulative = 0;

  if (visibleSlices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No allocation data to display.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
      <svg
        viewBox="0 0 100 100"
        className="h-56 w-56 shrink-0"
        role="img"
        aria-label="Portfolio allocation pie chart"
      >
        {visibleSlices.map((slice, index) => {
          const startAngle = (cumulative / 100) * 360;
          cumulative += slice.percent;
          const endAngle = (cumulative / 100) * 360;
          const color = CHART_COLORS[index % CHART_COLORS.length];

          if (visibleSlices.length === 1) {
            return (
              <circle key={slice.id} cx="50" cy="50" r="45" fill={color} />
            );
          }

          return (
            <path
              key={slice.id}
              d={describeArc(50, 50, 45, startAngle, endAngle)}
              fill={color}
              stroke="hsl(var(--background))"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>
      <ul className="grid w-full max-w-md gap-2 sm:grid-cols-2">
        {visibleSlices.map((slice, index) => (
          <li key={slice.id} className="flex items-start gap-2 text-sm">
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
            <span className="min-w-0">
              <span className="font-medium">{slice.label}</span>
              <span className="block text-xs tabular-nums text-muted-foreground">
                {slice.percent.toFixed(1)}% · {formatCurrency(slice.value)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllocationTable({ slices }: { slices: AllocationSlice[] }) {
  const sorted = useMemo(
    () => [...slices].sort((a, b) => b.value - a.value),
    [slices]
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Investment</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">% of portfolio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((slice) => (
          <TableRow key={slice.id}>
            <TableCell className="font-medium">{slice.label}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(slice.value)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {slice.percent.toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type AllocationViewProps = {
  slices: AllocationSlice[];
  chartStyle: "pie" | "table";
  className?: string;
};

export function AllocationView({
  slices,
  chartStyle,
  className,
}: AllocationViewProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      {chartStyle === "pie" ? (
        <AllocationPieChart slices={slices} />
      ) : (
        <AllocationTable slices={slices} />
      )}
    </div>
  );
}

export { CHART_COLORS };
