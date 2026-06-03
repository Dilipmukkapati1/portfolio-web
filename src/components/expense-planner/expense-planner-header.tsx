"use client";

import { Badge } from "@/components/ui/badge";

export function ExpensePlannerHeader() {
  return (
    <div className="border-b border-border pb-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Expense Planner
        </h1>
        <Badge variant="secondary" className="ml-auto shrink-0">
          All accounts
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Banks, credit cards, and cash
      </p>
    </div>
  );
}
