"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Gauge, TrendingUp } from "lucide-react";
import { AllocationView } from "@/components/holdings/allocation-view";
import { computeNetWorth, computeUninvestedCash, summarizeAccounts } from "@/lib/accounts";
import { api } from "@/lib/api";
import {
  computeFreedomScore,
  sumMemberPassiveIncome,
} from "@/lib/freedom-score";
import type { Member } from "@/lib/household-types";
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
  summarizeTransactions,
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

const NET_WORTH_HIGHLIGHT = 500_000;
const UNINVESTED_CASH_HIGHLIGHT = 25_000;

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
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMonthSpendSummary(endDate: string) {
      try {
        const monthRes = await api.getTransactionSummary({
          startDate: monthStartDate(),
          endDate,
        });
        if (cancelled) return;
        setMonthSummary(monthRes);
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
      } catch {
        if (!cancelled) {
          setMonthSummary({
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
        const [accountsRes, holdingsRes, membersRes] = await Promise.all([
          api.getAccounts(),
          api.getHoldings(),
          api.listMembers().catch(() => ({ members: [] as Member[] })),
        ]);
        if (cancelled) return;
        setMembers(membersRes.members);
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
          setMembers([]);
        }
      }

      await loadMonthSpendSummary(endDate);

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

  const freedomScoreResult = useMemo(() => {
    const memberPassiveIncomeAnnual = sumMemberPassiveIncome(members);
    return computeFreedomScore({
      totalInvestments: summary.totalInvestments,
      monthlySpend: monthSummary.totalSpend,
      memberPassiveIncomeAnnual,
    });
  }, [
    members,
    summary.totalInvestments,
    monthSummary.totalSpend,
  ]);

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

  const freedomScoreValue =
    loading || freedomScoreResult.score === null
      ? "—"
      : `${freedomScoreResult.score}/100`;

  const freedomScoreDescription = loading
    ? "Loading…"
    : freedomScoreResult.score === null
      ? "No spend this month — score needs expenses"
      : freedomScoreResult.score === 0 &&
          summary.totalInvestments === 0 &&
          sumMemberPassiveIncome(members) === 0
        ? "Add holdings or household income on Household"
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
          value={loading ? "—" : formatCurrencyWhole(netWorth)}
          description={
            loading
              ? "Loading…"
              : accountCount === 0
                ? "Connect accounts to see net worth"
                : "Cash, investments, minus credit"
          }
          icon={TrendingUp}
          valueClassName={
            !loading && netWorth > NET_WORTH_HIGHLIGHT
              ? "text-emerald-400"
              : undefined
          }
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
          valueClassName={
            !loading && uninvestedCash > UNINVESTED_CASH_HIGHLIGHT
              ? "text-rose-400"
              : undefined
          }
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
      </motion.div>
    </motion.div>
  );
}
