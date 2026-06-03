"use client";

import { LineChart, ListTodo, PieChart, Tags, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExpensePlannerTab = "overview" | "plan" | "outlook" | "mappings";

type TabConfig = {
  id: ExpensePlannerTab;
  label: string;
  icon: LucideIcon;
};

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview", icon: PieChart },
  { id: "plan", label: "Plan", icon: ListTodo },
  { id: "outlook", label: "Outlook", icon: LineChart },
  { id: "mappings", label: "Mappings", icon: Tags },
];

export function ExpensePlannerBottomNav({
  active,
  onChange,
}: {
  active: ExpensePlannerTab;
  onChange: (tab: ExpensePlannerTab) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:hidden"
      role="tablist"
      aria-label="Expense planner sections"
    >
      <div className="mx-auto grid max-w-[1080px] grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              className={cn(
                "relative flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span
                  className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-primary"
                  aria-hidden
                />
              )}
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "stroke-[2.25]")} />
              <span className="leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
