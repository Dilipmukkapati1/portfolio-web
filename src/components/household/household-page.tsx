"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { HouseholdMembersSection } from "@/components/household/household-members-section";
import { HouseholdProfileChatPanel } from "@/components/household/household-profile-chat-panel";
import { HouseholdBottomNav } from "@/components/household/household-bottom-nav";
import {
  HouseholdSectionTabs,
  type HouseholdTab,
} from "@/components/household/household-section-tabs";
import { useHousehold } from "@/components/HouseholdProvider";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

function parseHouseholdTab(value: string | null): HouseholdTab {
  if (value === "chat" || value === "members") return value;
  return "members";
}

function HouseholdPageContent() {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { loading } = useHousehold();
  const [activeTab, setActiveTab] = useState<HouseholdTab>(() =>
    parseHouseholdTab(searchParams.get("tab"))
  );
  const [membersRefreshToken, setMembersRefreshToken] = useState(0);

  useEffect(() => {
    setActiveTab(parseHouseholdTab(searchParams.get("tab")));
  }, [searchParams]);

  function handleTabChange(tab: HouseholdTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    window.history.replaceState(null, "", `/household?${params.toString()}`);
  }

  const isChatTab = activeTab === "chat";

  const membersPanel = (
    <HouseholdMembersSection
      embedded
      refreshToken={membersRefreshToken}
    />
  );

  const chatPanel = (
    <HouseholdProfileChatPanel
      embedded
      flush={isMobile}
      onMembersUpdated={async () => {
        setMembersRefreshToken((n) => n + 1);
      }}
    />
  );

  const tabPanel = (
    <>
      {activeTab === "members" && membersPanel}
      {activeTab === "chat" && (
        <div className="flex min-h-0 flex-1 flex-col">{chatPanel}</div>
      )}
    </>
  );

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          isMobile
            ? "mx-auto flex max-w-[1080px] flex-col px-2 pt-1 min-h-[calc(100dvh-4rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
            : "mx-auto max-w-[1080px] space-y-6 px-2 py-4"
        )}
      >
        <p className="text-sm text-muted-foreground">Loading…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        isMobile
          ? cn(
              "mx-auto flex max-w-[1080px] flex-col overflow-hidden px-0 pt-1",
              isChatTab
                ? "h-[calc(100dvh-3.5rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
                : "min-h-[calc(100dvh-4rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
            )
          : cn(
              "mx-auto max-w-[1080px]",
              isChatTab
                ? "flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden px-2 py-4"
                : "space-y-6 px-2 py-4"
            )
      )}
    >
      <div className={cn("shrink-0", isMobile ? "mb-2 px-2" : undefined)}>
        <h1 className={cn("font-semibold", isMobile ? "text-lg" : "text-2xl")}>
          Household
        </h1>
      </div>

      {!isMobile && (
        <div className="shrink-0">
          <HouseholdSectionTabs active={activeTab} onChange={handleTabChange} />
        </div>
      )}

      {isMobile ? (
        <>
          <main
            className={cn(
              "min-h-0 flex-1",
              isChatTab ? "flex flex-col overflow-hidden" : "overflow-y-auto px-2"
            )}
            role="tabpanel"
            aria-label={activeTab}
          >
            {tabPanel}
          </main>
          <HouseholdBottomNav active={activeTab} onChange={handleTabChange} />
        </>
      ) : (
        <div
          className={cn(
            "min-h-0",
            isChatTab ? "flex flex-1 flex-col overflow-hidden" : undefined
          )}
          role="tabpanel"
          aria-label={activeTab}
        >
          {tabPanel}
        </div>
      )}
    </motion.div>
  );
}

export function HouseholdPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1080px] px-2 py-4 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <HouseholdPageContent />
    </Suspense>
  );
}
