"use client";

import { useMemo } from "react";
import type {
  ExpenseBudgetAllocationMode,
  ExpenseCategoryPreference,
  ExpensePlan,
  TransactionCategory,
} from "@portfolio/contracts";
import {
  allocatedBudgetPercent,
  allocatedBudgetTotal,
  applyDollarToCategory,
  applyPercentToCategory,
  budgetForDuration,
  categoryBudgetPercent,
  effectiveCategoryBudget,
  optionalHiddenPlanCategories,
  planBudgetCategories,
  syncCategoryBudgetsFromPercents,
} from "@portfolio/contracts";
import { usePrivacy } from "@/components/PrivacyProvider";
import { mergeCategoryLabel } from "@/lib/expense-planner/categories";
import { useHouseholdOverview } from "@/hooks/use-household-overview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categorySpendSlice } from "@/lib/expense-planner/summary-display";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { useExpensePlanner } from "@/hooks/use-expense-planner";

type PlannerState = ReturnType<typeof useExpensePlanner>;

function ModeToggle({
  mode,
  onChange,
}: {
  mode: ExpenseBudgetAllocationMode;
  onChange: (mode: ExpenseBudgetAllocationMode) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
      {(["dollar", "percent"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={cn(
            "rounded px-2.5 py-1 font-medium transition-colors",
            mode === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange(value)}
        >
          {value === "dollar" ? "$" : "%"}
        </button>
      ))}
    </div>
  );
}

export function PlanTab({ state }: { state: PlannerState }) {
  const { isUnlocked, showUnlockDialog } = usePrivacy();
  const { snapshot: incomeSnapshot } = useHouseholdOverview();
  const plan = state.plan;
  const categories = plan?.categories ?? [];
  const mode = plan?.budgetAllocationMode ?? "dollar";
  const monthlyTotal = plan?.monthlyExpenseTotal ?? 0;
  const rows = planBudgetCategories(categories);
  const optionalHidden = optionalHiddenPlanCategories(categories);
  const valuesUnlocked = state.valuesUnlocked;
  const totalSpend = state.summary?.totalSpend ?? 0;

  const allocated = useMemo(
    () => allocatedBudgetTotal(categories, monthlyTotal, mode),
    [categories, monthlyTotal, mode]
  );
  const allocatedPct = useMemo(
    () => allocatedBudgetPercent(categories, monthlyTotal, mode),
    [categories, monthlyTotal, mode]
  );
  const plannedMonthly = monthlyTotal > 0 ? monthlyTotal : allocated;
  const monthlyAfterTax = (incomeSnapshot?.incomeAfterTax ?? 0) / 12;
  const monthlySurplus = monthlyAfterTax - plannedMonthly;

  const budgetRange = budgetForDuration(state.duration, plannedMonthly);

  const patchPlan = (patch: Partial<ExpensePlan>) => {
    if (!plan) return;
    state.updatePlan({ ...plan, ...patch });
  };

  const patchCategories = (next: ExpenseCategoryPreference[]) => {
    state.updateCategories(next);
  };

  const updateCategory = (
    category: TransactionCategory,
    patch: Partial<ExpenseCategoryPreference>
  ) => {
    patchCategories(
      categories.map((c) => (c.category === category ? { ...c, ...patch } : c))
    );
  };

  const setMonthlyTotal = (value: number) => {
    const total = Math.max(0, value);
    let nextCategories = categories;
    if (mode === "percent" && total > 0) {
      nextCategories = syncCategoryBudgetsFromPercents(categories, total);
    }
    patchPlan({ monthlyExpenseTotal: total, categories: nextCategories });
  };

  const setMode = (nextMode: ExpenseBudgetAllocationMode) => {
    if (!plan) return;
    let nextCategories = categories;
    if (nextMode === "percent" && monthlyTotal > 0) {
      nextCategories = categories.map((c) =>
        applyPercentToCategory(
          c,
          categoryBudgetPercent(c, monthlyTotal),
          monthlyTotal
        )
      );
    }
    patchPlan({ budgetAllocationMode: nextMode, categories: nextCategories });
  };

  const setAllocation = (category: TransactionCategory, raw: string) => {
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) return;
    const current = categories.find((c) => c.category === category);
    if (!current) return;

    const next =
      mode === "percent"
        ? applyPercentToCategory(current, n, monthlyTotal)
        : applyDollarToCategory(current, n, monthlyTotal);

    updateCategory(category, next);
  };

  const addOptionalCategory = (category: TransactionCategory) => {
    updateCategory(category, { hidden: false });
  };

  const removeFromPlan = (category: TransactionCategory) => {
    updateCategory(category, { hidden: true, monthlyBudget: 0, budgetPercent: 0 });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Set monthly take-home income and expense targets. Income and transfers
        are tracked separately in transactions.
      </p>

      <Card>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Total monthly expense
            </span>
            <Input
              type="number"
              min={0}
              step={50}
              value={monthlyTotal || ""}
              placeholder="0"
              onChange={(e) => setMonthlyTotal(Number.parseFloat(e.target.value) || 0)}
              className="h-9"
            />
          </label>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Monthly after-tax income
            </span>
            {isUnlocked ? (
              <p className="flex h-9 items-center text-lg font-semibold tabular-nums">
                {formatCurrency(monthlyAfterTax, { decimals: 0 })}
              </p>
            ) : (
              <button
                type="button"
                className="flex h-9 items-center text-sm text-primary underline-offset-2 hover:underline"
                onClick={showUnlockDialog}
              >
                Unlock to view
              </button>
            )}
          </div>

          {isUnlocked && plannedMonthly > 0 && (
            <p
              className={cn(
                "text-sm sm:col-span-2",
                monthlySurplus >= 0 ? "text-emerald-600" : "text-destructive"
              )}
            >
              {monthlySurplus >= 0 ? "Surplus" : "Shortfall"} of{" "}
              {formatCurrency(Math.abs(monthlySurplus), { decimals: 0 })}/mo after
              planned expenses
            </p>
          )}

          <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
            <div className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">
                Allocate by
              </span>
              <ModeToggle mode={mode} onChange={setMode} />
            </div>
            {monthlyTotal > 0 && (
              <p className="text-xs text-muted-foreground">
                Allocated {formatCurrency(allocated, { decimals: 0 })}
                {mode === "percent" ? ` (${formatPercent(allocatedPct, 0)})` : ""}
              </p>
            )}
          </div>

          {valuesUnlocked && (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Spent {formatCurrency(totalSpend, { decimals: 0 })} in {state.range.label}
              {budgetRange > 0
                ? ` (${formatPercent((totalSpend / budgetRange) * 100, 0)} of range budget)`
                : ""}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-[1fr_5rem_6.5rem_2rem]">
            <span>Category</span>
            <span className="hidden text-right sm:block">Spent</span>
            <span className="text-right">{mode === "percent" ? "Plan %" : "Plan $"}</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {rows.map((cat) => {
              const spent = categorySpendSlice(
                state.summary,
                cat.category,
                valuesUnlocked
              );
              const budget = effectiveCategoryBudget(cat, monthlyTotal, mode);
              const allocValue =
                mode === "percent"
                  ? categoryBudgetPercent(cat, monthlyTotal)
                  : cat.monthlyBudget;
              const over = valuesUnlocked && budget > 0 && spent > budget;
              const isOptional = ["taxes", "fees", "uncategorized"].includes(
                cat.category
              );

              return (
                <li
                  key={cat.category}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-x-2 px-3 py-2 sm:grid-cols-[1fr_5rem_6.5rem_2rem]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {mergeCategoryLabel(cat.category, categories)}
                    </p>
                    <p className="text-[11px] text-muted-foreground sm:hidden">
                      {valuesUnlocked
                        ? `Spent ${formatCurrency(spent, { decimals: 0 })}`
                        : "Spent —"}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "hidden text-right text-sm tabular-nums sm:block",
                      over ? "font-medium text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {valuesUnlocked ? formatCurrency(spent, { decimals: 0 }) : "—"}
                  </p>
                  <Input
                    type="number"
                    min={0}
                    max={mode === "percent" ? 100 : undefined}
                    step={mode === "percent" ? 1 : 10}
                    value={allocValue || ""}
                    placeholder="0"
                    className="h-8 text-right text-sm tabular-nums"
                    onChange={(e) => setAllocation(cat.category, e.target.value)}
                  />
                  {isOptional ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => removeFromPlan(cat.category)}
                    >
                      ×
                    </Button>
                  ) : (
                    <span />
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {optionalHidden.length > 0 && (
        <Select onValueChange={(v) => addOptionalCategory(v as TransactionCategory)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Add category (taxes, fees…)" />
          </SelectTrigger>
          <SelectContent>
            {optionalHidden.map((c) => (
              <SelectItem key={c.category} value={c.category}>
                {mergeCategoryLabel(c.category, categories)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {state.saving && (
        <p className="text-xs text-muted-foreground">Saving…</p>
      )}
      {state.saveError && (
        <p className="text-sm text-destructive">{state.saveError}</p>
      )}
    </div>
  );
}
