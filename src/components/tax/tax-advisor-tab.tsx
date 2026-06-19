"use client";

import { useEffect } from "react";
import { composeAdvisorPageContext } from "@portfolio/contracts";
import { AdvisorChatPanel } from "@/components/advisor/advisor-chat-panel";
import { buildTaxPageSnapshot, persistAdvisorPageContext } from "@/lib/advisor/page-context";
import type { TaxOutlook } from "@/lib/tax/outlook";
import type { TaxProfile } from "@/lib/household-types";

export function TaxAdvisorSection({
  outlook,
  taxProfile,
  strategies,
  taxYear,
  taxView,
  earnerScope,
  isMobile,
}: {
  outlook: TaxOutlook | null;
  taxProfile: TaxProfile | null;
  strategies: Array<Record<string, unknown>>;
  taxYear: number;
  taxView: string;
  earnerScope: string;
  isMobile: boolean;
}) {
  useEffect(() => {
    const snapshot = buildTaxPageSnapshot({
      tab: "advisor",
      taxView,
      earnerScope,
      taxYear,
      onTrackPct: outlook?.onTrackPercent,
      openStrategies: strategies.slice(0, 5).map((s) => ({
        id: String(s.id),
        title: String(s.title),
        estimatedSavings:
          s.estimatedSavings != null ? Number(s.estimatedSavings) : undefined,
      })),
      contributionRoom: (taxProfile?.contributionLimits ?? [])
        .filter((l) => l.remaining > 0)
        .map((l) => ({
          label: l.type,
          remaining: l.remaining,
        })),
    });
    persistAdvisorPageContext(
      composeAdvisorPageContext("/tax", snapshot, {
        sourceLabelSuffix: "Advisor tab",
      })
    );
  }, [outlook, taxProfile, strategies, taxYear, taxView, earnerScope]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <AdvisorChatPanel embedded compact={isMobile} flush />
    </div>
  );
}
