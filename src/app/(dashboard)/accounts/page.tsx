"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Landmark, TrendingUp, Wallet } from "lucide-react";
import {
  accountDisplayBalance,
  buildAccountNameMap,
  isCreditAccount,
  isInvestmentAccount,
  summarizeAccounts,
} from "@/lib/accounts";
import type { Member } from "@/lib/household-types";
import { api } from "@/lib/api";
import {
  groupHoldingsByAccount,
  parseHoldings,
  type HoldingRecord,
} from "@/lib/holdings";
import type { AccountRecord } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function SummaryCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sublabel: string;
  icon: typeof Wallet;
  accent: "emerald" | "rose" | "blue" | "violet";
}) {
  const accentStyles = {
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    violet: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1",
            accentStyles[accent]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-lg font-semibold tabular-nums sm:text-xl">{value}</p>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountTile({
  account,
  displayName,
  holdingsByAccount,
}: {
  account: AccountRecord;
  displayName: string;
  holdingsByAccount: Map<string, HoldingRecord[]>;
}) {
  const credit = isCreditAccount(account);
  const investment = isInvestmentAccount(account, holdingsByAccount);
  const balance = credit
    ? (account.balance ?? 0)
    : accountDisplayBalance(account, holdingsByAccount);
  const Icon = credit
    ? CreditCard
    : investment
      ? TrendingUp
      : balance > 10000
        ? Landmark
        : Wallet;

  const valueClass = credit
    ? "text-rose-400"
    : investment
      ? "text-violet-400"
      : "text-emerald-400";

  const iconClass = credit
    ? "bg-rose-500/10 text-rose-400"
    : investment
      ? "bg-violet-500/10 text-violet-400"
      : "bg-emerald-500/10 text-emerald-400";

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={cn(
          "transition-colors hover:bg-muted/30",
          credit && "border-rose-500/20",
          investment && "border-violet-500/20"
        )}
      >
        <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                iconClass
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="min-w-0 text-sm font-medium break-words">
                  {displayName}
                </p>
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] px-1.5 py-0"
                >
                  {account.source}
                </Badge>
              </div>
              {account.institutionName && (
                <p className="truncate text-xs text-muted-foreground">
                  {account.institutionName}
                </p>
              )}
            </div>
          </div>
          <p
            className={cn(
              "self-end text-sm font-semibold tabular-nums sm:shrink-0 sm:self-auto",
              valueClass
            )}
          >
            {credit ? "−" : ""}
            {formatCurrency(Math.abs(balance))}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [holdingsByAccount, setHoldingsByAccount] = useState(
    new Map<string, HoldingRecord[]>()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAccounts(), api.getHoldings(), api.listMembers()])
      .then(([accountsRes, holdingsRes, membersRes]) => {
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
            ownerMemberId: a.ownerMemberId
              ? String(a.ownerMemberId)
              : undefined,
            connectionLabel: a.connectionLabel
              ? String(a.connectionLabel)
              : undefined,
          }))
        );
        setMembers(membersRes.members);
        setHoldingsByAccount(
          groupHoldingsByAccount(parseHoldings(holdingsRes.holdings))
        );
      })
      .catch(() => {
        setAccounts([]);
        setMembers([]);
        setHoldingsByAccount(new Map());
      })
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(
    () => summarizeAccounts(accounts, holdingsByAccount),
    [accounts, holdingsByAccount]
  );

  const accountNames = useMemo(
    () => buildAccountNameMap(accounts, members),
    [accounts, members]
  );

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) =>
        (accountNames.get(a.accountId) ?? a.displayName).localeCompare(
          accountNames.get(b.accountId) ?? b.displayName,
          undefined,
          { sensitivity: "base" }
        )
      ),
    [accounts, accountNames]
  );

  const hasAnyAccounts =
    summary.bankAccounts.length +
      summary.creditAccounts.length +
      summary.investmentAccounts.length >
    0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <PageHeader
        title="Accounts"
        description="Linked bank, credit, and investment accounts. Position detail is on Holdings."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          label="Investments"
          value={formatCurrency(summary.totalInvestments)}
          sublabel={`${summary.investmentAccounts.length} account${summary.investmentAccounts.length === 1 ? "" : "s"}`}
          icon={TrendingUp}
          accent="violet"
        />
        <SummaryCard
          label="Uninvested cash"
          value={formatCurrency(summary.totalUninvestedCash)}
          sublabel="Bank + brokerage cash"
          icon={Landmark}
          accent="blue"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading accounts…</p>
      ) : !hasAnyAccounts ? (
        <p className="text-sm text-muted-foreground">
          No accounts linked yet. Connect SimpleFIN from Connections, then sync.
        </p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Accounts</h2>
          <motion.div
            className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {sortedAccounts.map((account) => (
              <AccountTile
                key={account.accountId}
                account={account}
                displayName={
                  accountNames.get(account.accountId) ?? account.displayName
                }
                holdingsByAccount={holdingsByAccount}
              />
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
