"use client";

import { useMemo, useState } from "react";
import {
  budgetForDuration,
  budgetUsedPercent,
  buildRedFlags,
  monthlyBudgetTotal,
} from "@portfolio/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DurationPreset } from "@/lib/expense-planner/date-ranges";
import { mergeCategoryLabel, visibleCategoryPreferences } from "@/lib/expense-planner/categories";
import { BudgetUsageBar } from "./budget-usage-bar";
import { DurationSelectRow, type OverviewPieView } from "./duration-select-row";
import { ExpensePieChart, ExpensePieLegend } from "./expense-pie-chart";
import { RedFlagCallouts } from "./red-flag-callouts";
import type { useExpensePlanner } from "@/hooks/use-expense-planner";

type PlannerState = ReturnType<typeof useExpensePlanner>;

export function OverviewTab({
  state,
}: {
  state: PlannerState;
}) {
  const [pieView, setPieView] = useState<OverviewPieView>("category");
  const categories = state.plan?.categories ?? [];
  const visible = visibleCategoryPreferences(categories);
  const monthlyTotal = monthlyBudgetTotal(categories);
  const budgetRange = budgetForDuration(state.duration, monthlyTotal);
  const totalSpend = state.summary?.totalSpend ?? 0;
  const usedPct = budgetUsedPercent(totalSpend, budgetRange);
  const valuesUnlocked = state.valuesUnlocked;

  const categoryPieData = useMemo(() => {
    const spend = state.summary?.spendByCategory ?? {};
    return visible
      .map((c) => ({
        label: mergeCategoryLabel(c.category, categories),
        value: spend[c.category] ?? 0,
      }))
      .filter((d) => d.value > 0);
  }, [visible, state.summary?.spendByCategory, categories]);

  const accountPieData = useMemo(() => {
    const spend = valuesUnlocked
      ? state.summary?.spendByAccount ?? {}
      : Object.fromEntries(
          Object.entries(state.summary?.spendByAccountPercent ?? {}).map(([k, v]) => [
            k,
            v,
          ])
        );
    if (!valuesUnlocked) {
      return Object.entries(state.summary?.spendByAccountPercent ?? {})
        .filter(([, v]) => v > 0)
        .map(([label, value]) => ({ label, value }));
    }
    return Object.entries(spend)
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [state.summary, valuesUnlocked]);

  const activeData = pieView === "category" ? categoryPieData : accountPieData;
  const activeTotal =
    pieView === "category"
      ? totalSpend
      : activeData.reduce((s, d) => s + d.value, 0);

  const redFlags = buildRedFlags({
    totalSpend,
    budgetForRange: budgetRange,
    budgetUsedPct: usedPct,
    duration: state.duration as DurationPreset,
    rangeLabel: state.range.label,
    spendByCategory: state.summary?.spendByCategory ?? {},
    categories,
    unmappedCount: state.unmappedTransactions.length,
    unmappedAmount: state.unmappedTransactions.reduce(
      (s, t) => s + Math.abs(t.amount),
      0
    ),
    dayOfMonth: new Date().getDate(),
  });

  return (
    <div className="space-y-4">
      <DurationSelectRow
        duration={state.duration}
        onDurationChange={state.setDuration}
        pieView={pieView}
        onPieViewChange={setPieView}
        customStart={state.customStart}
        customEnd={state.customEnd}
        onCustomStartChange={state.setCustomStart}
        onCustomEndChange={state.setCustomEnd}
        rangeLabel={state.range.label}
        rangeError={state.rangeError}
      />

      <StatCard
        title="Total expenses"
        value={
          valuesUnlocked
            ? `${formatCurrency(totalSpend, { decimals: 0 })} · ${formatPercent(budgetRange > 0 ? (totalSpend / budgetRange) * 100 : 0, 0)} of budget`
            : "Unlock to view amounts"
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Budget utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetUsageBar
            spent={totalSpend}
            budget={budgetRange}
            valuesUnlocked={valuesUnlocked}
          />
        </CardContent>
      </Card>

      <RedFlagCallouts flags={redFlags} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Spending breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensePieChart
            data={activeData}
            total={activeTotal}
            valuesUnlocked={valuesUnlocked || pieView === "account"}
          />
          <ExpensePieLegend
            data={activeData}
            total={activeTotal}
            valuesUnlocked={valuesUnlocked || pieView === "account"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
