import type { TransactionRecord } from "@/lib/transactions";

const EXCLUDED_CATEGORIES = new Set(["transfer", "investment"]);

export type TransactionPeriodSummary = {
  totalCredits: number;
  totalSpend: number;
  spendByCategory: Record<string, number>;
  transactionCount: number;
};

function isExcluded(category: string): boolean {
  return EXCLUDED_CATEGORIES.has(category);
}

export function summarizeTransactions(
  transactions: TransactionRecord[],
  options?: { startDate?: string; endDate?: string }
): TransactionPeriodSummary {
  let filtered = transactions;
  if (options?.startDate) {
    filtered = filtered.filter((txn) => txn.date >= options.startDate!);
  }
  if (options?.endDate) {
    filtered = filtered.filter((txn) => txn.date <= options.endDate!);
  }

  let totalCredits = 0;
  let totalSpend = 0;
  const spendByCategory: Record<string, number> = {};

  for (const txn of filtered) {
    if (isExcluded(txn.category)) continue;

    if (txn.amount > 0) {
      totalCredits += txn.amount;
    } else if (txn.amount < 0) {
      const spend = Math.abs(txn.amount);
      totalSpend += spend;
      spendByCategory[txn.category] =
        (spendByCategory[txn.category] ?? 0) + spend;
    }
  }

  return {
    totalCredits,
    totalSpend,
    spendByCategory,
    transactionCount: filtered.length,
  };
}

export function currentMonthLabel(): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function monthStartDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export function rollingDaysStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function earliestDashboardTransactionDate(): string {
  const monthStart = monthStartDate();
  const last30 = rollingDaysStartDate(30);
  return monthStart < last30 ? monthStart : last30;
}

export function topSpendCategories(
  spendByCategory: Record<string, number>,
  limit = 3
): string {
  const entries = Object.entries(spendByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (entries.length === 0) return "No categorized spend yet";

  return entries
    .map(([category, amount]) => `${formatCategoryName(category)} ${formatCompactCurrency(amount)}`)
    .join(" · ");
}

function formatCategoryName(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
