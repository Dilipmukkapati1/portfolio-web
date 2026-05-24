"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Calculator,
  CalendarDays,
  CircleDollarSign,
  Link as LinkIcon,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AllocationView } from "@/components/holdings/allocation-view";
import { computeNetWorth, summarizeAccounts } from "@/lib/accounts";
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
import { parseTransactions, type TransactionRecord } from "@/lib/transactions";
import {
  currentMonthLabel,
  earliestDashboardTransactionDate,
  monthStartDate,
  rollingDaysStartDate,
  summarizeTransactions,
  topSpendCategories,
} from "@/lib/transactions-summary";
import type { AccountRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const quickLinks = [
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/holdings", label: "Holdings", icon: TrendingUp },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/tax", label: "Tax", icon: Calculator },
  { href: "/connections", label: "Connections", icon: LinkIcon },
];

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [holdings, setHoldings] = useState<HoldingRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAccounts(),
      api.getHoldings(),
      api.getTransactions({
        startDate: earliestDashboardTransactionDate(),
        limit: "500",
      }),
    ])
      .then(([accountsRes, holdingsRes, transactionsRes]) => {
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
        setTransactions(parseTransactions(transactionsRes.transactions));
      })
      .catch(() => {
        setAccounts([]);
        setHoldings([]);
        setTransactions([]);
      })
      .finally(() => setLoading(false));
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

  const monthSummary = useMemo(
    () =>
      summarizeTransactions(transactions, {
        startDate: monthStartDate(),
      }),
    [transactions]
  );

  const last30DaysSummary = useMemo(
    () =>
      summarizeTransactions(transactions, {
        startDate: rollingDaysStartDate(30),
      }),
    [transactions]
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
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <StatCard
          title="Net worth"
          value={loading ? "—" : formatCurrency(netWorth)}
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
          value={loading ? "—" : formatCurrency(monthSummary.totalCredits)}
          description={
            loading
              ? "Loading…"
              : `${monthLabel} · excludes transfers & investments`
          }
          icon={CircleDollarSign}
        />
        <StatCard
          title="Monthly spend"
          value={loading ? "—" : formatCurrency(monthSummary.totalSpend)}
          description={
            loading
              ? "Loading…"
              : topSpendCategories(monthSummary.spendByCategory)
          }
          icon={TrendingDown}
        />
        <StatCard
          title="Last 30 days spend"
          value={loading ? "—" : formatCurrency(last30DaysSummary.totalSpend)}
          description={
            loading
              ? "Loading…"
              : topSpendCategories(last30DaysSummary.spendByCategory)
          }
          icon={CalendarDays}
        />
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Holdings by category</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading holdings…</p>
          ) : holdings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No holdings yet. Sync investment accounts from Connections.
            </p>
          ) : (
            <AllocationView slices={categoryAllocation} chartStyle="pie" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick links</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {quickLinks.map((link) => (
              <motion.div
                key={link.href}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <link.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
