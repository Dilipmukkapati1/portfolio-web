"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Gauge, TrendingUp } from "lucide-react";
import { AllocationView } from "@/components/holdings/allocation-view";
import { api } from "@/lib/api";
import {
  currentMonthLabel,
  monthStartDate,
} from "@/lib/transactions-summary";
import { formatCurrencyWhole, formatPercent } from "@/lib/utils";
import { usePrivacy } from "@/components/PrivacyProvider";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rowVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

type DashboardAnalytics = {
  privacyMode?: "locked" | "unlocked";
  valuesUnlocked?: boolean;
  allocation?: Array<{ id: string; label: string; percent: number }>;
  spendByCategoryPercent?: Record<string, number>;
  transactionCount?: number;
  freedomScore?: { score: number | null; annualIncome?: number; annualExpenses?: number };
  netWorth?: number;
  uninvestedCash?: number;
  uninvestedCashPercent?: number;
};

export default function DashboardPage() {
  const { isUnlocked, privacyVersion } = usePrivacy();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setAnalytics(null);
      try {
        const data = await api.getDashboardAnalytics({
          startDate: monthStartDate(),
          endDate: todayDate(),
        });
        if (cancelled) return;
        setAnalytics(data as DashboardAnalytics);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Dashboard summary unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [privacyVersion]);

  const unlocked = isUnlocked && analytics?.valuesUnlocked === true;

  const categoryAllocation = useMemo(() => {
    const netWorth =
      unlocked && typeof analytics?.netWorth === "number"
        ? analytics.netWorth
        : undefined;
    return (analytics?.allocation ?? []).map((slice) => ({
      ...slice,
      // Locked mode is percent-only from the API; use percent as chart weight.
      // When unlocked, approximate slice dollars from net worth for the legend.
      value:
        netWorth != null && netWorth > 0
          ? (slice.percent / 100) * netWorth
          : slice.percent,
    }));
  }, [analytics, unlocked]);

  const monthLabel = currentMonthLabel();

  const freedomScoreValue =
    loading || !analytics?.freedomScore || analytics.freedomScore.score === null
      ? "—"
      : `${analytics.freedomScore.score}/100`;

  const freedomScoreDescription = loading
    ? "Loading…"
    : error
      ? "Summary unavailable"
    : !analytics?.freedomScore || analytics.freedomScore.score === null
      ? "No spend this month — score needs expenses"
      : `4% withdrawal + interest/dividends vs ${monthLabel} spend`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <PageHeader
        title="Dashboard"
        description="Welcome back — here's your portfolio at a glance."
      />

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={rowVariants}
      >
        <StatCard
          title="Net worth"
          value={
            loading
              ? "—"
              : unlocked && typeof analytics?.netWorth === "number"
                ? formatCurrencyWhole(analytics.netWorth)
                : "Unlock to view"
          }
          description={
            loading
              ? "Loading…"
              : unlocked
                ? "Cash, investments, minus credit"
                : "Dollar values hidden"
          }
          icon={TrendingUp}
        />
        <StatCard
          title="Uninvested cash"
          value={
            loading
              ? "—"
              : unlocked && typeof analytics?.uninvestedCash === "number"
                ? formatCurrencyWhole(analytics.uninvestedCash)
                : typeof analytics?.uninvestedCashPercent === "number"
                  ? formatPercent(analytics.uninvestedCashPercent)
                  : "Unlock to view"
          }
          description={
            loading
              ? "Loading…"
              : unlocked
                ? "Bank cash + brokerage cash"
                : "Percent of net worth"
          }
          icon={Banknote}
        />
        <StatCard
          title="Freedom Score"
          value={freedomScoreValue}
          description={freedomScoreDescription}
          icon={Gauge}
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={rowVariants}
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Holdings by category</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading holdings…</p>
              ) : error ? (
                <p className="text-sm text-muted-foreground">{error}</p>
              ) : categoryAllocation.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No holdings yet. Sync investment accounts from Connections.
                </p>
              ) : (
                <AllocationView
                  slices={categoryAllocation}
                  chartStyle="pie"
                  className="border-0 bg-transparent p-0"
                  formatAmount={formatCurrencyWhole}
                  hideAmounts={!unlocked}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
