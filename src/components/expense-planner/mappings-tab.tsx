"use client";

import { useState } from "react";
import type { ExpenseMappingRule } from "@portfolio/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { MappingRuleForm } from "./mapping-rule-form";
import { MappingRuleList } from "./mapping-rule-list";
import { UnmappedTransactionsList } from "./unmapped-transactions-list";
import type { useExpensePlanner } from "@/hooks/use-expense-planner";

type PlannerState = ReturnType<typeof useExpensePlanner>;

export function MappingsTab({ state }: { state: PlannerState }) {
  const categories = state.plan?.categories ?? [];
  const rules = state.plan?.mappingRules ?? [];
  const [editingRule, setEditingRule] = useState<ExpenseMappingRule | null>(null);

  const saveRule = (rule: ExpenseMappingRule) => {
    const exists = rules.some((r) => r.id === rule.id);
    const next = exists
      ? rules.map((r) => (r.id === rule.id ? rule : r))
      : [...rules, rule];
    state.updateMappingRules(next);
    setEditingRule(null);
  };

  const deleteRule = (id: string) => {
    state.updateMappingRules(rules.filter((r) => r.id !== id));
    if (editingRule?.id === id) setEditingRule(null);
  };

  const unmappedAmount = state.unmappedTransactions.reduce(
    (s, t) => s + Math.abs(t.amount),
    0
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Label transactions by merchant name or payment type so past and future imports
        group correctly in Overview.
      </p>

      {state.unmappedTransactions.length > 0 && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
          <p className="font-medium">Needs mapping</p>
          <p className="mt-1 opacity-90">
            {state.unmappedTransactions.length} transaction
            {state.unmappedTransactions.length === 1 ? "" : "s"} in {state.range.label} (
            {state.valuesUnlocked
              ? formatCurrency(unmappedAmount, { decimals: 0 })
              : "unlock to view"}
            ).
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mapping rules ({rules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <MappingRuleList
            rules={rules}
            categories={categories}
            editingId={editingRule?.id ?? null}
            onEdit={setEditingRule}
            onDelete={deleteRule}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {editingRule ? "Edit rule" : "New rule"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MappingRuleForm
            categories={categories}
            initialRule={editingRule}
            onSave={saveRule}
            onCancel={editingRule ? () => setEditingRule(null) : undefined}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Bulk actions</CardTitle>
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
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Unmapped transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <UnmappedTransactionsList
            transactions={state.unmappedTransactions}
            categories={categories}
            valuesUnlocked={state.valuesUnlocked}
            categorizingTxnId={state.categorizingTxnId}
            onAssign={(txnId, category) => void state.categorizeTransaction(txnId, category)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
