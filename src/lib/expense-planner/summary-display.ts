import type { TransactionSummaryResponse } from "@portfolio/contracts";

export type ExpenseSummaryView = TransactionSummaryResponse & {
  privacyMode?: "locked" | "unlocked";
  valuesUnlocked?: boolean;
  spendByCategoryPercent?: Record<string, number>;
  spendByAccountPercent?: Record<string, number>;
};

/** Category spend for charts — dollars when unlocked, share-of-spend % when locked. */
export function categorySpendSlice(
  summary: ExpenseSummaryView | null,
  category: string,
  valuesUnlocked: boolean
): number {
  if (!summary) return 0;
  if (valuesUnlocked && summary.spendByCategory) {
    return summary.spendByCategory[category] ?? 0;
  }
  return summary.spendByCategoryPercent?.[category] ?? 0;
}

export function buildCategoryPieData(
  summary: ExpenseSummaryView | null,
  categories: Array<{ category: string; label?: string }>,
  mergeLabel: (category: string) => string,
  valuesUnlocked: boolean
): Array<{ label: string; value: number }> {
  if (!summary) return [];
  return categories
    .map((c) => ({
      label: mergeLabel(c.category),
      value: categorySpendSlice(summary, c.category, valuesUnlocked),
    }))
    .filter((d) => d.value > 0);
}

/** Denominator for pie charts — dollars when unlocked, sum of slice weights when locked. */
export function pieChartTotal(
  slices: Array<{ value: number }>,
  valuesUnlocked: boolean,
  unlockedTotalSpend: number
): number {
  if (valuesUnlocked) return unlockedTotalSpend;
  const sum = slices.reduce((s, d) => s + d.value, 0);
  return sum > 0 ? sum : 100;
}

export function topCategorySlices(
  summary: ExpenseSummaryView | null,
  valuesUnlocked: boolean,
  limit = 5
): Array<{ category: string; value: number }> {
  if (!summary) return [];
  const entries = valuesUnlocked
    ? Object.entries(summary.spendByCategory ?? {})
    : Object.entries(summary.spendByCategoryPercent ?? {});
  return entries
    .map(([category, value]) => ({ category, value }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function hasSpendData(summary: ExpenseSummaryView | null): boolean {
  if (!summary) return false;
  if ((summary.transactionCount ?? 0) > 0) return true;
  if (summary.spendByCategory && Object.keys(summary.spendByCategory).length > 0) {
    return true;
  }
  if (
    summary.spendByCategoryPercent &&
    Object.keys(summary.spendByCategoryPercent).length > 0
  ) {
    return true;
  }
  return false;
}
