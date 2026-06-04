"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { AllocationClassRollup, DisplayUnit } from "@portfolio/contracts";
import { ASSET_CLASS_ORDER } from "@portfolio/contracts";
import { ASSET_CLASS_COLORS } from "@/lib/investment-plan/colors";
import {
  formatAllocationAmount,
  formatCompactCurrency,
} from "@/lib/investment-plan/format";
import {
  buildRingSegments,
  MIN_SLICE_PERCENT,
  type RingSegment,
} from "@/lib/investment-plan/ring-segments";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";
import { cn, formatPercent } from "@/lib/utils";

function allocationDeltaTone(deltaPct: number): string {
  if (Math.abs(deltaPct) < 0.5) return "text-muted-foreground";
  return deltaPct > 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400";
}

function AllocationPieChart({
  title,
  slices,
  size,
  focusedLabel,
  onFocus,
  onClearFocus,
}: {
  title: string;
  slices: { label: string; value: number; fill: string }[];
  size: number;
  focusedLabel: string | null;
  onFocus: (label: string | null) => void;
  onClearFocus: () => void;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.45;

  const segments = buildRingSegments(cx, cy, 0, radius, slices);

  const sliceOpacity = (label: string) =>
    !focusedLabel || focusedLabel === label ? 1 : 0.28;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="max-w-full touch-manipulation"
        role="img"
        aria-label={`${title} allocation by asset class`}
        onMouseLeave={onClearFocus}
      >
        {segments.length === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            className="fill-muted stroke-border"
            strokeWidth={1}
          />
        ) : (
          segments.map((seg) => (
            <PieSlice
              key={`${title}-${seg.label}`}
              seg={seg}
              focused={focusedLabel === seg.label}
              opacity={sliceOpacity(seg.label)}
              onFocus={onFocus}
            />
          ))
        )}
      </svg>
    </div>
  );
}

function PieSlice({
  seg,
  focused,
  opacity,
  onFocus,
}: {
  seg: RingSegment;
  focused: boolean;
  opacity: number;
  onFocus: (label: string | null) => void;
}) {
  const offset = focused ? 2 : 0;
  return (
    <path
      d={seg.d}
      fill={seg.fill}
      opacity={opacity}
      className="cursor-pointer stroke-background"
      strokeWidth={focused ? 2 : 1.25}
      strokeLinejoin="round"
      transform={
        focused
          ? `translate(${Math.cos(seg.midAngle) * offset}, ${Math.sin(seg.midAngle) * offset})`
          : undefined
      }
      onPointerEnter={() => onFocus(seg.label)}
      onPointerLeave={() => onFocus(null)}
      onClick={() => onFocus(focused ? null : seg.label)}
    />
  );
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

  const pieSize = isMobile ? 148 : 168;

  const segments = useMemo(() => {
    const byClass = new Map(classes.map((c) => [c.assetClass, c]));
    return ASSET_CLASS_ORDER.map((assetClass) => byClass.get(assetClass))
      .filter((c): c is AllocationClassRollup => c != null)
      .map((c) => ({
        ...c,
        fill: ASSET_CLASS_COLORS[c.assetClass],
      }));
  }, [classes]);

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

  const activeSegment = focusedLabel
    ? segments.find((s) => s.label === focusedLabel)
    : undefined;

  const legendRows = segments.filter(
    (s) => s.planPercent > MIN_SLICE_PERCENT || s.actualPercent > MIN_SLICE_PERCENT
  );

  if (loading) {
    return (
      <div className="flex h-[280px] items-center justify-center">
        <div className="h-48 w-48 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  const deltaPct = activeSegment
    ? activeSegment.actualPercent - activeSegment.planPercent
    : 0;
  const delta$ = activeSegment
    ? (activeSegment.actualDollars ?? 0) - activeSegment.planDollars
    : 0;

  const chartsBlock = (
    <div
      className={cn(
        "flex shrink-0 gap-4",
        isMobile ? "flex-col items-center" : "flex-row items-start justify-center"
      )}
    >
      <AllocationPieChart
        title="Planned"
        slices={planSlices}
        size={pieSize}
        focusedLabel={focusedLabel}
        onFocus={setFocusedLabel}
        onClearFocus={() => setFocusedLabel(null)}
      />
      <AllocationPieChart
        title="Actual"
        slices={actualSlices}
        size={pieSize}
        focusedLabel={focusedLabel}
        onFocus={setFocusedLabel}
        onClearFocus={() => setFocusedLabel(null)}
      />
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
  ) : null;

  const trailingSummary = `${formatCompactCurrency(netWorth)} net worth · ${plannedTotalPercent.toFixed(1)}% planned · ${formatCompactCurrency(actualTotalDollars ?? 0, { hidden: !valuesUnlocked })} actual`;

  return (
    <div className="space-y-3.5">
      <p className={cn("text-sm text-muted-foreground", !isMobile && "text-right")}>
        {trailingSummary}
      </p>
      <div
        className={cn(
          "flex gap-6",
          isMobile ? "flex-col items-center" : "flex-row items-start"
        )}
      >
        {chartsBlock}
        {!isMobile && (
          <div className="min-w-[220px] max-w-[380px] flex-1 space-y-3">{legendBlock}</div>
        )}
      </div>
      {isMobile && legendBlock}
      {detailBlock}
    </div>
  );
}
