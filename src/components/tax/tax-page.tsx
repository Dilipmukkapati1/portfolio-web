"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TaxDisclaimer } from "@/components/TaxDisclaimer";
import { TaxPageSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useQueryTab } from "@/hooks/use-query-tab";
import { useTax } from "@/hooks/use-tax";
import { usePrivacy } from "@/components/PrivacyProvider";
import {
  computeTaxOutlook,
  earnerOptions,
  membersMissingDateOfBirth,
} from "@/lib/tax/outlook";
import { parseTaxTab } from "@/lib/url-state";
import { TaxBottomNav } from "./tax-bottom-nav";
import { TaxHeader } from "./tax-header";
import { TaxOverviewSection } from "./tax-overview-tab";
import { TaxPlanSection } from "./tax-plan-tab";
import { TaxAdvisorSection } from "./tax-advisor-tab";
import { TaxSectionTabs, type TaxTab } from "./tax-section-tabs";
import type { TaxViewMode } from "./tax-view-controls";
import { cn } from "@/lib/utils";

function TaxPageContent() {
  const state = useTax();
  const { showUnlockDialog } = usePrivacy();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useQueryTab<TaxTab>({
    pathname: "/tax",
    parse: parseTaxTab,
    defaultTab: "overview",
  });
  const [taxView, setTaxView] = useState<TaxViewMode>("paid");
  const [earnerScope, setEarnerScope] = useState<string>("household");

  const earners = useMemo(
    () => earnerOptions(state.members),
    [state.members]
  );

  const outlook = useMemo(
    () =>
      computeTaxOutlook({
        taxProfile: state.taxProfile,
        members: state.members,
        earnerScope,
        taxYear: state.taxYear,
        strategies: state.strategies,
      }),
    [state.taxProfile, state.members, earnerScope, state.taxYear, state.strategies]
  );

  const setupGaps = useMemo(
    () => membersMissingDateOfBirth(state.members),
    [state.members]
  );

  async function handleRecalculate() {
    if (!state.isUnlocked) {
      showUnlockDialog();
      return;
    }
    await state.recompute();
  }

  if (state.householdLoading || (state.household && state.loading)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          isMobile
            ? "mx-auto flex w-full min-w-0 max-w-[1080px] flex-col overflow-hidden px-0 pt-1 min-h-[calc(100dvh-4rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
            : "mx-auto w-full min-w-0 max-w-[1080px] space-y-6 px-2 py-4"
        )}
      >
        <TaxPageSkeleton />
      </motion.div>
    );
  }

  if (!state.household) {
    return (
      <div className="mx-auto max-w-[1080px] space-y-4 px-0 py-2 sm:px-2 sm:py-4">
        <h1 className="text-2xl font-semibold">Tax</h1>
        <p className="text-sm text-muted-foreground">
          Set up a household with members and income on the{" "}
          <Link href="/household" className="text-primary underline">
            Household
          </Link>{" "}
          page first.
        </p>
      </div>
    );
  }

  const emptyState = !state.taxProfile?.lastEstimate;

  const overview =
    outlook && state.taxProfile ? (
      <TaxOverviewSection
        outlook={outlook}
        taxProfile={state.taxProfile}
        members={state.members}
        earnerOptions={earners}
        earnerScope={earnerScope}
        onEarnerChange={setEarnerScope}
        taxView={taxView}
        onTaxViewChange={setTaxView}
        valuesUnlocked={state.isUnlocked}
        isMobile={isMobile}
      />
    ) : (
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            Add members with income on the Household page, then recalculate to see
            your tax outlook.
          </p>
          <Button type="button" onClick={() => void handleRecalculate()}>
            {state.isUnlocked ? "Recalculate from members" : "Unlock to recalculate"}
          </Button>
        </CardContent>
      </Card>
    );

  const plan =
    outlook && state.taxProfile ? (
      <TaxPlanSection
        outlook={outlook}
        taxProfile={state.taxProfile}
        members={state.members}
        strategies={state.strategies}
        valuesUnlocked={state.isUnlocked}
        isMobile={isMobile}
      />
    ) : (
      <p className="text-sm text-muted-foreground">
        Recalculate to populate recommendations and checklist items.
      </p>
    );

  const advisor = (
    <TaxAdvisorSection
      outlook={outlook}
      taxProfile={state.taxProfile}
      strategies={state.strategies}
      taxYear={state.taxYear}
      taxView={taxView}
      earnerScope={earnerScope}
      isMobile={isMobile}
    />
  );

  const isAdvisorTab = activeTab === "advisor";

  const tabPanel = (
    <>
      {activeTab === "overview" && overview}
      {activeTab === "plan" && (plan ?? overview)}
      {activeTab === "advisor" && (
        <div className="flex min-h-0 flex-1 flex-col">{advisor}</div>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        isMobile
          ? cn(
              "mx-auto flex max-w-[1080px] flex-col overflow-hidden px-0 pt-1",
              isAdvisorTab
                ? "h-[calc(100dvh-3.5rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
                : "min-h-[calc(100dvh-4rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
            )
          : cn(
              "mx-auto max-w-[1080px]",
              isAdvisorTab
                ? "flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden px-2 py-4"
                : "space-y-6 px-2 py-4"
            )
      )}
    >
      <div className="shrink-0">
        <TaxHeader
          taxYear={state.taxYear}
          outlook={outlook}
          valuesUnlocked={state.isUnlocked}
          estimating={state.estimating}
          isMobile={isMobile}
          onRecalculate={() => void handleRecalculate()}
        />
      </div>

      {!isMobile && (
        <div className="shrink-0">
          <TaxSectionTabs active={activeTab} onChange={setActiveTab} />
        </div>
      )}

      {state.error && !isAdvisorTab && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      {!isMobile && setupGaps.length > 0 && activeTab !== "advisor" && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Add date of birth for {setupGaps.map((m) => m.name).join(", ")} on the{" "}
          <Link href="/household" className="underline">
            Household
          </Link>{" "}
          page for lifetime Medicare and IRMAA estimates.
        </div>
      )}

      {isMobile ? (
        <>
          <main
            className={cn(
              "min-h-0 flex-1",
              isAdvisorTab ? "flex flex-col overflow-hidden" : "overflow-y-auto"
            )}
            role="tabpanel"
            aria-label={activeTab}
          >
            {tabPanel}
          </main>
          <TaxBottomNav active={activeTab} onChange={setActiveTab} />
        </>
      ) : (
        <div
          className={cn(
            "min-h-0",
            isAdvisorTab ? "flex flex-1 flex-col overflow-hidden" : undefined
          )}
          role="tabpanel"
          aria-label={activeTab}
        >
          {activeTab === "overview" && !emptyState ? (
            <Card>
              <CardHeader>
                <p className="font-semibold leading-none">Tax overview</p>
              </CardHeader>
              <CardContent>{overview}</CardContent>
            </Card>
          ) : activeTab === "plan" ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <p className="font-semibold leading-none">Tax plan</p>
                {outlook && (
                  <span className="text-xs text-muted-foreground">
                    {outlook.openActions} open
                  </span>
                )}
              </CardHeader>
              <CardContent>{plan}</CardContent>
            </Card>
          ) : (
            tabPanel
          )}
        </div>
      )}

      {activeTab !== "advisor" && <TaxDisclaimer />}
    </motion.div>
  );
}

function TaxPageSkeletonFallback() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full min-w-0 max-w-[1080px] flex-col overflow-hidden px-0 pt-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] max-sm:min-h-[calc(100dvh-4rem)] sm:space-y-6 sm:px-2 sm:py-4 sm:pb-4"
    >
      <TaxPageSkeleton />
    </motion.div>
  );
}

export function TaxPage() {
  return (
    <Suspense fallback={<TaxPageSkeletonFallback />}>
      <TaxPageContent />
    </Suspense>
  );
}
