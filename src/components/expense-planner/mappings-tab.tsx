"use client";

import { useState } from "react";
import type { ExpenseMappingRule } from "@portfolio/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { planBudgetCategories } from "@portfolio/contracts";
import {
  ExpenseAccountFilter,
  expenseAccountLabel,
} from "@/components/expense-planner/expense-account-filter";
import { useExpenseAccounts } from "@/hooks/use-expense-accounts";
import { MappingRuleForm } from "./mapping-rule-form";
import { MappingRuleList } from "./mapping-rule-list";
import { MappingTransactionsList } from "./mapping-transactions-list";
import type { useExpensePlanner } from "@/hooks/use-expense-planner";

type PlannerState = ReturnType<typeof useExpensePlanner>;

export function MappingsTab({ state }: { state: PlannerState }) {
  const { accounts } = useExpenseAccounts();
  const accountLabel = expenseAccountLabel(accounts, state.selectedAccountId);
  const categories = state.plan?.categories ?? [];
  const expenseCategories = planBudgetCategories(categories);
  const rules = state.plan?.mappingRules ?? [];
  const [editingRule, setEditingRule] = useState<ExpenseMappingRule | null>(null);
  const [showRules, setShowRules] = useState(rules.length === 0);

  const saveRule = (rule: ExpenseMappingRule) => {
    const exists = rules.some((r) => r.id === rule.id);
    const next = exists
      ? rules.map((r) => (r.id === rule.id ? rule : r))
      : [...rules, rule];
    state.updateMappingRules(next);
    setEditingRule(null);
    setShowRules(true);
  };

  const deleteRule = (id: string) => {
    state.updateMappingRules(rules.filter((r) => r.id !== id));
    if (editingRule?.id === id) setEditingRule(null);
  };

  const unmappedCount = state.unmappedTransactions.length;
  const unmappedAmount = state.unmappedTransactions.reduce(
    (s, t) => s + Math.abs(Number(t.amount) || 0),
    0
  );

  return (
    <div className="space-y-4">
      {unmappedCount > 0 && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
          <p className="font-medium">Needs mapping</p>
          <p className="mt-1 opacity-90">
            {unmappedCount} uncategorized transaction
            {unmappedCount === 1 ? "" : "s"}
            {state.valuesUnlocked && unmappedCount > 0
              ? ` (${formatCurrency(unmappedAmount, { decimals: 0 })})`
              : ""}
            .
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              Debit transactions · Page {state.mappingPageNumber}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <ExpenseAccountFilter
                accounts={accounts}
                value={state.selectedAccountId}
                onChange={state.setSelectedAccountId}
                disabled={state.mappingPageLoading || state.refreshing}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={state.applyingRules || rules.length === 0}
                onClick={() => void state.applyMappingRules()}
              >
                {state.applyingRules ? "Applying…" : "Apply all rules"}
              </Button>
            </div>
          </div>
          {accountLabel && (
            <p className="text-xs text-muted-foreground">Showing: {accountLabel}</p>
          )}
        </CardHeader>
        <CardContent>
          <MappingTransactionsList
            transactions={state.mappingTransactions}
            rules={rules}
            categories={expenseCategories}
            valuesUnlocked={state.mappingValuesUnlocked}
            categorizingTxnId={state.categorizingTxnId}
            pageNumber={state.mappingPageNumber}
            hasMore={state.mappingHasMore}
            pageLoading={state.mappingPageLoading}
            onPreviousPage={() =>
              void state.goToMappingPage(state.mappingPageIndex - 1)
            }
            onNextPage={() =>
              void state.goToMappingPage(state.mappingPageIndex + 1)
            }
            onApplyRule={(txnId, rule) =>
              void state.applyMappingRuleToTransaction(txnId, rule)
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">
              Mapping rules ({rules.length})
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRules((v) => !v)}
            >
              {showRules ? "Hide" : "Manage rules"}
            </Button>
          </div>
        </CardHeader>
        {showRules && (
          <CardContent className="space-y-4">
            <MappingRuleList
              rules={rules}
              categories={categories}
              editingId={editingRule?.id ?? null}
              onEdit={setEditingRule}
              onDelete={deleteRule}
            />
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium">
                {editingRule ? "Edit rule" : "New rule"}
              </p>
              <MappingRuleForm
                categories={categories}
                initialRule={editingRule}
                onSave={saveRule}
                onCancel={editingRule ? () => setEditingRule(null) : undefined}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
