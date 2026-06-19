"use client";

import { LineChart, MessageSquare, PieChart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaxTab = "overview" | "plan" | "advisor";

export const TAX_TABS: Array<{ id: TaxTab; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: PieChart },
  { id: "plan", label: "Plan", icon: LineChart },
  { id: "advisor", label: "Advisor", icon: MessageSquare },
];

export function TaxSectionTabs({
  active,
  onChange,
  className,
}: {
  active: TaxTab;
  onChange: (tab: TaxTab) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex gap-1 rounded-lg border border-border bg-muted/30 p-1", className)}
      role="tablist"
      aria-label="Tax sections"
    >
      {TAX_TABS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
