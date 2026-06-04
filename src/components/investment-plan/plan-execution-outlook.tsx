"use client";

import type { PlanExecutionOutlook } from "@portfolio/contracts";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { cn } from "@/lib/utils";

function outlookTone(percent: number): string {
  if (percent >= 90) return "text-green-600 dark:text-green-400";
  if (percent >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

function outlookLabel(percent: number): string {
  if (percent >= 90) return "On track";
  if (percent >= 70) return "Nearly there";
  return "Behind plan";
}

export function PlanExecutionOutlookSummary({
  executionOutlook,
  valuesUnlocked,
  compact = false,
}: {
  executionOutlook: PlanExecutionOutlook | null;
  valuesUnlocked: boolean;
  /** Tighter layout for the plan tab header area. */
  compact?: boolean;
}) {
  if (!valuesUnlocked) {
    return null;
  }

  if (!executionOutlook) {
    return (
      <div
        className={cn(
          "rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5",
          compact ? "py-2" : "py-3"
        )}
      >
        <p className="text-sm font-medium">Overall outlook</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add instruments to your plan to track execution vs targets.
        </p>
      </div>
    );
  }

  const { overallOutlook, onTrackCount, instrumentCount, plannedTotalDollars, executedDollars } =
    executionOutlook;
  const toneClass = outlookTone(overallOutlook);

  return (
    <div
      className={cn(
        "rounded-md border bg-muted/20 px-3",
        compact ? "py-2.5" : "py-3"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Overall outlook</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Plan vs executed · weighted by target size
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn("text-2xl font-semibold tabular-nums leading-none", toneClass)}>
            {overallOutlook.toFixed(0)}%
          </p>
          <p className={cn("mt-1 text-xs font-medium", toneClass)}>{outlookLabel(overallOutlook)}</p>
        </div>
      </div>

      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(overallOutlook)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall plan execution"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            overallOutlook >= 90
              ? "bg-green-600 dark:bg-green-500"
              : overallOutlook >= 70
                ? "bg-amber-500"
                : "bg-primary/70"
          )}
          style={{ width: `${Math.min(100, overallOutlook)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {onTrackCount} of {instrumentCount} instruments on track ·{" "}
        {formatCompactCurrency(executedDollars)} of{" "}
        {formatCompactCurrency(plannedTotalDollars)} deployed
      </p>
    </div>
  );
}
