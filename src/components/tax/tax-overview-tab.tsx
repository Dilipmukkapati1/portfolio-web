"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { formatContributionRoom, formatTaxRate, formatTaxShare } from "@/lib/tax/display";
import { formatPercent, cn } from "@/lib/utils";
import {
  CONTRIBUTION_TYPE_LABELS,
  type ContributionType,
  type Member,
  type TaxProfile,
} from "@/lib/household-types";
import type { TaxOutlook } from "@/lib/tax/outlook";
import {
  TaxDeferredHistogram,
  TaxLifetimeLineChart,
  TaxPaidStackedChart,
} from "./tax-charts";
import {
  TaxPaidBreakdownDesktop,
  TaxPaidBreakdownMobile,
  TaxDeferredTable,
} from "./tax-breakdown";
import {
  TaxEarnerPills,
  TaxSegmentedControl,
  TaxViewPills,
  type TaxViewMode,
} from "./tax-view-controls";
import { TaxKeyValueRows, TaxPanel, TaxPanelHeader, TaxStat, TAX_INSET_X } from "./tax-primitives";

export function TaxContributionRoom({
  taxProfile,
  members,
  valuesUnlocked,
  compact,
}: {
  taxProfile: TaxProfile;
  members: Member[];
  valuesUnlocked: boolean;
  compact?: boolean;
}) {
  const limits = taxProfile.contributionLimits ?? [];
  if (!limits.length) return null;

  const memberName = (id?: string) =>
    members.find((m) => m.id === id)?.name.split(/\s+/)[0] ?? "Member";

  const rows = limits.map((lim) => {
    const typeLabel =
      CONTRIBUTION_TYPE_LABELS[lim.type as ContributionType] ?? lim.type;
    const householdLabel =
      lim.scope === "household" ? `${typeLabel} (household)` : typeLabel;
    const label = `${householdLabel}${
      lim.memberId && lim.scope !== "household"
        ? ` ${memberName(lim.memberId)}`
        : ""
    }`;
    const value = formatContributionRoom(lim, valuesUnlocked);
    return { label, value };
  });

  if (compact) {
    return (
      <TaxPanel>
        <TaxPanelHeader title="Contribution room" />
        <TaxKeyValueRows rows={rows} />
      </TaxPanel>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="font-semibold leading-none">Contribution room</p>
      </CardHeader>
      <CardContent className="p-0">
        <TaxKeyValueRows rows={rows} />
      </CardContent>
    </Card>
  );
}

export function TaxOverviewSection({
  outlook,
  taxProfile,
  members,
  earnerOptions,
  earnerScope,
  onEarnerChange,
  taxView,
  onTaxViewChange,
  valuesUnlocked,
  isMobile,
}: {
  outlook: TaxOutlook;
  taxProfile: TaxProfile;
  members: Member[];
  earnerOptions: Array<{ id: string; label: string }>;
  earnerScope: string;
  onEarnerChange: (id: string) => void;
  taxView: TaxViewMode;
  onTaxViewChange: (view: TaxViewMode) => void;
  valuesUnlocked: boolean;
  isMobile: boolean;
}) {
  const marginalPct = formatTaxRate(outlook.marginalRate, 0);
  const actualTaxPct = formatTaxRate(outlook.actualTaxRate, 1);

  const bracketStats = (
    <div className="grid grid-cols-2 gap-3">
      <TaxStat label="Top bracket" value={marginalPct} tone="info" />
      <TaxStat label="Tax on income" value={actualTaxPct} />
    </div>
  );

  const outlookBar = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Overall tax outlook</p>
        <span className="text-sm font-semibold text-emerald-400">
          {outlook.onTrackPercent}% on track
        </span>
      </div>
      {!isMobile && (
        <p className="text-xs text-muted-foreground">
          {outlook.onTrackPercent}% on track · {outlook.openActions} actions open
        </p>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${Math.min(100, outlook.onTrackPercent)}%` }}
        />
      </div>
    </div>
  );

  const paidStats = (
    <div className="grid grid-cols-2 gap-3">
      <TaxStat
        label="Paid YTD"
        value={formatTaxShare(
          outlook.paidYtd,
          outlook.paidAnnual,
          valuesUnlocked,
          1,
          outlook.yearProgress
        )}
      />
      <TaxStat
        label="Rest of year"
        value={formatTaxShare(
          outlook.paidRestOfYear,
          outlook.paidAnnual,
          valuesUnlocked,
          1,
          Math.max(0, 1 - outlook.yearProgress)
        )}
      />
      {!isMobile && (
        <TaxStat
          label="Lifetime (fwd)"
          value={
            valuesUnlocked
              ? formatCompactCurrency(outlook.paidLifetimeForward)
              : formatTaxShare(outlook.paidLifetimeForward, outlook.paidAnnual * 25, false)
          }
        />
      )}
    </div>
  );

  const deferredStats = (
    <div className="grid grid-cols-2 gap-3">
      <TaxStat
        label="Deferred YTD"
        value={formatTaxShare(outlook.deferredYtd, outlook.paidAnnual, valuesUnlocked)}
        tone="info"
      />
      <TaxStat
        label="Till now"
        value={formatTaxShare(outlook.deferredCumulative, outlook.paidAnnual, valuesUnlocked)}
      />
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        <TaxPanel>
          <div className={cn(TAX_INSET_X, "py-2.5")}>{outlookBar}</div>
        </TaxPanel>

        <TaxPanel>
          <div className={cn(TAX_INSET_X, "py-2.5")}>{bracketStats}</div>
        </TaxPanel>

        <TaxPanel>
          <div className={cn("space-y-3 pt-3", TAX_INSET_X)}>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Viewing</p>
              <Select value={earnerScope} onValueChange={onEarnerChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {earnerOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TaxSegmentedControl
              options={[
                { id: "paid" as const, label: "Taxes paid" },
                { id: "deferred" as const, label: "Tax deferred" },
              ]}
              value={taxView}
              onChange={onTaxViewChange}
            />
          </div>

          <div className={cn(TAX_INSET_X, "py-2.5")}>
            {taxView === "paid" ? paidStats : deferredStats}
          </div>

          {taxView === "deferred" && (
            <p className={cn(TAX_INSET_X, "pb-2 text-xs text-muted-foreground")}>
              Est. at {marginalPct} marginal from pre-tax contributions
            </p>
          )}

          <div className="border-t border-border">
            {taxView === "paid" ? (
              <TaxPaidBreakdownMobile
                rows={outlook.paidBreakdown}
                lifetimeForward={outlook.paidLifetimeForward}
                valuesUnlocked={valuesUnlocked}
                paidAnnual={outlook.paidAnnual}
              />
            ) : (
              <div className={cn(TAX_INSET_X, "py-3")}>
                <TaxDeferredHistogram
                  data={outlook.deferredByYear}
                  valuesUnlocked={valuesUnlocked}
                  compact
                />
              </div>
            )}
          </div>
        </TaxPanel>

        <TaxContributionRoom
          taxProfile={taxProfile}
          members={members}
          valuesUnlocked={valuesUnlocked}
          compact
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-none bg-muted/20 shadow-none">
        <CardContent className="space-y-4 p-4">
          {outlookBar}
          {bracketStats}
        </CardContent>
      </Card>

      <TaxViewPills value={taxView} onChange={onTaxViewChange} />
      <TaxEarnerPills
        options={earnerOptions}
        value={earnerScope}
        onChange={onEarnerChange}
      />

      {taxView === "paid" ? (
        <div className="space-y-4">
          {paidStats}
          <TaxPaidBreakdownDesktop
            rows={outlook.paidBreakdown}
            valuesUnlocked={valuesUnlocked}
            paidAnnual={outlook.paidAnnual}
          />
          <TaxPaidStackedChart
            breakdown={outlook.paidBreakdown}
            valuesUnlocked={valuesUnlocked}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {deferredStats}
          <p className="text-sm text-muted-foreground">
            Est. federal tax deferred from pre-tax 401(k), IRA, and HSA at {marginalPct}{" "}
            marginal.
          </p>
          <TaxDeferredHistogram
            data={outlook.deferredByYear}
            valuesUnlocked={valuesUnlocked}
          />
          <TaxDeferredTable
            rows={outlook.deferredByYear}
            valuesUnlocked={valuesUnlocked}
            paidAnnual={outlook.paidAnnual}
          />
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <p className="font-semibold leading-none">Lifetime outlook</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <TaxLifetimeLineChart
            annualTotal={outlook.paidAnnual}
            valuesUnlocked={valuesUnlocked}
          />
          <div className="grid grid-cols-3 gap-3">
            <TaxStat
              label="10 yr"
              value={
                valuesUnlocked
                  ? formatCompactCurrency(outlook.paidAnnual * 10)
                  : formatTaxShare(outlook.paidAnnual * 10, outlook.paidAnnual * 25, false)
              }
            />
            <TaxStat
              label="20 yr"
              value={
                valuesUnlocked
                  ? formatCompactCurrency(outlook.paidAnnual * 20)
                  : formatTaxShare(outlook.paidAnnual * 20, outlook.paidAnnual * 25, false)
              }
            />
            <TaxStat
              label="Life"
              value={
                valuesUnlocked
                  ? formatCompactCurrency(outlook.paidLifetimeForward)
                  : formatTaxShare(outlook.paidLifetimeForward, outlook.paidAnnual * 25, false)
              }
              tone="success"
            />
          </div>
        </CardContent>
      </Card>

      <TaxContributionRoom
        taxProfile={taxProfile}
        members={members}
        valuesUnlocked={valuesUnlocked}
      />
    </div>
  );
}
