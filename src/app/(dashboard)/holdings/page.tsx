"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { AllocationView } from "@/components/holdings/allocation-view";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildAccountNameMap } from "@/lib/accounts";
import { api } from "@/lib/api";
import { usePrivacy } from "@/components/PrivacyProvider";
import type { AccountRecord } from "@/lib/types";
import type { Member } from "@/lib/household-types";
import {
  computeAllocations,
  getHoldingValue,
  groupHoldingsByAccount,
  groupHoldingsByCategory,
  groupHoldingsBySymbol,
  holdingsTotalValue,
  investmentCategoryLabel,
  isCashHolding,
  parseHoldings,
  resolveHoldingCategory,
  type HoldingRecord,
  type SymbolAggregate,
} from "@/lib/holdings";
import { formatCurrency, formatPercent } from "@/lib/utils";

type GroupMode = "account" | "symbol" | "category";
type ViewMode = "holdings" | "allocation";
type ChartStyle = "pie" | "table";

function HoldingRow({
  holding,
  totalValue,
  hidden,
}: {
  holding: HoldingRecord;
  totalValue: number;
  hidden: boolean;
}) {
  const value = getHoldingValue(holding);
  const category = resolveHoldingCategory(holding);
  const percent =
    holding.portfolioPercent ?? (totalValue > 0 ? (value / totalValue) * 100 : 0);
  const label = isCashHolding(holding)
    ? "Cash"
    : holding.description?.trim() || holding.symbol;

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">
          {isCashHolding(holding) ? "Cash" : holding.symbol}
        </div>
        {!isCashHolding(holding) && holding.description && (
          <p className="max-w-[240px] truncate text-xs text-muted-foreground">
            {holding.description}
          </p>
        )}
        {isCashHolding(holding) && (
          <p className="text-xs text-muted-foreground">{label}</p>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {investmentCategoryLabel(category)}
        </Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {hidden || isCashHolding(holding)
          ? "—"
          : (holding.quantity ?? 0).toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {!hidden && holding.price != null && !isCashHolding(holding)
          ? formatCurrency(holding.price)
          : "—"}
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">
        {formatCurrency(value, { hidden })}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {formatPercent(percent)}
      </TableCell>
    </TableRow>
  );
}

function SymbolAggregateRow({
  aggregate,
  accountNames,
  totalValue,
  expanded,
  onToggle,
  hidden,
}: {
  aggregate: SymbolAggregate;
  accountNames: Map<string, string>;
  totalValue: number;
  expanded: boolean;
  onToggle: () => void;
  hidden: boolean;
}) {
  const percent =
    aggregate.portfolioPercent ??
    (totalValue > 0 ? (aggregate.totalMarketValue / totalValue) * 100 : 0);
  const label = aggregate.isCash
    ? "Cash"
    : aggregate.description?.trim() || aggregate.symbol;
  const hasMultipleAccounts = aggregate.accounts.length > 1;

  return (
    <>
      <TableRow
        className={hasMultipleAccounts ? "cursor-pointer hover:bg-muted/50" : undefined}
        onClick={hasMultipleAccounts ? onToggle : undefined}
      >
        <TableCell>
          <div className="flex items-center gap-1.5">
            {hasMultipleAccounts &&
              (expanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              ))}
            <div>
              <div className="font-medium">
                {aggregate.isCash ? "Cash" : aggregate.symbol}
              </div>
              {!aggregate.isCash && aggregate.description && (
                <p className="max-w-[240px] truncate text-xs text-muted-foreground">
                  {aggregate.description}
                </p>
              )}
              {aggregate.isCash && (
                <p className="text-xs text-muted-foreground">{label}</p>
              )}
              {hasMultipleAccounts && (
                <p className="text-xs text-muted-foreground">
                  {aggregate.accounts.length} accounts
                </p>
              )}
              <Badge variant="outline" className="mt-1 font-normal">
                {aggregate.categoryLabel}
              </Badge>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {hidden || aggregate.isCash
            ? "—"
            : aggregate.totalQuantity.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {!hidden && aggregate.weightedAvgPrice != null && !aggregate.isCash
            ? formatCurrency(aggregate.weightedAvgPrice)
            : "—"}
        </TableCell>
        <TableCell className="text-right tabular-nums font-medium">
          {formatCurrency(aggregate.totalMarketValue, { hidden })}
        </TableCell>
        <TableCell className="text-right tabular-nums text-muted-foreground">
          {formatPercent(percent)}
        </TableCell>
      </TableRow>
      {expanded &&
        aggregate.accounts.map((account) => (
          <TableRow key={`${aggregate.symbol}-${account.accountId}`} className="bg-muted/30">
            <TableCell className="pl-10 text-sm text-muted-foreground">
              {accountNames.get(account.accountId) ?? account.accountId}
            </TableCell>
            <TableCell className="text-right tabular-nums text-sm">
              {hidden || aggregate.isCash
                ? "—"
                : account.quantity.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
            </TableCell>
            <TableCell className="text-right tabular-nums text-sm">
              {!hidden && account.price != null && !aggregate.isCash
                ? formatCurrency(account.price)
                : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums text-sm">
              {formatCurrency(account.marketValue, { hidden })}
            </TableCell>
            <TableCell />
          </TableRow>
        ))}
    </>
  );
}

export default function HoldingsPage() {
  const { isUnlocked, privacyVersion } = usePrivacy();
  const [holdings, setHoldings] = useState<HoldingRecord[]>([]);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupMode, setGroupMode] = useState<GroupMode>("category");
  const [viewMode, setViewMode] = useState<ViewMode>("allocation");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("pie");
  const [expandedSymbols, setExpandedSymbols] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    setLoading(true);
    setExpandedSymbols(new Set());
    Promise.all([api.getHoldings(), api.getAccounts(), api.listMembers()])
      .then(([holdingsRes, accountsRes, membersRes]) => {
        setHoldings(parseHoldings(holdingsRes.holdings));
        setAccounts(
          accountsRes.accounts.map((a) => ({
            accountId: String(a.accountId),
            displayName: String(a.displayName),
            institutionName: a.institutionName
              ? String(a.institutionName)
              : undefined,
            source: String(a.source),
            balance: a.balance != null ? Number(a.balance) : undefined,
            percentOfNetWorth:
              a.percentOfNetWorth != null ? Number(a.percentOfNetWorth) : undefined,
            accountType: a.accountType ? String(a.accountType) : undefined,
            ownerMemberId: a.ownerMemberId
              ? String(a.ownerMemberId)
              : undefined,
            connectionLabel: a.connectionLabel
              ? String(a.connectionLabel)
              : undefined,
          }))
        );
        setMembers((membersRes.members as Member[]) ?? []);
      })
      .catch(() => {
        setHoldings([]);
        setAccounts([]);
        setMembers([]);
      })
      .finally(() => setLoading(false));
  }, [privacyVersion]);

  const accountNames = useMemo(
    () => buildAccountNameMap(accounts, members),
    [accounts, members]
  );

  const totalValue = useMemo(() => holdingsTotalValue(holdings), [holdings]);
  const groupedByAccount = useMemo(
    () => groupHoldingsByAccount(holdings, totalValue),
    [holdings, totalValue]
  );
  const groupedBySymbol = useMemo(
    () => groupHoldingsBySymbol(holdings),
    [holdings]
  );
  const groupedByCategory = useMemo(
    () => groupHoldingsByCategory(holdings),
    [holdings]
  );

  const accountSections = useMemo(() => {
    return [...groupedByAccount.entries()].sort((a, b) => {
      const nameA = accountNames.get(a[0]) ?? a[0];
      const nameB = accountNames.get(b[0]) ?? b[0];
      return nameA.localeCompare(nameB);
    });
  }, [groupedByAccount, accountNames]);

  const allocationSlices = useMemo(() => {
    if (!isUnlocked) {
      const byId = new Map<string, { id: string; label: string; percent: number }>();
      const add = (id: string, label: string, percent: number) => {
        const entry = byId.get(id) ?? { id, label, percent: 0 };
        entry.percent += percent;
        byId.set(id, entry);
      };
      for (const holding of holdings) {
        const category = resolveHoldingCategory(holding);
        const id =
          groupMode === "symbol"
            ? holding.symbol
            : groupMode === "account"
              ? holding.accountId
              : category;
        const label =
          groupMode === "account"
            ? accountNames.get(holding.accountId) ?? holding.accountId
            : groupMode === "category"
              ? investmentCategoryLabel(category)
              : holding.symbol;
        add(id, label, holding.portfolioPercent ?? 0);
      }
      return [...byId.values()].map((slice) => ({
        ...slice,
        // Use percent as chart weight when dollar values are hidden (see dashboard).
        value: slice.percent,
      }));
    }
    if (groupMode === "symbol") {
      return computeAllocations(
        groupedBySymbol.map((aggregate) => ({
          id: aggregate.symbol,
          label: aggregate.isCash ? "Cash" : aggregate.symbol,
          value: aggregate.totalMarketValue,
        })),
        totalValue
      );
    }

    if (groupMode === "category") {
      return computeAllocations(
        groupedByCategory.map((section) => ({
          id: section.category,
          label: section.label,
          value: section.totalMarketValue,
        })),
        totalValue
      );
    }

    return computeAllocations(
      accountSections.map(([accountId, accountHoldings]) => ({
        id: accountId,
        label: accountNames.get(accountId) ?? accountId,
        value: accountHoldings.reduce(
          (sum, holding) => sum + getHoldingValue(holding),
          0
        ),
      })),
      totalValue
    );
  }, [
    accountNames,
    accountSections,
    groupMode,
    groupedByCategory,
    groupedBySymbol,
    holdings,
    isUnlocked,
    totalValue,
  ]);

  function toggleSymbol(symbol: string) {
    setExpandedSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  }

  const controls = (
    <div className="flex flex-col gap-3 sm:items-end">
      <Tabs
        value={groupMode}
        onValueChange={(value) => setGroupMode(value as GroupMode)}
      >
        <TabsList>
          <TabsTrigger value="account">By account</TabsTrigger>
          <TabsTrigger value="symbol">By symbol</TabsTrigger>
          <TabsTrigger value="category">By category</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
          </TabsList>
        </Tabs>
        {viewMode === "allocation" && (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={chartStyle === "pie" ? "secondary" : "ghost"}
              onClick={() => setChartStyle("pie")}
            >
              Pie
            </Button>
            <Button
              type="button"
              size="sm"
              variant={chartStyle === "table" ? "secondary" : "ghost"}
              onClick={() => setChartStyle("table")}
            >
              Table
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Holdings"
        description="Investment positions and cash from linked accounts"
        action={!loading && holdings.length > 0 ? controls : undefined}
      />

      {!loading && holdings.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm text-muted-foreground">Total positions value</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatCurrency(totalValue, { hidden: !isUnlocked })}
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading holdings…</p>
      ) : holdings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No holdings yet. Connect SimpleFIN and sync from Connections — brokerage
          accounts with positions will appear here with cash balances.
        </p>
      ) : viewMode === "allocation" ? (
        <AllocationView
          slices={allocationSlices}
          chartStyle={chartStyle}
          hideAmounts={!isUnlocked}
        />
      ) : groupMode === "category" ? (
        <div className="space-y-4">
          {groupedByCategory.map((section) => (
            <Card key={section.category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {section.label}
                </CardTitle>
                <Badge variant="secondary" className="tabular-nums">
                  {formatCurrency(section.totalMarketValue, { hidden: !isUnlocked })}
                </Badge>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Avg price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">% of portfolio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.symbols.map((aggregate) => (
                      <SymbolAggregateRow
                        key={`${section.category}-${aggregate.symbol}`}
                        aggregate={aggregate}
                        accountNames={accountNames}
                        totalValue={totalValue}
                        expanded={expandedSymbols.has(
                          `${section.category}-${aggregate.symbol}`
                        )}
                        onToggle={() =>
                          toggleSymbol(`${section.category}-${aggregate.symbol}`)
                        }
                        hidden={!isUnlocked}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupMode === "symbol" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              All investments
            </CardTitle>
            <Badge variant="secondary" className="tabular-nums">
              {formatCurrency(totalValue, { hidden: !isUnlocked })}
            </Badge>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Avg price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">% of portfolio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedBySymbol.map((aggregate) => (
                  <SymbolAggregateRow
                    key={aggregate.symbol}
                    aggregate={aggregate}
                    accountNames={accountNames}
                    totalValue={totalValue}
                    expanded={expandedSymbols.has(aggregate.symbol)}
                    onToggle={() => toggleSymbol(aggregate.symbol)}
                    hidden={!isUnlocked}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {accountSections.map(([accountId, accountHoldings]) => {
            const accountTotal = accountHoldings.reduce(
              (sum, h) => sum + getHoldingValue(h),
              0
            );
            return (
              <Card key={accountId}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    {accountNames.get(accountId) ?? accountId}
                  </CardTitle>
                  <Badge variant="secondary" className="tabular-nums">
                    {formatCurrency(accountTotal, { hidden: !isUnlocked })}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">% of portfolio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountHoldings.map((h) => (
                        <HoldingRow
                          key={h.holdingId}
                          holding={h}
                          totalValue={totalValue}
                          hidden={!isUnlocked}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
