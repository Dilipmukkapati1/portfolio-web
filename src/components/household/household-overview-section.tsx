"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TaxKeyValueRows,
  TaxPanel,
  TaxPanelHeader,
  TaxStat,
  TAX_INSET_X,
} from "@/components/tax/tax-primitives";
import { useHouseholdOverview, type OverviewPeriod } from "@/hooks/use-household-overview";
import { usePrivacy } from "@/components/PrivacyProvider";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: Array<{ id: OverviewPeriod; label: string }> = [
  { id: "current", label: "This year" },
  { id: "prior", label: "Last year" },
  { id: "lifetime", label: "To date" },
];

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

function maskedValue(unlocked: boolean, amount: number): string {
  if (!unlocked) return "••••••";
  return formatCurrency(amount);
}

function contributionRows(
  contributions: NonNullable<
    ReturnType<typeof useHouseholdOverview>["snapshot"]
  >["contributions"],
  unlocked: boolean
) {
  const row = (label: string, amount: number) => ({
    label,
    value: maskedValue(unlocked, amount),
  });

  return [
    row("401(k) pre-tax", contributions.pretax401k),
    row("401(k) after-tax", contributions.afterTax401k),
    row("HSA", contributions.hsa),
    row("IRA pre-tax", contributions.pretaxIra),
    row("IRA after-tax", contributions.afterTaxIra),
  ];
}

export function HouseholdOverviewSection({
  refreshToken,
  embedded = false,
  onNavigateTab,
}: {
  refreshToken?: number;
  embedded?: boolean;
  onNavigateTab?: (tab: "members") => void;
}) {
  const { isUnlocked, showUnlockDialog } = usePrivacy();
  const {
    snapshot,
    members,
    taxYear,
    priorYear,
    period,
    setPeriod,
    loading,
    error,
    lifetimeYearsIncluded,
    lifetimeWindowRange,
    includesCurrentYtd,
  } = useHouseholdOverview(refreshToken);

  if (loading && !snapshot) {
    return (
      <p className="text-sm text-muted-foreground px-2 py-4">Loading overview…</p>
    );
  }

  const unlocked = isUnlocked;
  const emptyMembers = members.filter((m) => m.isActive).length === 0;
  const showLifetimePartial =
    period === "lifetime" &&
    lifetimeYearsIncluded > 0 &&
    lifetimeYearsIncluded < 6;

  const throughToday = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const periodLabel =
    period === "current"
      ? String(taxYear)
      : period === "prior"
        ? String(priorYear)
        : lifetimeWindowRange;

  const lifetimeDetailLabel =
    period === "lifetime" ? `Through ${throughToday}` : null;

  const periodSelectLabel =
    PERIOD_OPTIONS.find((opt) => opt.id === period)?.label ?? "Period";

  const heroContent = (
    <div className={cn("grid grid-cols-2 gap-3", TAX_INSET_X, "py-3")}>
      <TaxStat
        label="Income before tax"
        value={maskedValue(unlocked, snapshot?.incomeBeforeTax ?? 0)}
      />
      <TaxStat
        label="Income after tax"
        value={maskedValue(unlocked, snapshot?.incomeAfterTax ?? 0)}
        tone="success"
      />
      {unlocked && (snapshot?.incomeBeforeTax ?? 0) > 0 && period === "current" && (
        <p className="col-span-2 text-xs text-muted-foreground">
          {formatMonthly(snapshot?.incomeBeforeTax ?? 0)} before tax
          <span className="hidden sm:inline">
            {" "}
            · {formatCompactCurrency(snapshot?.totalTax ?? 0)} estimated tax
          </span>
        </p>
      )}
      {unlocked && period === "lifetime" && (
        <p className="col-span-2 text-xs text-muted-foreground">
          {lifetimeWindowRange}
          {includesCurrentYtd ? " · current year at YTD pace" : ""}
        </p>
      )}
    </div>
  );

  const lockedHero = !unlocked ? (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 border-b border-border py-3 text-left",
        TAX_INSET_X
      )}
      onClick={showUnlockDialog}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Lock className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Unlock to view income overview</p>
        <p className="text-xs text-muted-foreground">
          Before/after tax income and contribution totals
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        Unlock
      </span>
    </button>
  ) : null;

  return (
    <div className={cn("space-y-3", embedded ? undefined : "px-2")}>
      {error && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
          {error}
        </p>
      )}

      <TaxPanel>
        <TaxPanelHeader title="Period" trailing={periodLabel} />
        <div className={cn("pb-3", TAX_INSET_X)}>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as OverviewPeriod)}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="Select period">{periodSelectLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">This year · {taxYear}</SelectItem>
              <SelectItem value="prior">Last year · {priorYear}</SelectItem>
              <SelectItem value="lifetime">To date · {lifetimeWindowRange}</SelectItem>
            </SelectContent>
          </Select>
          {lifetimeDetailLabel && (
            <p className="mt-2 text-xs text-muted-foreground">{lifetimeDetailLabel}</p>
          )}
        </div>
      </TaxPanel>

      {emptyMembers && period === "current" ? (
        <TaxPanel>
          <div className={cn("py-6 text-center text-sm text-muted-foreground", TAX_INSET_X)}>
            <p>Add members and income to see your overview.</p>
            {onNavigateTab ? (
              <button
                type="button"
                className="mt-2 text-primary font-medium hover:underline"
                onClick={() => onNavigateTab("members")}
              >
                Go to Members
              </button>
            ) : (
              <Link
                href="/household?tab=members"
                className="mt-2 inline-block text-primary font-medium hover:underline"
              >
                Go to Members
              </Link>
            )}
          </div>
        </TaxPanel>
      ) : (
        <>
          <TaxPanel>
            <TaxPanelHeader title="Income" trailing={periodLabel} />
            {lockedHero}
            {heroContent}
          </TaxPanel>

          {period === "lifetime" && (
            <p className="text-xs text-muted-foreground px-1">
              {showLifetimePartial
                ? `Totals span ${lifetimeWindowRange} from ${lifetimeYearsIncluded} saved ${
                    lifetimeYearsIncluded === 1 ? "year" : "years"
                  }${includesCurrentYtd ? " plus this year to date" : ""}; missing years show as $0.`
                : `Totals span ${lifetimeWindowRange}${
                    includesCurrentYtd ? " (current year at YTD pace)" : ""
                  }.`}
            </p>
          )}

          <TaxPanel>
            <TaxPanelHeader title="Contributions" />
            <TaxKeyValueRows
              rows={contributionRows(snapshot!.contributions, unlocked)}
            />
          </TaxPanel>

          {period === "current" && snapshot!.carryForward.length > 0 && (
            <TaxPanel>
              <TaxPanelHeader title="Carry forward" />
              <TaxKeyValueRows
                rows={snapshot!.carryForward.map((item) => ({
                  label: item.label,
                  value:
                    item.value == null
                      ? item.note ?? "—"
                      : maskedValue(unlocked, item.value),
                  highlight: item.expiresYearEnd,
                }))}
              />
            </TaxPanel>
          )}

          {period !== "current" &&
            (snapshot!.contributions.hsa > 0 ||
              snapshot!.contributions.afterTaxIra > 0) && (
              <TaxPanel>
                <TaxPanelHeader title="Carry forward" />
                <TaxKeyValueRows
                  rows={snapshot!.carryForward.map((item) => ({
                    label: item.label,
                    value:
                      item.value == null
                        ? item.note ?? "—"
                        : maskedValue(unlocked, item.value),
                  }))}
                />
              </TaxPanel>
            )}
        </>
      )}
    </div>
  );
}
