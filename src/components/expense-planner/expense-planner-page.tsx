"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ExpensePlannerPageSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useQueryTab } from "@/hooks/use-query-tab";
import { useExpensePlanner } from "@/hooks/use-expense-planner";
import { parseExpensePlannerTab } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { ExpenseChatPanel } from "./expense-chat-panel";
import {
  ExpensePlannerBottomNav,
  type ExpensePlannerTab,
} from "./expense-planner-bottom-nav";
import { ExpensePlannerHeader } from "./expense-planner-header";
import { MappingsTab } from "./mappings-tab";
import { OutlookTab } from "./outlook-tab";
import { OverviewTab } from "./overview-tab";
import { PlanTab } from "./plan-tab";

function ExpensePlannerPageContent() {
  const state = useExpensePlanner();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useQueryTab<ExpensePlannerTab>({
    pathname: "/expense-planner",
    parse: parseExpensePlannerTab,
    defaultTab: "overview",
  });

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
  const chat = (
    <ExpenseChatPanel embedded={isMobile} flush={isMobile && activeTab === "chat"} />
  );

  return (
    <div
      className={
        isMobile
          ? activeTab === "chat"
            ? "mx-auto flex h-[calc(100dvh-4rem)] max-w-[1080px] flex-col overflow-hidden px-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-3"
            : "mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1080px] flex-col px-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-3"
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
          <main
            className={cn(
              "min-h-0 flex-1",
              activeTab === "chat" ? "flex flex-col overflow-hidden px-2" : undefined
            )}
            role="tabpanel"
            aria-label={activeTab}
          >
            {activeTab === "overview" && overview}
            {activeTab === "plan" && plan}
            {activeTab === "outlook" && outlook}
            {activeTab === "mappings" && mappings}
            {activeTab === "chat" && chat}
          </main>
          <ExpensePlannerBottomNav active={activeTab} onChange={setActiveTab} />
        </>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ExpensePlannerTab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="outlook">Outlook</TabsTrigger>
            <TabsTrigger value="mappings">Mappings</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            {overview}
          </TabsContent>
          <TabsContent value="plan" className="mt-6">
            {plan}
          </TabsContent>
          <TabsContent value="outlook" className="mt-6">
            {outlook}
          </TabsContent>
          <TabsContent value="mappings" className="mt-6">
            {mappings}
          </TabsContent>
          <TabsContent value="chat" className="mt-6">
            {chat}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export function ExpensePlannerPage() {
  return (
    <Suspense
      fallback={
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <ExpensePlannerPageSkeleton />
        </motion.div>
      }
    >
      <ExpensePlannerPageContent />
    </Suspense>
  );
}
