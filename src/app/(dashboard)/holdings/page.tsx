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
import { api } from "@/lib/api";
import {
  computeAllocations,
  getHoldingValue,
  groupHoldingsByAccount,
  groupHoldingsBySymbol,
  holdingsTotalValue,
  isCashHolding,
  parseHoldings,
  type HoldingRecord,
  type SymbolAggregate,
} from "@/lib/holdings";
import { formatCurrency } from "@/lib/utils";

type GroupMode = "account" | "symbol";
type ViewMode = "holdings" | "allocation";
type ChartStyle = "pie" | "table";

function HoldingRow({ holding }: { holding: HoldingRecord }) {
  const value = getHoldingValue(holding);
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
      <TableCell className="text-right tabular-nums">
        {isCashHolding(holding)
          ? "—"
          : holding.quantity.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {holding.price != null && !isCashHolding(holding)
          ? formatCurrency(holding.price)
          : "—"}
      </TableCell>
      <TableCell className="text-right tabular-nums font-medium">
        {formatCurrency(value)}
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
}: {
  aggregate: SymbolAggregate;
  accountNames: Map<string, string>;
  totalValue: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const percent =
    totalValue > 0 ? (aggregate.totalMarketValue / totalValue) * 100 : 0;
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
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {aggregate.isCash
            ? "—"
            : aggregate.totalQuantity.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {aggregate.weightedAvgPrice != null && !aggregate.isCash
            ? formatCurrency(aggregate.weightedAvgPrice)
            : "—"}
        </TableCell>
        <TableCell className="text-right tabular-nums font-medium">
          {formatCurrency(aggregate.totalMarketValue)}
        </TableCell>
        <TableCell className="text-right tabular-nums text-muted-foreground">
          {percent.toFixed(1)}%
        </TableCell>
      </TableRow>
      {expanded &&
        aggregate.accounts.map((account) => (
          <TableRow key={`${aggregate.symbol}-${account.accountId}`} className="bg-muted/30">
            <TableCell className="pl-10 text-sm text-muted-foreground">
              {accountNames.get(account.accountId) ?? account.accountId}
            </TableCell>
            <TableCell className="text-right tabular-nums text-sm">
              {aggregate.isCash
                ? "—"
                : account.quantity.toLocaleString(undefined, {
                    maximumFractionDigits: 4,
                  })}
            </TableCell>
            <TableCell className="text-right tabular-nums text-sm">
              {account.price != null && !aggregate.isCash
                ? formatCurrency(account.price)
                : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums text-sm">
              {formatCurrency(account.marketValue)}
            </TableCell>
            <TableCell />
          </TableRow>
        ))}
    </>
  );
}

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<HoldingRecord[]>([]);
  const [accountNames, setAccountNames] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [groupMode, setGroupMode] = useState<GroupMode>("account");
  const [viewMode, setViewMode] = useState<ViewMode>("holdings");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("pie");
  const [expandedSymbols, setExpandedSymbols] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    Promise.all([api.getHoldings(), api.getAccounts()])
      .then(([holdingsRes, accountsRes]) => {
        setHoldings(parseHoldings(holdingsRes.holdings));
        const names = new Map<string, string>();
        for (const a of accountsRes.accounts) {
          names.set(
            String(a.accountId),
            String(a.displayName ?? a.accountId)
          );
        }
        setAccountNames(names);
      })
      .catch(() => {
        setHoldings([]);
        setAccountNames(new Map());
      })
      .finally(() => setLoading(false));
  }, []);

  const groupedByAccount = useMemo(
    () => groupHoldingsByAccount(holdings),
    [holdings]
  );
  const groupedBySymbol = useMemo(
    () => groupHoldingsBySymbol(holdings),
    [holdings]
  );
  const totalValue = useMemo(() => holdingsTotalValue(holdings), [holdings]);

  const accountSections = useMemo(() => {
    return [...groupedByAccount.entries()].sort((a, b) => {
      const nameA = accountNames.get(a[0]) ?? a[0];
      const nameB = accountNames.get(b[0]) ?? b[0];
      return nameA.localeCompare(nameB);
    });
  }, [groupedByAccount, accountNames]);

  const allocationSlices = useMemo(() => {
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
  }, [groupMode, groupedBySymbol, accountSections, accountNames, totalValue]);

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
              {formatCurrency(totalValue)}
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
        <AllocationView slices={allocationSlices} chartStyle={chartStyle} />
      ) : groupMode === "symbol" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              All investments
            </CardTitle>
            <Badge variant="secondary" className="tabular-nums">
              {formatCurrency(totalValue)}
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
                    {formatCurrency(accountTotal)}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountHoldings.map((h) => (
                        <HoldingRow key={h.holdingId} holding={h} />
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
