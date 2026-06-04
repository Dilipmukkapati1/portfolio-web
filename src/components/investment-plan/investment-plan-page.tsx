"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PageHeaderControls } from "./page-header-controls";
import { AllocationDonut } from "./allocation-donut";
import { PortfolioOutlook } from "./portfolio-outlook";
import { PlanExecutionOutlookSummary } from "./plan-execution-outlook";
import { InstrumentExplorer } from "./instrument-explorer";
import { HoldingsList } from "./holdings-list";
import {
  InvestmentPlanBottomNav,
  type InvestmentPlanTab,
} from "./investment-plan-bottom-nav";
import { InvestmentPlanMobileSection } from "./investment-plan-mobile-section";
import { useInvestmentPlan } from "@/hooks/use-investment-plan";
import { InvestmentPlanPageSkeleton } from "@/components/shared/page-skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCompactCurrency } from "@/lib/investment-plan/format";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn, formatPercent } from "@/lib/utils";
import type { DisplayUnit } from "@portfolio/contracts";

export function InvestmentPlanPage() {
  const state = useInvestmentPlan();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<InvestmentPlanTab>("allocation");

  const saveStatus = useMemo(() => {
    if (state.saveError) return "error" as const;
    if (state.saving) return "saving" as const;
    if (state.lastSavedAt) return "saved" as const;
    return "idle" as const;
  }, [state.lastSavedAt, state.saveError, state.saving]);

  if (state.loading && !state.plan) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <InvestmentPlanPageSkeleton />
      </motion.div>
    );
  }

  if (state.error) {
    return (
      <div className="mx-auto max-w-[1080px] space-y-4 p-3 sm:p-6">
        <PageHeaderControls netWorth={0} />
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{state.error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void state.refetch()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const summary = state.summary!;
  const instruments = state.plan?.instruments ?? [];

  const allocationContent = (
    <AllocationDonut
      classes={state.allocation}
      displayUnit={state.displayUnit}
      netWorth={summary.netWorth}
      valuesUnlocked={state.valuesUnlocked}
      plannedTotalPercent={summary.plannedTotalPercent}
      actualTotalDollars={state.actualTotalDollars}
    />
  );

  const executionOutlookSummary = (
    <PlanExecutionOutlookSummary
      executionOutlook={state.executionOutlook}
      valuesUnlocked={state.valuesUnlocked}
      compact={isMobile && mobileTab === "plan"}
    />
  );

  const allocationCard = isMobile ? (
    <InvestmentPlanMobileSection className="space-y-3">
      {executionOutlookSummary}
      <div>
        <p className="mb-3 font-semibold leading-none">Allocation by asset class</p>
        {allocationContent}
      </div>
    </InvestmentPlanMobileSection>
  ) : (
    <Card>
      <CardHeader className="pb-2">
        <p className="font-semibold leading-none">Allocation by asset class</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <PlanExecutionOutlookSummary
          executionOutlook={state.executionOutlook}
          valuesUnlocked={state.valuesUnlocked}
        />
        {allocationContent}
      </CardContent>
    </Card>
  );

  const portfolioOutlookProps = {
    portfolioProjection: state.portfolioProjection,
    plannedTotalDollars: summary.plannedTotalDollars,
    plannedTotalPercent: summary.plannedTotalPercent,
    instrumentCount: summary.instrumentCount,
    unallocatedDollars: summary.unallocatedDollars,
    unallocatedPercent: summary.unallocatedPercent,
    projectionRate: state.projectionRate,
    onProjectionRateChange: state.setProjectionRate,
    reinvestDividends: state.reinvestDividends,
    onReinvestDividendsChange: state.setReinvestDividends,
  } as const;

  const portfolioOutlookCard = isMobile ? (
    <InvestmentPlanMobileSection>
      <PortfolioOutlook {...portfolioOutlookProps} embedded />
    </InvestmentPlanMobileSection>
  ) : (
    <PortfolioOutlook {...portfolioOutlookProps} />
  );

  const planByInstrumentBody = (
    <>
      <InstrumentExplorer
        explorerName={state.explorerName}
        onExplorerNameChange={state.setExplorerName}
        explorerAllocPct={state.explorerAllocPct}
        onExplorerAllocPctChange={state.setExplorerAllocPct}
        onAddOrUpdate={state.addOrUpdateFromExplorer}
        onClear={state.clearExplorer}
        profile={state.profile}
        explorerProjection={state.explorerProjection}
        projectionRate={state.projectionRate}
        onProjectionRateChange={state.setProjectionRate}
        reinvestDividends={state.reinvestDividends}
        onReinvestDividendsChange={state.setReinvestDividends}
        inferredAssetClass={state.inferredAssetClass}
        netWorth={summary.netWorth}
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <p className="text-sm font-semibold">Holdings</p>
          <p className="text-sm text-muted-foreground">
            {instruments.length} · {formatCompactCurrency(summary.plannedTotalDollars)}
          </p>
          <p className="w-full text-xs text-muted-foreground sm:w-auto sm:text-right">
            Projected values · {state.projectionRate === "life" ? "life" : state.projectionRate}
            {state.reinvestDividends ? " · DRIP" : ""} · scroll for more
          </p>
        </div>
        <HoldingsList
          instruments={instruments}
          allocation={state.allocation}
          netWorth={summary.netWorth}
          displayUnit={state.displayUnit}
          valuesUnlocked={state.valuesUnlocked}
          selectedInstrumentId={state.selectedInstrumentId}
          onSelect={state.selectInstrument}
          onRemove={state.removeInstrument}
          saving={state.saving}
          profileForInstrument={state.profileForInstrument}
          projectionRate={state.projectionRate}
          reinvestDividends={state.reinvestDividends}
        />
      </div>
    </>
  );

  const planByInstrumentCard = isMobile ? (
    <InvestmentPlanMobileSection className="space-y-4">
      {executionOutlookSummary}
      {planByInstrumentBody}
    </InvestmentPlanMobileSection>
  ) : (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="font-semibold leading-none">Plan by instrument</p>
        <p className="text-sm text-muted-foreground">
          {instruments.length} instruments
        </p>
      </CardHeader>
      <CardContent className="space-y-[18px]">
        <PlanExecutionOutlookSummary
          executionOutlook={state.executionOutlook}
          valuesUnlocked={state.valuesUnlocked}
        />
        {planByInstrumentBody}
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mx-auto w-full max-w-[1080px] space-y-4 sm:space-y-6",
        isMobile ? "p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))]" : "p-6"
      )}
    >
      <PageHeaderControls
        netWorth={summary.netWorth}
        saveStatus={saveStatus}
        refreshing={state.refreshing}
      />

      {summary.overAllocated && (
        <OverAllocationCallout
          displayUnit={state.displayUnit}
          plannedTotalPercent={summary.plannedTotalPercent}
          plannedTotalDollars={summary.plannedTotalDollars}
        />
      )}

      {isMobile ? (
        <>
          <div role="tabpanel" aria-label={mobileTab}>
            {mobileTab === "allocation" && allocationCard}
            {mobileTab === "plan" && planByInstrumentCard}
            {mobileTab === "outlook" && portfolioOutlookCard}
          </div>
          <InvestmentPlanBottomNav active={mobileTab} onChange={setMobileTab} />
        </>
      ) : (
        <div className="grid grid-cols-2 items-start gap-6">
          <div className="flex min-w-0 flex-col gap-6">
            {allocationCard}
            {portfolioOutlookCard}
          </div>
          <div className="min-w-0">{planByInstrumentCard}</div>
        </div>
      )}
    </motion.div>
  );
}

function OverAllocationCallout({
  displayUnit,
  plannedTotalPercent,
  plannedTotalDollars,
}: {
  displayUnit: DisplayUnit;
  plannedTotalPercent: number;
  plannedTotalDollars: number;
}) {
  const totalLabel =
    displayUnit === "percent"
      ? formatPercent(plannedTotalPercent)
      : formatCompactCurrency(plannedTotalDollars);

  return (
    <div
      className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3"
      role="alert"
    >
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Plan exceeds 100% of net worth
      </p>
      <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
        Target allocations sum to {totalLabel}. Adjust instrument targets, or flip the
        header toggle to $ to review dollar amounts.
      </p>
    </div>
  );
}
