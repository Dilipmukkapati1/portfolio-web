"use client";

import { useMemo } from "react";
import { Lock, Wallet } from "lucide-react";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import {
  resolveHouseholdIncomeBreakdown,
  type HouseholdIncomeBreakdown,
} from "@/lib/household-income";
import type { Member } from "@/lib/household-types";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonthly(annual: number): string {
  return `${formatCurrency(Math.round(annual / 12))}/mo`;
}

function breakdownDetail(breakdown: HouseholdIncomeBreakdown): string {
  const parts: string[] = [];

  if (breakdown.earnerCount > 0) {
    parts.push(
      `${breakdown.earnerCount} earner${breakdown.earnerCount === 1 ? "" : "s"}`
    );
  }
  if (breakdown.wages > 0) {
    parts.push(`${formatCompactCurrency(breakdown.wages)} wages`);
  }
  if (breakdown.bonus > 0) {
    parts.push(`${formatCompactCurrency(breakdown.bonus)} bonus`);
  }
  if (breakdown.cashIncome > 0) {
    parts.push(`${formatCompactCurrency(breakdown.cashIncome)} cash`);
  }
  if (breakdown.other > 0) {
    parts.push(`${formatCompactCurrency(breakdown.other)} other`);
  }

  return parts.join(" · ");
}

export function HouseholdIncomeSummary({
  members,
  isUnlocked,
  onUnlock,
  loading = false,
  className,
}: {
  members: Member[];
  isUnlocked: boolean;
  onUnlock: () => void;
  loading?: boolean;
  className?: string;
}) {
  const breakdown = useMemo(
    () => resolveHouseholdIncomeBreakdown(members),
    [members]
  );

  if (loading || members.length === 0) return null;

  const detail = breakdownDetail(breakdown);
  const locked = !isUnlocked;
  const empty = isUnlocked && breakdown.total <= 0;

  const subtitle = locked
    ? "Tap to unlock and view your household income"
    : empty
      ? "Add wages, bonus, or other income for members"
      : detail || "Add income in member settings";

  const monthlyHint =
    isUnlocked && breakdown.total > 0 ? formatMonthly(breakdown.total) : null;

  const content = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
        )}
      >
        {locked ? <Lock className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Total annual income
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-2xl font-semibold tabular-nums tracking-tight",
            locked && "text-muted-foreground"
          )}
        >
          {locked ? "••••••" : empty ? "—" : formatCurrency(breakdown.total)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {subtitle}
          {monthlyHint && (
            <span className="sm:hidden"> · {monthlyHint}</span>
          )}
        </p>
      </div>

      {monthlyHint && (
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Monthly
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {monthlyHint}
          </p>
        </div>
      )}

      {locked && (
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:hidden">
          Unlock
        </span>
      )}
    </>
  );

  const shellClassName = cn(
    "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors",
    locked
      ? "cursor-pointer border-border bg-muted/20 hover:border-primary/30 hover:bg-muted/35"
      : empty
        ? "border-dashed border-border bg-muted/10"
        : "border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-card",
    className
  );

  if (locked) {
    return (
      <button type="button" className={shellClassName} onClick={onUnlock}>
        {content}
      </button>
    );
  }

  return <div className={shellClassName}>{content}</div>;
}
