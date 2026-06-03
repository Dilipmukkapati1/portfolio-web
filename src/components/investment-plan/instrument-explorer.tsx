"use client";

import { Plus, X } from "lucide-react";
import type {
  AssetClass,
  FundProfile,
  ProjectionResponse,
  ReturnPeriod,
} from "@portfolio/contracts";
import {
  assetClassLabel,
  compoundRateForProjection,
  compoundRateBreakdown,
  formatReturnPct,
} from "@portfolio/contracts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InstrumentTypeahead } from "./instrument-typeahead";
import { ProjectionToolbar } from "./projection-toolbar";
import { ProjectionLineChart } from "./projection-line-chart";
import { MetricChips } from "./metric-chips";
import { HorizonTiles } from "./horizon-tiles";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn, formatPercent } from "@/lib/utils";
import { ASSET_CLASS_COLORS } from "@/lib/investment-plan/colors";

const PROJECTION_MAX_YEARS = 50;

function formatExpenseRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

function feeDisplay(profile: FundProfile): { label: string; value: string } {
  switch (profile.feeKind) {
    case "none":
      return { label: "Fees", value: "None" };
    case "commission":
      return { label: "Trading fee", value: "$0 commission" };
    default:
      return {
        label: "Expense ratio",
        value: formatExpenseRatio(profile.expenseRatio),
      };
  }
}

export function InstrumentExplorer({
  explorerName,
  onExplorerNameChange,
  explorerAllocPct,
  onExplorerAllocPctChange,
  onAddOrUpdate,
  onClear,
  profile,
  explorerProjection,
  projectionRate,
  onProjectionRateChange,
  reinvestDividends,
  onReinvestDividendsChange,
  inferredAssetClass,
  netWorth,
}: {
  explorerName: string;
  onExplorerNameChange: (v: string) => void;
  explorerAllocPct: string;
  onExplorerAllocPctChange: (v: string) => void;
  onAddOrUpdate: () => void;
  onClear: () => void;
  profile: FundProfile | null;
  explorerProjection: ProjectionResponse | null;
  projectionRate: ReturnPeriod;
  onProjectionRateChange: (p: ReturnPeriod) => void;
  reinvestDividends: boolean;
  onReinvestDividendsChange: (v: boolean) => void;
  inferredAssetClass: AssetClass;
  netWorth: number;
}) {
  const isMobile = useIsMobile();
  const allocPct = Number.parseFloat(explorerAllocPct);
  const allocationPrincipal =
    Number.isFinite(allocPct) && allocPct > 0 ? (allocPct / 100) * netWorth : 0;

  const explorerProfile = profile;
  const fee = explorerProfile ? feeDisplay(explorerProfile) : null;
  const estAnnualFee =
    explorerProfile &&
    explorerProfile.feeKind === "expense_ratio" &&
    allocationPrincipal > 0
      ? allocationPrincipal * explorerProfile.expenseRatio
      : 0;

  const compoundRate =
    explorerProfile &&
    compoundRateForProjection(explorerProfile, projectionRate, reinvestDividends);

  const header = (
    <div className="flex flex-row items-center justify-between space-y-0 pb-3">
      <p className="font-semibold leading-none">Explore</p>
      {explorerProfile && (
        <Badge variant="secondary" className="font-normal">
          {explorerProfile.ticker}
        </Badge>
      )}
    </div>
  );

  const content = (
    <div className="space-y-3">
        <div
          className={cn(
            "grid w-full min-w-0 items-end gap-2",
            isMobile
              ? "grid-cols-[minmax(0,1fr)_72px_auto_auto]"
              : "grid-cols-[minmax(0,1fr)_96px_auto_auto]"
          )}
        >
          <InstrumentTypeahead
            value={explorerName}
            onChange={onExplorerNameChange}
            onSelect={(opt) => onExplorerNameChange(opt.name)}
          />
          <Input
            inputMode="decimal"
            placeholder="% NW"
            value={explorerAllocPct}
            onChange={(e) => onExplorerAllocPctChange(e.target.value)}
            className="min-w-[72px]"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0"
            title="Clear form"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="min-h-11 min-w-11 shrink-0 rounded-full"
            title="Add to plan"
            onClick={onAddOrUpdate}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {explorerProfile && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: ASSET_CLASS_COLORS[inferredAssetClass] }}
            />
            <Badge variant="secondary">{assetClassLabel(inferredAssetClass)}</Badge>
            <span className="text-muted-foreground">
              {explorerProfile.ticker}
              {Number.isFinite(allocPct) && allocPct > 0
                ? ` · ${formatPercent(allocPct)} · ${formatCompactCurrency(allocationPrincipal)}`
                : ""}
            </span>
          </div>
        )}

        {explorerProfile && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Fund profile</p>
            {isMobile ? (
              <>
                <MetricChips
                  chips={[
                    { key: "1y", label: "1Y", value: formatReturnPct(explorerProfile.return1y) },
                    { key: "3y", label: "3Y", value: formatReturnPct(explorerProfile.return3y) },
                    { key: "5y", label: "5Y", value: formatReturnPct(explorerProfile.return5y) },
                    {
                      key: "life",
                      label: "Life",
                      value: formatReturnPct(explorerProfile.annualizedReturn),
                      tone: "info",
                    },
                  ]}
                />
                <p className="overflow-x-auto whitespace-nowrap text-xs text-muted-foreground">
                  {explorerProfile.dividendYield > 0
                    ? `Div ${formatReturnPct(explorerProfile.dividendYield)}`
                    : "No div"}
                  {" · Proj "}
                  {compoundRateBreakdown(explorerProfile, projectionRate, reinvestDividends)}
                  {reinvestDividends && explorerProfile.dividendYield > 0 ? " DRIP" : ""}
                  {" · "}
                  {explorerProfile.yearsSinceInception} yr since{" "}
                  {explorerProfile.inceptionLabel}
                </p>
                {explorerProfile.feeKind === "expense_ratio" ? (
                  <p className="overflow-x-auto whitespace-nowrap text-xs text-muted-foreground">
                    <span className="font-semibold">ER</span> {fee?.value}
                    {allocationPrincipal > 0 ? (
                      <>
                        {" · "}
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          ~{formatCompactCurrency(estAnnualFee)}/yr
                        </span>
                      </>
                    ) : (
                      " · enter % NW for est. cost"
                    )}
                  </p>
                ) : explorerProfile.feeKind === "commission" ? (
                  <p className="text-xs text-muted-foreground">$0 commission/trade · no ER</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{fee?.value}</p>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["1Y", explorerProfile.return1y],
                      ["3Y", explorerProfile.return3y],
                      ["5Y", explorerProfile.return5y],
                      ["Life", explorerProfile.annualizedReturn],
                    ] as const
                  ).map(([label, rate]) => (
                    <div key={label} className="rounded-md border px-2 py-1.5">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          label === "Life" && "text-primary"
                        )}
                      >
                        {formatReturnPct(rate)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {explorerProfile.dividendYield > 0
                      ? `Div ${formatReturnPct(explorerProfile.dividendYield)}`
                      : "No div"}
                    {" · Proj "}
                    {compoundRateBreakdown(explorerProfile, projectionRate, reinvestDividends)}
                    {reinvestDividends && explorerProfile.dividendYield > 0 ? " DRIP" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {explorerProfile.yearsSinceInception} yr since{" "}
                    {explorerProfile.inceptionLabel}
                  </p>
                  {explorerProfile.feeKind === "expense_ratio" ? (
                    <div className="space-y-1">
                      <div>
                        <p className="text-xs text-muted-foreground">Expense ratio</p>
                        <p className="font-medium">{fee?.value}</p>
                      </div>
                      {allocationPrincipal > 0 ? (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground">Est. annual cost</p>
                            <p className="font-medium text-amber-600 dark:text-amber-400">
                              {formatCompactCurrency(estAnnualFee)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatExpenseRatio(explorerProfile.expenseRatio)} ×{" "}
                            {formatCompactCurrency(allocationPrincipal)}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Enter % NW for est. cost
                        </p>
                      )}
                    </div>
                  ) : explorerProfile.feeKind === "commission" ? (
                    <div>
                      <p className="text-xs text-muted-foreground">Trading fee</p>
                      <p className="font-medium">$0 commission</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-muted-foreground">Fees</p>
                      <p className="font-medium">{fee?.value}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <ProjectionToolbar
          projectionRate={projectionRate}
          onProjectionRateChange={onProjectionRateChange}
          reinvestDividends={reinvestDividends}
          onReinvestDividendsChange={onReinvestDividendsChange}
        />

        {explorerProjection && allocationPrincipal > 0 && (
          <div className="space-y-3">
            <ProjectionLineChart
              categories={explorerProjection.categories}
              values={explorerProjection.values}
              variant="info"
              height={isMobile ? 240 : 220}
            />
            <p className="text-xs text-muted-foreground">
              Future value ($) at {explorerAllocPct}% of net worth (
              {formatCompactCurrency(allocationPrincipal)}) · 0–{PROJECTION_MAX_YEARS} yr outlook ·{" "}
              {projectionRate === "life" ? "life of fund" : `${projectionRate} annualized`} ·{" "}
              {formatReturnPct(compoundRate ?? 0)} compound
              {reinvestDividends && explorerProfile && explorerProfile.dividendYield > 0
                ? " (DRIP)"
                : ""}
            </p>
            <HorizonTiles milestones={explorerProjection.milestones} variant="explorer" />
          </div>
        )}
    </div>
  );

  if (isMobile) {
    return (
      <div>
        {header}
        {content}
      </div>
    );
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <p className="font-semibold leading-none">Explore</p>
        {explorerProfile && (
          <Badge variant="secondary" className="font-normal">
            {explorerProfile.ticker}
          </Badge>
        )}
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
