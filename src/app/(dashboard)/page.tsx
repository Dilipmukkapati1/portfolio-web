"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  CalendarDays,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { AllocationView } from "@/components/holdings/allocation-view";
import { computeNetWorth, computeUninvestedCash, summarizeAccounts } from "@/lib/accounts";
import { api } from "@/lib/api";
import {
  computeAllocations,
  DASHBOARD_CATEGORY_LABELS,
  groupHoldingsByAccount,
  groupHoldingsByCategory,
  holdingsTotalValue,
  parseHoldings,
  type HoldingRecord,
} from "@/lib/holdings";
import { parseTransactions } from "@/lib/transactions";
import {
  currentMonthLabel,
  earliestDashboardTransactionDate,
  monthStartDate,
  rollingDaysStartDate,
  summarizeTransactions,
  topSpendCategories,
  type TransactionPeriodSummary,
} from "@/lib/transactions-summary";
import type { AccountRecord } from "@/lib/types";
import { formatCurrencyWhole } from "@/lib/utils";
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

function SpendMetric({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex h-full flex-col justify-center rounded-lg border border-border bg-muted/20 px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{title}</p>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [holdings, setHoldings] = useState<HoldingRecord[]>([]);
  const [monthSummary, setMonthSummary] = useState<TransactionPeriodSummary>({
    totalCredits: 0,
    totalSpend: 0,
    spendByCategory: {},
    transactionCount: 0,
  });
  const [last30DaysSummary, setLast30DaysSummary] =
    useState<TransactionPeriodSummary>({
      totalCredits: 0,
      totalSpend: 0,
      spendByCategory: {},
      transactionCount: 0,
    });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTransactionSummaries(endDate: string) {
      try {
        const [monthRes, last30Res] = await Promise.all([
          api.getTransactionSummary({
            startDate: monthStartDate(),
            endDate,
          }),
          api.getTransactionSummary({
            startDate: rollingDaysStartDate(30),
            endDate,
          }),
        ]);
        if (cancelled) return;
        setMonthSummary(monthRes);
        setLast30DaysSummary(last30Res);
        return;
      } catch {
        // Fall back when summary endpoint or SQL is unavailable.
      }

      try {
        const res = await api.getTransactions({
          startDate: earliestDashboardTransactionDate(),
          endDate,
          limit: "500",
        });
        if (cancelled) return;
        const transactions = parseTransactions(res.transactions);
        setMonthSummary(
          summarizeTransactions(transactions, {
            startDate: monthStartDate(),
            endDate,
          })
        );
        setLast30DaysSummary(
          summarizeTransactions(transactions, {
            startDate: rollingDaysStartDate(30),
            endDate,
          })
        );
      } catch {
        if (!cancelled) {
          setMonthSummary({
            totalCredits: 0,
            totalSpend: 0,
            spendByCategory: {},
            transactionCount: 0,
          });
          setLast30DaysSummary({
            totalCredits: 0,
            totalSpend: 0,
            spendByCategory: {},
            transactionCount: 0,
          });
        }
      }
    }

    async function load() {
      setLoading(true);
      const endDate = todayDate();

      try {
        const [accountsRes, holdingsRes] = await Promise.all([
          api.getAccounts(),
          api.getHoldings(),
        ]);
        if (cancelled) return;
        setAccounts(
          accountsRes.accounts.map((a) => ({
            accountId: String(a.accountId),
            displayName: String(a.displayName),
            institutionName: a.institutionName
              ? String(a.institutionName)
              : undefined,
            source: String(a.source),
            balance: Number(a.balance) || 0,
            accountType: a.accountType ? String(a.accountType) : undefined,
          }))
        );
        setHoldings(parseHoldings(holdingsRes.holdings));
      } catch {
        if (!cancelled) {
          setAccounts([]);
          setHoldings([]);
        }
      }

      await loadTransactionSummaries(endDate);

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const holdingsByAccount = useMemo(
    () => groupHoldingsByAccount(holdings),
    [holdings]
  );

  const summary = useMemo(
    () => summarizeAccounts(accounts, holdingsByAccount),
    [accounts, holdingsByAccount]
  );

  const netWorth = useMemo(
    () => computeNetWorth(accounts, holdingsByAccount),
    [accounts, holdingsByAccount]
  );

  const uninvestedCash = useMemo(
    () => computeUninvestedCash(accounts, holdingsByAccount),
    [accounts, holdingsByAccount]
  );

  const categoryAllocation = useMemo(() => {
    const grouped = groupHoldingsByCategory(holdings);
    const total = holdingsTotalValue(holdings);
    return computeAllocations(
      grouped.map((section) => ({
        id: section.category,
        label: DASHBOARD_CATEGORY_LABELS[section.category],
        value: section.totalMarketValue,
      })),
      total
    );
  }, [holdings]);

  const accountCount =
    summary.bankAccounts.length +
    summary.creditAccounts.length +
    summary.investmentAccounts.length;

  const monthLabel = currentMonthLabel();

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
          value={loading ? "—" : formatCurrencyWhole(netWorth)}
          description={
            loading
              ? "Loading…"
              : accountCount === 0
                ? "Connect accounts to see net worth"
                : "Cash, investments, minus credit"
          }
          icon={TrendingUp}
        />
        <StatCard
          title="Monthly net credits"
          value={loading ? "—" : formatCurrencyWhole(monthSummary.totalCredits)}
          description={
            loading
              ? "Loading…"
              : `${monthLabel} · excludes transfers & investments`
          }
          icon={CircleDollarSign}
        />
        <StatCard
          title="Uninvested cash"
          value={loading ? "—" : formatCurrencyWhole(uninvestedCash)}
          description={
            loading
              ? "Loading…"
              : "Bank cash + brokerage cash"
          }
          icon={Banknote}
        />
      </motion.div>

      <motion.div
        className="grid gap-4 lg:grid-cols-2 lg:items-stretch"
        initial="hidden"
        animate="show"
        variants={rowVariants}
      >
        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex h-full flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Holdings by category</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading holdings…</p>
              ) : holdings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No holdings yet. Sync investment accounts from Connections.
                </p>
              ) : (
                <AllocationView
                  slices={categoryAllocation}
                  chartStyle="pie"
                  className="border-0 bg-transparent p-0"
                  formatAmount={formatCurrencyWhole}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <Card className="flex h-full flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Spending</CardTitle>
            </CardHeader>
            <CardContent className="grid flex-1 grid-rows-2 gap-4">
              <SpendMetric
                title="Monthly spend"
                value={loading ? "—" : formatCurrencyWhole(monthSummary.totalSpend)}
                description={
                  loading
                    ? "Loading…"
                    : topSpendCategories(monthSummary.spendByCategory)
                }
                icon={TrendingDown}
              />
              <SpendMetric
                title="Last 30 days spend"
                value={
                  loading ? "—" : formatCurrencyWhole(last30DaysSummary.totalSpend)
                }
                description={
                  loading
                    ? "Loading…"
                    : topSpendCategories(last30DaysSummary.spendByCategory)
                }
                icon={CalendarDays}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
