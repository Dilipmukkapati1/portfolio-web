import { formatCurrency, formatPercent } from "@/lib/utils";

function compactAmount(abs: number): string {
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return `${v >= 100 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return abs.toFixed(0);
}

export function formatCompactCurrency(
  n: number,
  options?: { hidden?: boolean }
): string {
  if (options?.hidden) return "—";
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${compactAmount(Math.abs(n))}`;
}

export function formatAllocationAmount(
  displayUnit: "dollar" | "percent",
  dollars: number | null,
  percent: number,
  hidden = false
): string {
  if (displayUnit === "percent") return formatPercent(percent);
  if (hidden || dollars == null) return "—";
  return formatCompactCurrency(dollars);
}

export function instrumentShortName(name: string): string {
  const match = name.match(/[—–-]\s*(.+)/);
  return match ? match[1].trim() : name;
}
