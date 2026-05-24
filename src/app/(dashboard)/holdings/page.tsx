"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import {
  groupHoldingsByAccount,
  isCashHolding,
  parseHoldings,
  type HoldingRecord,
} from "@/lib/holdings";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function HoldingRow({ holding }: { holding: HoldingRecord }) {
  const value = holding.marketValue ?? holding.quantity * (holding.price ?? 0);
  const label = isCashHolding(holding)
    ? "Cash"
    : holding.description?.trim() || holding.symbol;

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{isCashHolding(holding) ? "Cash" : holding.symbol}</div>
        {!isCashHolding(holding) && holding.description && (
          <p className="text-xs text-muted-foreground truncate max-w-[240px]">
            {holding.description}
          </p>
        )}
        {isCashHolding(holding) && (
          <p className="text-xs text-muted-foreground">{label}</p>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {isCashHolding(holding) ? "—" : holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
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

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<HoldingRecord[]>([]);
  const [accountNames, setAccountNames] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

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

  const grouped = useMemo(() => groupHoldingsByAccount(holdings), [holdings]);
  const totalValue = useMemo(
    () => holdings.reduce((sum, h) => sum + (h.marketValue ?? 0), 0),
    [holdings]
  );

  const sections = useMemo(() => {
    return [...grouped.entries()].sort((a, b) => {
      const nameA = accountNames.get(a[0]) ?? a[0];
      const nameB = accountNames.get(b[0]) ?? b[0];
      return nameA.localeCompare(nameB);
    });
  }, [grouped, accountNames]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Holdings"
        description="Investment positions and cash from linked accounts"
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
      ) : (
        <div className="space-y-4">
          {sections.map(([accountId, accountHoldings]) => {
            const accountTotal = accountHoldings.reduce(
              (sum, h) => sum + (h.marketValue ?? 0),
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
