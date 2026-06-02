"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { AllocationClassRollup, DisplayUnit } from "@portfolio/contracts";
import { ASSET_CLASS_COLORS } from "@/lib/investment-plan/colors";
import {
  formatAllocationAmount,
  formatCompactCurrency,
} from "@/lib/investment-plan/format";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";
import { cn, formatPercent } from "@/lib/utils";

const DONUT_SLICE_GAP_RAD = 0.022;

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function ringSegmentPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  start: number,
  end: number
): string {
  const span = end - start;
  if (span <= 0) return "";
  if (span >= 2 * Math.PI - 1e-6) {
    const mid = start + Math.PI;
    return `${ringSegmentPath(cx, cy, rInner, rOuter, start, mid)} ${ringSegmentPath(cx, cy, rInner, rOuter, mid, end)}`;
  }
  const p0o = polar(cx, cy, rOuter, start);
  const p1o = polar(cx, cy, rOuter, end);
  const p1i = polar(cx, cy, rInner, end);
  const p0i = polar(cx, cy, rInner, start);
  const large = span > Math.PI ? 1 : 0;
  return `M ${p0o.x} ${p0o.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} A ${rInner} ${rInner} 0 ${large} 0 ${p0i.x} ${p0i.y} Z`;
}

type RingSegment = {
  d: string;
  fill: string;
  label: string;
  midAngle: number;
};

function buildRingSegments(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  slices: { label: string; value: number; fill: string }[]
): RingSegment[] {
  const active = slices.filter((sl) => sl.value > 0.05);
  const total = active.reduce((s, sl) => s + sl.value, 0);
  if (total <= 0) return [];
  const gapTotal = active.length * DONUT_SLICE_GAP_RAD;
  const sweepBudget = Math.max(0, 2 * Math.PI - gapTotal);
  let angle = -Math.PI / 2 + DONUT_SLICE_GAP_RAD / 2;
  return active
    .map((sl) => {
      const sweep = (sl.value / total) * sweepBudget;
      const start = angle;
      const end = angle + sweep;
      const midAngle = (start + end) / 2;
      angle = end + DONUT_SLICE_GAP_RAD;
      return {
        d: ringSegmentPath(cx, cy, rInner, rOuter, start, end),
        fill: sl.fill,
        label: sl.label,
        midAngle,
      };
    })
    .filter((seg) => seg.d.length > 0);
}

function allocationDeltaTone(deltaPct: number): string {
  if (Math.abs(deltaPct) < 0.5) return "text-muted-foreground";
  return deltaPct > 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400";
}

export function AllocationDonut({
  classes,
  displayUnit,
  netWorth,
  valuesUnlocked,
  plannedTotalPercent,
  actualTotalDollars,
  loading,
}: {
  classes: AllocationClassRollup[];
  displayUnit: DisplayUnit;
  netWorth: number;
  valuesUnlocked: boolean;
  plannedTotalPercent: number;
  actualTotalDollars: number | null;
  loading?: boolean;
}) {
  const isMobile = useIsMobile();
  const [focusedLabel, setFocusedLabel] = useState<string | null>(null);

  const size = isMobile ? 200 : 232;
  const cx = size / 2;
  const cy = size / 2;
  const outerInner = size * 0.34;
  const outerOuter = size * 0.48;
  const innerInner = size * 0.18;
  const innerOuter = size * 0.3;
  const hubRadius = size * 0.14;

  const segments = useMemo(
    () =>
      classes.map((c) => ({
        ...c,
        fill: ASSET_CLASS_COLORS[c.assetClass],
      })),
    [classes]
  );

  const planSlices = segments.map((s) => ({
    label: s.label,
    value: s.planPercent,
    fill: s.fill,
  }));
  const actualSlices = segments.map((s) => ({
    label: s.label,
    value: s.actualPercent,
    fill: s.fill,
  }));

  const outerSegments = buildRingSegments(cx, cy, outerInner, outerOuter, planSlices);
  const innerSegments = buildRingSegments(cx, cy, innerInner, innerOuter, actualSlices);

  const activeSegment = focusedLabel
    ? segments.find((s) => s.label === focusedLabel)
    : undefined;

  const legendRows = segments.filter(
    (s) => s.planPercent > 0.05 || s.actualPercent > 0.05
  );

  if (loading) {
    return (
      <div className="flex h-[280px] items-center justify-center">
        <div className="h-48 w-48 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  const sliceOpacity = (label: string) =>
    !focusedLabel || focusedLabel === label ? 1 : 0.28;

  const deltaPct = activeSegment
    ? activeSegment.actualPercent - activeSegment.planPercent
    : 0;
  const delta$ = activeSegment
    ? (activeSegment.actualDollars ?? 0) - activeSegment.planDollars
    : 0;

  const chartBlock = (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="max-w-full touch-manipulation"
        role="img"
        aria-label="Plan and actual allocation by asset class. Hover or tap a slice for values."
        onMouseLeave={() => setFocusedLabel(null)}
      >
        <circle
          cx={cx}
          cy={cy}
          r={outerOuter + 2}
          fill="none"
          className="stroke-border"
          strokeWidth={1}
        />
        <circle
          cx={cx}
          cy={cy}
          r={(outerInner + innerOuter) / 2}
          fill="none"
          className="stroke-border"
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={0.7}
        />
        <circle
          cx={cx}
          cy={cy}
          r={outerInner - 1}
          fill="none"
          className="stroke-border"
          strokeWidth={6}
          opacity={0.35}
        />
        <circle
          cx={cx}
          cy={cy}
          r={innerOuter + 1}
          fill="none"
          className="stroke-border"
          strokeWidth={6}
          opacity={0.35}
        />
        {outerSegments.map((seg) => {
          const focused = focusedLabel === seg.label;
          const offset = focused ? 2 : 0;
          return (
            <path
              key={`plan-${seg.label}`}
              d={seg.d}
              fill={seg.fill}
              opacity={sliceOpacity(seg.label)}
              className="cursor-pointer stroke-background"
              strokeWidth={focused ? 2 : 1.25}
              strokeLinejoin="round"
              transform={
                focused
                  ? `translate(${Math.cos(seg.midAngle) * offset}, ${Math.sin(seg.midAngle) * offset})`
                  : undefined
              }
              onPointerEnter={() => setFocusedLabel(seg.label)}
              onPointerLeave={() => setFocusedLabel(null)}
              onClick={() =>
                setFocusedLabel((prev) => (prev === seg.label ? null : seg.label))
              }
            />
          );
        })}
        {innerSegments.map((seg) => {
          const focused = focusedLabel === seg.label;
          const offset = focused ? 1.5 : 0;
          return (
            <path
              key={`actual-${seg.label}`}
              d={seg.d}
              fill={seg.fill}
              opacity={sliceOpacity(seg.label) * (focused ? 1 : 0.94)}
              className="cursor-pointer stroke-background"
              strokeWidth={focused ? 2 : 1.25}
              strokeLinejoin="round"
              transform={
                focused
                  ? `translate(${Math.cos(seg.midAngle) * offset}, ${Math.sin(seg.midAngle) * offset})`
                  : undefined
              }
              onPointerEnter={() => setFocusedLabel(seg.label)}
              onPointerLeave={() => setFocusedLabel(null)}
              onClick={() =>
                setFocusedLabel((prev) => (prev === seg.label ? null : seg.label))
              }
            />
          );
        })}
        <circle
          cx={cx}
          cy={cy}
          r={hubRadius}
          className="fill-background stroke-border"
          strokeWidth={1}
        />
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-[9px] font-medium"
        >
          Net worth
        </text>
        <text
          x={cx}
          y={cy + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-[11px] font-semibold sm:text-xs"
        >
          {formatCompactCurrency(netWorth)}
        </text>
      </svg>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="box-border h-3.5 w-3.5 rounded-full border-[3px] border-foreground/70 opacity-85" />
          <span className="text-xs text-muted-foreground">Plan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="box-border h-2.5 w-2.5 rounded-full border-[3px] border-foreground/70 opacity-85" />
          <span className="text-xs text-muted-foreground">Actual</span>
        </div>
      </div>
    </div>
  );

  const legendBlock = (
    <div className="min-w-0 flex-1 space-y-1.5">
      <p className="text-sm font-semibold">Asset classes</p>
      <div className="space-y-1">
        {legendRows.map((seg) => {
          const active = focusedLabel === seg.label;
          const planVal = formatAllocationAmount(
            displayUnit,
            seg.planDollars,
            seg.planPercent
          );
          const actualVal = formatAllocationAmount(
            displayUnit,
            seg.actualDollars,
            seg.actualPercent,
            displayUnit === "dollar" && !valuesUnlocked
          );
          return (
            <button
              key={seg.assetClass}
              type="button"
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
                active ? "border-current bg-muted/40" : "border-border bg-transparent"
              )}
              style={active ? { borderColor: seg.fill } : undefined}
              onPointerEnter={() => setFocusedLabel(seg.label)}
              onPointerLeave={() => setFocusedLabel(null)}
              onClick={() =>
                setFocusedLabel((prev) => (prev === seg.label ? null : seg.label))
              }
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: seg.fill }}
              />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", active && "font-semibold")}>{seg.label}</p>
                <p className="text-xs text-muted-foreground">
                  Plan {planVal} · Actual {actualVal}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const detailBlock = activeSegment ? (
    <div
      className="w-full space-y-2.5 rounded-lg border bg-muted/30 p-3.5"
      style={{ borderLeftWidth: 4, borderLeftColor: activeSegment.fill }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: activeSegment.fill }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{activeSegment.label}</p>
          <p className="text-xs text-muted-foreground">
            Plan vs actual · {displayUnit === "dollar" ? "$" : "%"} view
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="Clear selection"
          onClick={() => setFocusedLabel(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className={cn("grid gap-2", isMobile ? "grid-cols-2" : "grid-cols-3")}>
        <div>
          <p className="text-xs text-muted-foreground">Plan</p>
          <p className="text-sm font-medium tabular-nums text-primary">
            {formatAllocationAmount(
              displayUnit,
              activeSegment.planDollars,
              activeSegment.planPercent
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Actual</p>
          <p className="text-sm font-medium tabular-nums text-green-600 dark:text-green-400">
            {formatAllocationAmount(
              displayUnit,
              activeSegment.actualDollars,
              activeSegment.actualPercent,
              displayUnit === "dollar" && !valuesUnlocked
            )}
          </p>
        </div>
        <div className={isMobile ? "col-span-2" : undefined}>
          <p className="text-xs text-muted-foreground">vs plan</p>
          <p className={cn("text-sm font-medium tabular-nums", allocationDeltaTone(deltaPct))}>
            {displayUnit === "dollar"
              ? `${delta$ >= 0 ? "+" : ""}${formatCompactCurrency(delta$, { hidden: !valuesUnlocked })}`
              : `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {formatCompactCurrency(activeSegment.planDollars)} planned ·{" "}
        {formatCompactCurrency(activeSegment.actualDollars ?? 0, {
          hidden: !valuesUnlocked,
        })}{" "}
        held · {delta$ >= 0 ? "+" : ""}
        {formatCompactCurrency(delta$, { hidden: !valuesUnlocked })} ·{" "}
        {deltaPct >= 0 ? "+" : ""}
        {deltaPct.toFixed(1)} pp
      </p>
    </div>
  ) : (
    <p
      className={cn(
        "text-sm text-muted-foreground",
        isMobile ? "text-center" : "text-left"
      )}
    >
      Hover or tap a ring slice or legend row for plan vs actual. Values follow the{" "}
      {displayUnit === "dollar" ? "$" : "%"} toggle.
    </p>
  );

  const trailingSummary = `${plannedTotalPercent.toFixed(1)}% planned · ${formatCompactCurrency(actualTotalDollars ?? 0, { hidden: !valuesUnlocked })} actual`;

  return (
    <div className="space-y-3.5">
      {!isMobile && (
        <p className="text-right text-sm text-muted-foreground">{trailingSummary}</p>
      )}
      {isMobile && (
        <p className="text-sm text-muted-foreground">{trailingSummary}</p>
      )}
      <div
        className={cn(
          "flex gap-6",
          isMobile ? "flex-col items-center" : "flex-row items-start"
        )}
      >
        {chartBlock}
        {!isMobile && (
          <div className="min-w-[220px] max-w-[380px] flex-1 space-y-3">{legendBlock}</div>
        )}
      </div>
      {isMobile && legendBlock}
      {detailBlock}
    </div>
  );
}
