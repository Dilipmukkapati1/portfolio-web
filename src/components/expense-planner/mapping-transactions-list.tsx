"use client";

import { useMemo, useState } from "react";
import type {
  ExpenseCategoryPreference,
  ExpenseMappingRule,
  TransactionCategory,
} from "@portfolio/contracts";
import { matchRule } from "@portfolio/contracts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePrivacy } from "@/components/PrivacyProvider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mergeCategoryLabel } from "@/lib/expense-planner/categories";
import type { TransactionRecord } from "@/lib/transactions";
import { cn, formatCurrency } from "@/lib/utils";

function ruleLabel(rule: ExpenseMappingRule, categories: ExpenseCategoryPreference[]) {
  const cat = mergeCategoryLabel(rule.category, categories);
  return `${rule.pattern} → ${cat}`;
}

function suggestedRule(
  txn: TransactionRecord,
  rules: ExpenseMappingRule[]
): ExpenseMappingRule | null {
  const sorted = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const rule of sorted) {
    if (
      matchRule(
        {
          description: txn.description,
          category: txn.category as TransactionCategory,
        },
        rule
      )
    ) {
      return rule;
    }
  }
  return null;
}

function displayAmount(txn: TransactionRecord, unlocked: boolean): string {
  if (!unlocked) return "—";
  if (txn.amount == null) return "—";
  const amount = Number(txn.amount);
  if (!Number.isFinite(amount)) return "—";
  return formatCurrency(Math.abs(amount));
}

export function MappingTransactionsList({
  transactions,
  rules,
  categories,
  valuesUnlocked,
  categorizingTxnId,
  pageNumber,
  hasMore,
  pageLoading,
  onPreviousPage,
  onNextPage,
  onApplyRule,
}: {
  transactions: TransactionRecord[];
  rules: ExpenseMappingRule[];
  categories: ExpenseCategoryPreference[];
  valuesUnlocked: boolean;
  categorizingTxnId?: string | null;
  pageNumber: number;
  hasMore: boolean;
  pageLoading: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onApplyRule: (txnId: string, rule: ExpenseMappingRule) => void;
}) {
  const { isUnlocked, showUnlockDialog } = usePrivacy();
  const [selectedRules, setSelectedRules] = useState<Record<string, string>>({});
  const showAmounts = isUnlocked && valuesUnlocked;

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aUncat = a.category === "uncategorized" ? 0 : 1;
      const bUncat = b.category === "uncategorized" ? 0 : 1;
      if (aUncat !== bUncat) return aUncat - bUncat;
      return b.date.localeCompare(a.date);
    });
  }, [transactions]);

  if (rules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create at least one mapping rule below, then assign rules to each transaction.
      </p>
    );
  }

  if (sorted.length === 0 && !pageLoading) {
    return (
      <p className="text-sm text-muted-foreground">No expense debits found.</p>
    );
  }

  return (
    <div className="space-y-3">
      {!isUnlocked && (
        <p className="text-xs text-muted-foreground">
          <button
            type="button"
            className="text-primary underline-offset-2 hover:underline"
            onClick={showUnlockDialog}
          >
            Unlock privacy
          </button>{" "}
          to view transaction amounts.
        </p>
      )}

      <ul className={cn("divide-y divide-border", pageLoading && "pointer-events-none opacity-60")}>
        {sorted.map((t) => {
          const isCategorizing = categorizingTxnId === t.txnId;
          const hint = suggestedRule(t, rules);
          const selectedId = selectedRules[t.txnId] ?? hint?.id ?? "";

          return (
            <li key={t.txnId} className="space-y-2 py-3 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.date} · {t.accountId}
                    {t.category !== "uncategorized" && (
                      <> · {mergeCategoryLabel(t.category as TransactionCategory, categories)}</>
                    )}
                  </p>
                  {hint && !selectedRules[t.txnId] && (
                    <p className="mt-1 text-xs text-primary">
                      Suggested: {ruleLabel(hint, categories)}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums">
                  {displayAmount(t, showAmounts)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedId}
                  disabled={isCategorizing}
                  onValueChange={(ruleId) =>
                    setSelectedRules((prev) => ({ ...prev, [t.txnId]: ruleId }))
                  }
                >
                  <SelectTrigger className="h-8 min-w-[180px] flex-1 text-xs sm:max-w-md">
                    <SelectValue placeholder="Choose mapping rule…" />
                  </SelectTrigger>
                  <SelectContent>
                    {rules.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {ruleLabel(rule, categories)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  disabled={!selectedId || isCategorizing}
                  onClick={() => {
                    const rule = rules.find((r) => r.id === selectedId);
                    if (rule) onApplyRule(t.txnId, rule);
                  }}
                >
                  {isCategorizing ? "Applying…" : "Apply rule"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-sm text-muted-foreground">
          {sorted.length} on this page · Page {pageNumber}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={pageNumber <= 1 || pageLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasMore || pageLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
