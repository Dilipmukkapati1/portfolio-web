"use client";

import type { AggregatedPlanFees } from "@portfolio/contracts";
import { MetricChips, type MetricChip } from "./metric-chips";
import {
  formatCompactCurrency,
  formatExpenseRatio,
} from "@/lib/investment-plan/format";

export function planFeesChips(fees: AggregatedPlanFees | null): MetricChip[] {
  if (!fees) return [];
  return [
    {
      key: "er",
      label: "Expense ratio",
      value: formatExpenseRatio(fees.weightedExpenseRatio),
      tone: "info",
    },
    {
      key: "annual-fees",
      label: "Est. annual fees",
      value: formatCompactCurrency(fees.annualExpenseDollars),
      tone: "warning",
    },
  ];
}

export function PlanFeesSummary({
  fees,
}: {
  fees: AggregatedPlanFees | null;
}) {
  const chips = planFeesChips(fees);
  if (chips.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">
        Weighted by planned % of net worth · {fees!.instrumentCount} fund
        {fees!.instrumentCount === 1 ? "" : "s"} with expense ratios
      </p>
      <MetricChips chips={chips} />
    </div>
  );
}
