"use client";

import type { FundProfile, ReturnPeriod } from "@portfolio/contracts";
import {
  compoundRateForProjection,
  formatReturnPct,
  returnRateForPeriod,
} from "@portfolio/contracts";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { cn } from "@/lib/utils";

function projectionPeriodLabel(period: ReturnPeriod): string {
  switch (period) {
    case "1y":
      return "1Y";
    case "3y":
      return "3Y";
    case "5y":
      return "5Y";
    default:
      return "Life";
  }
}

function formatExpenseRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

function ProfileStat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <div className="rounded-md border bg-muted/25 px-2 py-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold tabular-nums leading-tight",
          tone === "primary" && "text-primary",
          tone === "warning" && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function FundProfileDetails({
  profile,
  projectionRate,
  reinvestDividends,
  allocationPrincipal,
}: {
  profile: FundProfile;
  projectionRate: ReturnPeriod;
  reinvestDividends: boolean;
  allocationPrincipal: number;
}) {
  const period = projectionPeriodLabel(projectionRate);
  const priceReturn = returnRateForPeriod(profile, projectionRate);
  const compound = compoundRateForProjection(profile, projectionRate, reinvestDividends);
  const hasDividend = profile.dividendYield > 0;
  const dripOn = reinvestDividends && hasDividend;

  const projectedHint = dripOn
    ? `${formatReturnPct(priceReturn)} + ${formatReturnPct(profile.dividendYield)} div`
    : undefined;

  const estAnnualFee =
    profile.feeKind === "expense_ratio" && allocationPrincipal > 0
      ? allocationPrincipal * profile.expenseRatio
      : 0;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        <ProfileStat
          label="Dividend yield"
          value={hasDividend ? formatReturnPct(profile.dividendYield) : "None"}
        />
        <ProfileStat
          label={`Projected (${period})`}
          value={formatReturnPct(compound)}
          hint={projectedHint}
          tone="primary"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {profile.yearsSinceInception} years since {profile.inceptionLabel}
      </p>

      {profile.feeKind === "expense_ratio" ? (
        <div className="border-t border-border/60 pt-2">
          <div className="grid grid-cols-2 gap-1.5">
            <ProfileStat label="Expense ratio" value={formatExpenseRatio(profile.expenseRatio)} />
            <ProfileStat
              label="Est. annual cost"
              value={
                allocationPrincipal > 0
                  ? formatCompactCurrency(estAnnualFee)
                  : "—"
              }
              hint={
                allocationPrincipal > 0
                  ? `${formatExpenseRatio(profile.expenseRatio)} × ${formatCompactCurrency(allocationPrincipal)}`
                  : "Enter % NW above"
              }
              tone={allocationPrincipal > 0 ? "warning" : "default"}
            />
          </div>
        </div>
      ) : profile.feeKind === "commission" ? (
        <div className="border-t border-border/60 pt-2">
          <ProfileStat label="Trading fee" value="$0 commission" hint="No expense ratio" />
        </div>
      ) : (
        <div className="border-t border-border/60 pt-2">
          <ProfileStat label="Fees" value="None" />
        </div>
      )}
    </div>
  );
}
