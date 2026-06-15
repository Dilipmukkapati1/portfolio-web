"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TaxDisclaimer } from "@/components/TaxDisclaimer";
import { TaxPageSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useTax } from "@/hooks/use-tax";
import { usePrivacy } from "@/components/PrivacyProvider";
import {
  computeTaxOutlook,
  earnerOptions,
  membersMissingDateOfBirth,
} from "@/lib/tax/outlook";
import { TaxBottomNav, type TaxTab } from "./tax-bottom-nav";
import { TaxHeader } from "./tax-header";
import { TaxOverviewSection } from "./tax-overview-tab";
import { TaxPlanSection } from "./tax-plan-tab";
import type { TaxViewMode } from "./tax-view-controls";

export function TaxPage() {
  const state = useTax();
  const { showUnlockDialog } = usePrivacy();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<TaxTab>("overview");
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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <TaxPageSkeleton />
      </motion.div>
    );
  }

  if (!state.household) {
    return (
      <div className="mx-auto max-w-[1080px] space-y-4 p-3 sm:p-6">
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
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        isMobile
          ? "mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1080px] flex-col px-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-3"
          : "mx-auto max-w-[1080px] space-y-6 p-6"
      }
    >
      <TaxHeader
        taxYear={state.taxYear}
        outlook={outlook}
        valuesUnlocked={state.isUnlocked}
        estimating={state.estimating}
        isMobile={isMobile}
        onRecalculate={() => void handleRecalculate()}
      />

      {state.error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      {!isMobile && setupGaps.length > 0 && (
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
          <main className="min-h-0 flex-1" role="tabpanel" aria-label={mobileTab}>
            {mobileTab === "overview" ? overview : plan ?? overview}
          </main>
          <TaxBottomNav active={mobileTab} onChange={setMobileTab} />
        </>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <p className="font-semibold leading-none">Tax overview</p>
            </CardHeader>
            <CardContent>{emptyState ? overview : overview}</CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <p className="font-semibold leading-none">Tax plan</p>
              {outlook && (
                <span className="text-xs text-muted-foreground">
                  {outlook.openActions} open
                </span>
              )}
            </CardHeader>
            <CardContent>
              {plan ?? (
                <p className="text-sm text-muted-foreground">
                  Recalculate to populate recommendations and checklist items.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <TaxDisclaimer />
    </motion.div>
  );
}
