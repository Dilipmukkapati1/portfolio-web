"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ExpensePlannerPageSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useExpensePlanner } from "@/hooks/use-expense-planner";
import {
  ExpensePlannerBottomNav,
  type ExpensePlannerTab,
} from "./expense-planner-bottom-nav";
import { ExpensePlannerHeader } from "./expense-planner-header";
import { MappingsTab } from "./mappings-tab";
import { OutlookTab } from "./outlook-tab";
import { OverviewTab } from "./overview-tab";
import { PlanTab } from "./plan-tab";

export function ExpensePlannerPage() {
  const state = useExpensePlanner();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<ExpensePlannerTab>("overview");

  if (state.loading && !state.plan) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <ExpensePlannerPageSkeleton />
      </motion.div>
    );
  }

  if (state.error) {
    return (
      <div className="mx-auto max-w-[1080px] space-y-4 p-3 sm:p-6">
        <ExpensePlannerHeader />
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

  const overview = <OverviewTab state={state} />;
  const plan = <PlanTab state={state} />;
  const outlook = <OutlookTab state={state} />;
  const mappings = <MappingsTab state={state} />;

  return (
    <div
      className={
        isMobile
          ? "mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1080px] flex-col px-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-3"
          : "mx-auto max-w-[1080px] space-y-6 p-6"
      }
    >
      <ExpensePlannerHeader />

      {state.refreshing && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Updating…
        </p>
      )}

      {isMobile ? (
        <>
          <main className="flex-1 min-h-0" role="tabpanel" aria-label={mobileTab}>
            {mobileTab === "overview" && overview}
            {mobileTab === "plan" && plan}
            {mobileTab === "outlook" && outlook}
            {mobileTab === "mappings" && mappings}
          </main>
          <ExpensePlannerBottomNav active={mobileTab} onChange={setMobileTab} />
        </>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Overview</h2>
            {overview}
          </section>
          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Plan</h2>
              {plan}
            </div>
            <div className="space-y-4 border-t border-border pt-6">
              <h2 className="text-lg font-semibold">Outlook</h2>
              {outlook}
            </div>
            <div className="space-y-4 border-t border-border pt-6">
              <h2 className="text-lg font-semibold">Mappings</h2>
              {mappings}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
