"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Landmark,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { isCreditAccount, summarizeAccounts } from "@/lib/accounts";
import { api } from "@/lib/api";
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
  accent: "emerald" | "rose" | "blue";
}) {
  const accentStyles = {
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
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
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountTile({ account }: { account: AccountRecord }) {
  const credit = isCreditAccount(account);
  const balance = account.balance ?? 0;
  const Icon = credit ? CreditCard : balance > 10000 ? Landmark : Wallet;

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={cn(
          "transition-colors hover:bg-muted/30",
          credit && "border-rose-500/20"
        )}
      >
        <CardContent className="flex items-center gap-3 p-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
              credit
                ? "bg-rose-500/10 text-rose-400"
                : "bg-emerald-500/10 text-emerald-400"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">
                {account.displayName}
              </p>
              <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                {account.source}
              </Badge>
            </div>
            {account.institutionName && (
              <p className="truncate text-xs text-muted-foreground">
                {account.institutionName}
              </p>
            )}
          </div>
          <p
            className={cn(
              "shrink-0 text-sm font-semibold tabular-nums",
              credit ? "text-rose-400" : "text-emerald-400"
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

function AccountSection({
  title,
  accounts,
  emptyMessage,
}: {
  title: string;
  accounts: AccountRecord[];
  emptyMessage: string;
}) {
  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <motion.div
        className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {accounts.map((account) => (
          <AccountTile key={account.accountId} account={account} />
        ))}
      </motion.div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAccounts()
      .then((r) =>
        setAccounts(
          r.accounts.map((a) => ({
            accountId: String(a.accountId),
            displayName: String(a.displayName),
            institutionName: a.institutionName
              ? String(a.institutionName)
              : undefined,
            source: String(a.source),
            balance: Number(a.balance) || 0,
            accountType: a.accountType ? String(a.accountType) : undefined,
          }))
        )
      )
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => summarizeAccounts(accounts), [accounts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <PageHeader
        title="Accounts"
        description="Cash, credit, and linked institution balances"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total assets"
          value={formatCurrency(summary.totalAssets)}
          sublabel={`${summary.assetAccounts.length} account${summary.assetAccounts.length === 1 ? "" : "s"}`}
          icon={Wallet}
          accent="emerald"
        />
        <SummaryCard
          label="Total credit"
          value={formatCurrency(summary.totalCredit)}
          sublabel={`${summary.creditAccounts.length} account${summary.creditAccounts.length === 1 ? "" : "s"}`}
          icon={CreditCard}
          accent="rose"
        />
        <SummaryCard
          label="Net total"
          value={formatCurrency(summary.netTotal)}
          sublabel="Assets minus credit"
          icon={TrendingUp}
          accent="blue"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No accounts linked yet. Connect SimpleFIN or SnapTrade from Connections.
        </p>
      ) : (
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AccountSection
            title="Assets & cash"
            accounts={summary.assetAccounts}
            emptyMessage="No asset accounts"
          />
          <AccountSection
            title="Credit & loans"
            accounts={summary.creditAccounts}
            emptyMessage="No credit accounts"
          />
        </motion.div>
      )}
    </motion.div>
  );
}
