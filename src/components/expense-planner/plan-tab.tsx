"use client";

import type { ExpenseCategoryPreference, TransactionCategory } from "@portfolio/contracts";
import { monthlyBudgetTotal } from "@portfolio/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency } from "@/lib/utils";
import {
  hiddenCategoryPreferences,
  mergeCategoryLabel,
  visibleCategoryPreferences,
} from "@/lib/expense-planner/categories";
import type { useExpensePlanner } from "@/hooks/use-expense-planner";

type PlannerState = ReturnType<typeof useExpensePlanner>;

export function PlanTab({ state }: { state: PlannerState }) {
  const categories = state.plan?.categories ?? [];
  const visible = visibleCategoryPreferences(categories);
  const hidden = hiddenCategoryPreferences(categories);
  const monthlyTotal = monthlyBudgetTotal(categories);

  const updateCategory = (
    category: TransactionCategory,
    patch: Partial<ExpenseCategoryPreference>
  ) => {
    const next = categories.map((c) =>
      c.category === category ? { ...c, ...patch } : c
    );
    state.updateCategories(next);
  };

  const unhideCategory = (category: TransactionCategory) => {
    updateCategory(category, { hidden: false });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set monthly budgets by category. Totals roll up across checking, credit, and cash.
      </p>
      <StatCard
        title="Monthly budget (all categories)"
        value={formatCurrency(monthlyTotal, { decimals: 0 })}
      />
      {hidden.length > 0 && (
        <div className="flex items-center gap-2">
          <Select onValueChange={(v) => unhideCategory(v as TransactionCategory)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add category…" />
            </SelectTrigger>
            <SelectContent>
              {hidden.map((c) => (
                <SelectItem key={c.category} value={c.category}>
                  {mergeCategoryLabel(c.category, categories)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Category budgets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {visible.map((cat) => (
            <div
              key={cat.category}
              className="flex flex-wrap items-center gap-2 border-b border-border py-3 last:border-0"
            >
              <Input
                value={cat.label ?? mergeCategoryLabel(cat.category, categories)}
                onChange={(e) => updateCategory(cat.category, { label: e.target.value })}
                className="min-w-0 flex-1"
              />
              <Input
                type="number"
                min={0}
                value={cat.monthlyBudget}
                onChange={(e) => {
                  const n = Number.parseFloat(e.target.value);
                  if (Number.isFinite(n) && n >= 0) {
                    updateCategory(cat.category, { monthlyBudget: n });
                  }
                }}
                className="w-24 text-right"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateCategory(cat.category, { hidden: true })}
              >
                Hide
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      {state.saving && (
        <p className="text-xs text-muted-foreground">Saving…</p>
      )}
      {state.saveError && (
        <p className="text-sm text-destructive">{state.saveError}</p>
      )}
    </div>
  );
}
