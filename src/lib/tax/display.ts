import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { formatCurrencyWhole, formatPercent } from "@/lib/utils";

export function formatTaxRate(rate: number, decimals = 0): string {
  if (!Number.isFinite(rate)) return "—";
  return formatPercent(rate * 100, decimals);
}

/** Dollar amount when unlocked; share of total as percent when locked. */
export function formatTaxShare(
  amount: number,
  total: number,
  unlocked: boolean,
  decimals = 1,
  progressFallback?: number
): string {
  if (unlocked) return formatCompactCurrency(amount);
  if (total > 0 && Number.isFinite(amount)) {
    return formatPercent((amount / total) * 100, decimals);
  }
  if (progressFallback != null && Number.isFinite(progressFallback)) {
    return formatPercent(progressFallback * 100, 0);
  }
  return "—";
}

export function formatTaxTotal(value: number, unlocked: boolean): string {
  if (unlocked) return formatCurrencyWhole(value);
  if (Number.isFinite(value) && value > 0) return "100%";
  return "—";
}

export function formatTaxYearSlice(progress: number, unlocked: boolean): string {
  if (unlocked) return "—";
  return formatPercent(progress * 100, 0);
}

export function formatContributionRoom(
  limit: {
    limit?: number;
    contributed?: number;
    remaining?: number;
    contributionUsedPercent?: number;
  },
  unlocked: boolean
): string {
  if (unlocked) {
    const remaining = limit.remaining ?? 0;
    if (remaining > 0) return `${formatCompactCurrency(remaining)} left`;
    return "Maxed";
  }
  const used =
    limit.contributionUsedPercent ??
    (limit.limit && limit.limit > 0 && limit.contributed != null
      ? (limit.contributed / limit.limit) * 100
      : undefined);
  if (used == null || !Number.isFinite(used)) return "—";
  return `${formatPercent(Math.min(100, used), 0)} used`;
}
