"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useHousehold } from "@/components/HouseholdProvider";
import { usePrivacy } from "@/components/PrivacyProvider";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { CONTRIBUTION_TYPE_LABELS, type TaxProfile } from "@/lib/household-types";
import type { ContributionType } from "@/lib/household-types";

export default function TaxPage() {
  const { household, loading: householdLoading } = useHousehold();
  const { isUnlocked, privacyVersion, showUnlockDialog } = usePrivacy();
  const [taxProfile, setTaxProfile] = useState<TaxProfile | null>(null);
  const [strategies, setStrategies] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taxYear =
    household?.settings?.defaultTaxYear ?? new Date().getFullYear();

  const loadTaxData = useCallback(async () => {
    if (!household) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await api.getTaxProfile(taxYear).catch(() => null);
      setTaxProfile(profile);
      const strat = await api.taxStrategies();
      setStrategies(strat.strategies);
      if (strat.taxProfile) setTaxProfile(strat.taxProfile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tax data");
    } finally {
      setLoading(false);
    }
  }, [household, taxYear, privacyVersion]);

  useEffect(() => {
    if (household && !householdLoading) {
      void loadTaxData();
    }
  }, [household, householdLoading, loadTaxData]);

  async function runEstimate() {
    if (!household) return;
    if (!isUnlocked) {
      showUnlockDialog();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.recomputeTaxProfile(taxYear, {
        filingStatus: taxProfile?.filingStatus ?? household.filingStatus,
      });
      setTaxProfile(result.taxProfile);
      const strat = await api.taxStrategies();
      setStrategies(strat.strategies);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Estimate failed");
    } finally {
      setLoading(false);
    }
  }

  const estimate = taxProfile?.lastEstimate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl"
    >
      <PageHeader
        title="Tax Overview"
        description={`Federal estimate for ${taxYear} from your household members`}
      />

      {!household && !householdLoading && (
        <p className="text-sm text-muted-foreground">
          Set up a household with members and income on the{" "}
          <a href="/household" className="text-primary underline">
            Household
          </a>{" "}
          page first.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400 rounded-md bg-red-500/10 px-3 py-2">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{taxYear} federal estimate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => void runEstimate()}
            disabled={loading || !household}
            className="min-h-11 w-full sm:w-auto"
          >
            {loading
              ? "Calculating…"
              : isUnlocked
                ? "Recalculate from members"
                : "Unlock to recalculate"}
          </Button>

          {estimate ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
              {isUnlocked && (
                <>
                  <dt className="text-muted-foreground">AGI</dt>
                  <dd>{formatCurrency(Number(estimate.adjustedGrossIncome ?? 0))}</dd>
                  <dt className="text-muted-foreground">Taxable income</dt>
                  <dd>{formatCurrency(Number(estimate.taxableIncome ?? 0))}</dd>
                  <dt className="text-muted-foreground">Federal tax</dt>
                  <dd className="font-semibold">
                    {formatCurrency(Number(estimate.federalTax ?? 0))}
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">Effective rate</dt>
              <dd>
                {formatPercent(Number(estimate.effectiveRate ?? 0) * 100, 2)}
              </dd>
              <dt className="text-muted-foreground">Marginal rate</dt>
              <dd>
                {formatPercent(Number(estimate.marginalRate ?? 0) * 100, 0)}
              </dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add members with income on the Household page, then recalculate.
            </p>
          )}
        </CardContent>
      </Card>

      {taxProfile?.contributionLimits && taxProfile.contributionLimits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contribution room</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {taxProfile.contributionLimits.map((lim, i) => (
                <li
                  key={`${lim.type}-${lim.memberId ?? i}`}
                  className="flex flex-col sm:flex-row sm:justify-between gap-1 rounded-md border border-border px-3 py-2"
                >
                  <span>
                    {CONTRIBUTION_TYPE_LABELS[lim.type as ContributionType] ??
                      lim.type}
                  </span>
                  <span className="text-muted-foreground">
                    {isUnlocked
                      ? `${formatCurrency(lim.contributed)} / ${formatCurrency(
                          lim.limit
                        )} (${formatCurrency(lim.remaining)} left)`
                      : `Used ${formatPercent(
                          Number(
                            (lim as { contributionUsedPercent?: number })
                              .contributionUsedPercent
                          )
                        )}`}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {strategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Strategy ideas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {strategies.map((s) => (
              <div
                key={String(s.id)}
                className="rounded-md border border-border p-3 text-sm"
              >
                <p className="font-medium">{String(s.title)}</p>
                <p className="text-muted-foreground mt-1">{String(s.description)}</p>
                {s.estimatedSavings != null && (
                  <p className="text-green-400 mt-1 text-xs">
                    Est. savings: {formatCurrency(Number(s.estimatedSavings))}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Educational estimates only. Not tax, legal, or investment advice.
      </p>
    </motion.div>
  );
}
