"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useQueryTab } from "@/hooks/use-query-tab";
import { parseAccountsTab } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { AccountsBottomNav } from "./accounts-bottom-nav";
import { AccountsSectionTabs, type AccountsTab } from "./accounts-section-tabs";
import { AccountsListTab } from "./accounts-tab";
import { ConnectionsTab } from "./connections-tab";

const TAB_DESCRIPTIONS: Record<AccountsTab, string> = {
  accounts:
    "Linked bank, credit, and investment accounts. Position detail is on Holdings.",
  connections: "Link external financial data providers",
};

function AccountsPageContent() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useQueryTab<AccountsTab>({
    pathname: "/accounts",
    parse: parseAccountsTab,
    defaultTab: "accounts",
    omitDefaultFromUrl: true,
  });

  const tabPanel = (
    <>
      {activeTab === "accounts" && <AccountsListTab />}
      {activeTab === "connections" && <ConnectionsTab />}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        isMobile
          ? "mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1080px] flex-col px-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-3"
          : "mx-auto max-w-[1080px] space-y-6 p-6"
      )}
    >
      <div className="shrink-0 space-y-4">
        <PageHeader
          title="Accounts"
          description={TAB_DESCRIPTIONS[activeTab]}
        />
        {!isMobile && (
          <AccountsSectionTabs active={activeTab} onChange={setActiveTab} />
        )}
      </div>

      {isMobile ? (
        <>
          <main className="min-h-0 flex-1 overflow-y-auto" role="tabpanel" aria-label={activeTab}>
            {tabPanel}
          </main>
          <AccountsBottomNav active={activeTab} onChange={setActiveTab} />
        </>
      ) : (
        <div role="tabpanel" aria-label={activeTab}>
          {tabPanel}
        </div>
      )}
    </motion.div>
  );
}

export function AccountsPage() {
  return (
    <Suspense
      fallback={
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-[1080px] space-y-6 p-6"
        >
          <PageHeader
            title="Accounts"
            description="Linked bank, credit, and investment accounts."
          />
        </motion.div>
      }
    >
      <AccountsPageContent />
    </Suspense>
  );
}
