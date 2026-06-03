"use client";

import type { Transaction, TransactionCategory } from "@portfolio/contracts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { mergeCategoryLabel } from "@/lib/expense-planner/categories";
import type { ExpenseCategoryPreference } from "@portfolio/contracts";

export function UnmappedTransactionsList({
  transactions,
  categories,
  valuesUnlocked,
  categorizingTxnId,
  onAssign,
}: {
  transactions: Transaction[];
  categories: ExpenseCategoryPreference[];
  valuesUnlocked: boolean;
  categorizingTxnId?: string | null;
  onAssign: (txnId: string, category: TransactionCategory) => void;
}) {
  const visible = categories.filter((c) => !c.hidden);

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        All transactions in this period are categorized.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {transactions.map((t) => {
        const isCategorizing = categorizingTxnId === t.txnId;
        return (
        <li key={t.txnId} className="space-y-2 py-3 first:pt-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.merchant ?? t.description}</p>
              <p className="text-xs text-muted-foreground">
                {t.date} · {t.accountName ?? t.accountId}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium">
              {valuesUnlocked
                ? formatCurrency(Math.abs(t.amount))
                : "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {visible.slice(0, 4).map((cat) => (
              <Button
                key={cat.category}
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 text-xs"
                disabled={isCategorizing}
                onClick={() => onAssign(t.txnId, cat.category)}
              >
                {mergeCategoryLabel(cat.category, categories).split(" ")[0]}
              </Button>
            ))}
            <Select
              disabled={isCategorizing}
              onValueChange={(v) => onAssign(t.txnId, v as TransactionCategory)}
            >
              <SelectTrigger className="h-7 w-[100px] text-xs">
                <SelectValue placeholder="More…" />
              </SelectTrigger>
              <SelectContent>
                {visible.map((c) => (
                  <SelectItem key={c.category} value={c.category}>
                    {mergeCategoryLabel(c.category, categories)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </li>
        );
      })}
    </ul>
  );
}
