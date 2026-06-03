"use client";

import { cn, formatCurrency, formatPercent } from "@/lib/utils";

export function BudgetUsageBar({
  spent,
  budget,
  valuesUnlocked,
}: {
  spent: number;
  budget: number;
  valuesUnlocked: boolean;
}) {
  const pct = budget > 0 ? Math.min(150, (spent / budget) * 100) : 0;
  const barPct = Math.min(pct, 100);

  const barColor =
    pct >= 100 ? "bg-destructive" : pct >= 90 ? "bg-yellow-500" : "bg-primary";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {formatPercent(Math.min(pct, 100), 0)}
          {valuesUnlocked && (
            <span className="ml-1 font-normal text-muted-foreground">
              · {formatCurrency(spent, { decimals: 0 })}
            </span>
          )}
        </span>
        {valuesUnlocked && budget > 0 && (
          <span className="text-muted-foreground">
            {formatCurrency(spent, { decimals: 0 })} / {formatCurrency(budget, { decimals: 0 })}
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${barPct}%` }} />
      </div>
      {pct > 100 && valuesUnlocked && (
        <p className="text-xs text-muted-foreground">
          +{formatPercent(pct - 100, 0)} · {formatCurrency(spent - budget, { decimals: 0 })} over plan
        </p>
      )}
    </div>
  );
}
