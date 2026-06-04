"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  hasSpendData,
  topCategorySlices,
  type ExpenseSummaryView,
} from "@/lib/expense-planner/summary-display";
import { mergeCategoryLabel } from "@/lib/expense-planner/categories";
import type {
  ExpenseCategoryPreference,
  TransactionCategory,
} from "@portfolio/contracts";

export function SpendingSnapshot({
  summary,
  valuesUnlocked,
  rangeLabel,
  planCategories = [],
}: {
  summary: ExpenseSummaryView | null;
  valuesUnlocked: boolean;
  rangeLabel: string;
  planCategories?: ExpenseCategoryPreference[];
}) {
  const top = topCategorySlices(summary, valuesUnlocked, 4);
  const txnCount = summary?.transactionCount ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Synced spending</CardTitle>
          <p className="text-xs text-muted-foreground">{rangeLabel} · bank transactions</p>
        </div>
        <Button variant="link" size="sm" className="h-auto px-0" asChild>
          <Link href="/expense-planner">Expense Planner</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasSpendData(summary) ? (
          <p className="text-sm text-muted-foreground">
            No transactions in this period. Connect SimpleFIN under Connections and sync
            accounts to include spending here.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-2xl font-semibold tabular-nums">
                {valuesUnlocked
                  ? formatCurrency(summary?.totalSpend ?? 0, { decimals: 0 })
                  : "Unlock amounts"}
              </p>
              <p className="text-sm text-muted-foreground">
                {txnCount} transaction{txnCount === 1 ? "" : "s"}
              </p>
            </div>
            <ul className="space-y-2">
              {top.map((row) => (
                <li
                  key={row.category}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {mergeCategoryLabel(
                      row.category as TransactionCategory,
                      planCategories
                    )}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {valuesUnlocked
                      ? formatCurrency(row.value, { decimals: 0 })
                      : formatPercent(row.value, 0)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
