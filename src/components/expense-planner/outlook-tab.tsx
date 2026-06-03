"use client";

import { useMemo, useState } from "react";
import type { TransactionCategory } from "@portfolio/contracts";
import {
  categoryOutlook,
  monthlyBudgetTotal,
  projectedMonthlyPace,
} from "@portfolio/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  mergeCategoryLabel,
  visibleCategoryPreferences,
} from "@/lib/expense-planner/categories";
import {
  monthsInRange,
  OUTLOOK_OPTIONS,
  outlookRange,
  type OutlookPreset,
  toIsoDate,
} from "@/lib/expense-planner/date-ranges";
import { ExpenseOutlookChart } from "./expense-outlook-chart";
import type { useExpensePlanner } from "@/hooks/use-expense-planner";

type PlannerState = ReturnType<typeof useExpensePlanner>;

export function OutlookTab({ state }: { state: PlannerState }) {
  const [outlookPreset, setOutlookPreset] = useState<OutlookPreset>("next-3-months");
  const [outlookCustomStart, setOutlookCustomStart] = useState(() =>
    toIsoDate(new Date())
  );
  const [outlookCustomEnd, setOutlookCustomEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return toIsoDate(d);
  });
  const [outlookCategory, setOutlookCategory] = useState<TransactionCategory | "all">(
    "all"
  );

  const categories = state.plan?.categories ?? [];
  const visible = visibleCategoryPreferences(categories);
  const outlookPeriod = outlookRange(
    outlookPreset,
    outlookCustomStart,
    outlookCustomEnd
  );
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();

  const currentSpend =
    outlookCategory === "all"
      ? state.currentMonthSummary?.totalSpend ?? 0
      : state.currentMonthSummary?.spendByCategory?.[outlookCategory] ?? 0;

  const monthlyPace = projectedMonthlyPace(currentSpend, dayOfMonth, daysInMonth);
  const monthlyBudget =
    outlookCategory === "all"
      ? monthlyBudgetTotal(categories)
      : categories.find((c) => c.category === outlookCategory)?.monthlyBudget ?? 0;

  const outlook = categoryOutlook({
    monthlyPace,
    monthCount: outlookPeriod.monthCount,
    monthlyBudget,
    actualInPeriod: state.summary?.totalSpend ?? 0,
  });

  const chartData = useMemo(() => {
    const monthDates = monthsInRange(outlookPeriod.start, outlookPeriod.end);
    return {
      labels: monthDates.map((d) =>
        d.toLocaleString("en-US", { month: "short", year: "2-digit" })
      ),
      projected: monthDates.map(() => Math.round(monthlyPace)),
      actual: monthDates.map((d) => {
        const isFuture = d > now;
        if (isFuture) return 0;
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          return Math.round(currentSpend);
        }
        return 0;
      }),
    };
  }, [outlookPeriod, monthlyPace, currentSpend, now]);

  const deltaText =
    outlook.delta > 0
      ? `+${formatCurrency(outlook.delta, { decimals: 0 })} over`
      : outlook.delta < 0
        ? `${formatCurrency(Math.abs(outlook.delta), { decimals: 0 })} under`
        : "On plan";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select
            value={outlookPreset}
            onValueChange={(v) => setOutlookPreset(v as OutlookPreset)}
          >
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OUTLOOK_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={outlookCategory}
            onValueChange={(v) =>
              setOutlookCategory(v as TransactionCategory | "all")
            }
          >
            <SelectTrigger className="min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {visible.map((c) => (
                <SelectItem key={c.category} value={c.category}>
                  {mergeCategoryLabel(c.category, categories)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {outlookPreset === "custom" && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={outlookCustomStart}
              onChange={(e) => setOutlookCustomStart(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
            <input
              type="date"
              value={outlookCustomEnd}
              onChange={(e) => setOutlookCustomEnd(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Outlook: {outlookPeriod.label} · {outlookPeriod.monthCount} month
          {outlookPeriod.monthCount === 1 ? "" : "s"}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Expected spend extrapolates current pace (day {dayOfMonth} of {daysInMonth}) across
        the selected outlook period.
      </p>

      <div className="overflow-x-auto text-sm">
        <div className="flex w-max items-center gap-2">
          <span className="text-muted-foreground">Expected</span>
          <span className="font-semibold">
            {formatCurrency(outlook.projected, { decimals: 0 })}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">Planned</span>
          <span className="font-semibold">
            {formatCurrency(outlook.budget, { decimals: 0 })}
          </span>
          <Badge variant={outlook.delta > 0 ? "destructive" : "secondary"}>{deltaText}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseOutlookChart
            labels={chartData.labels}
            actual={chartData.actual}
            projected={chartData.projected}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Run rate {formatCurrency(monthlyPace, { decimals: 0 })}/mo
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Category runway ({outlookPeriod.label})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {visible
            .filter((c) => c.monthlyBudget > 0)
            .slice(0, 8)
            .map((cat) => {
              const catSpend =
                state.currentMonthSummary?.spendByCategory?.[cat.category] ?? 0;
              const pace = projectedMonthlyPace(catSpend, dayOfMonth, daysInMonth);
              const projected = pace * outlookPeriod.monthCount;
              const budget = cat.monthlyBudget * outlookPeriod.monthCount;
              const pct = budget > 0 ? (projected / budget) * 100 : 0;
              return (
                <div key={cat.category} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {mergeCategoryLabel(cat.category, categories)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expected {formatCurrency(projected, { decimals: 0 })} · Budget{" "}
                      {formatCurrency(budget, { decimals: 0 })}
                    </p>
                  </div>
                  <Badge
                    variant={pct >= 100 ? "destructive" : pct >= 85 ? "outline" : "secondary"}
                  >
                    {formatPercent(pct, 0)}
                  </Badge>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
