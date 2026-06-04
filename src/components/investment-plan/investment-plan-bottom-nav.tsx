"use client";

import { LineChart, ListTodo, PieChart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type InvestmentPlanTab = "allocation" | "plan" | "outlook";

type TabConfig = {
  id: InvestmentPlanTab;
  label: string;
  icon: LucideIcon;
  ariaLabel: string;
};

const TABS: TabConfig[] = [
  {
    id: "allocation",
    label: "Overview",
    icon: PieChart,
    ariaLabel: "Overview: plan execution outlook and allocation by asset class",
  },
  {
    id: "plan",
    label: "Plan",
    icon: ListTodo,
    ariaLabel: "Plan by instrument",
  },
  {
    id: "outlook",
    label: "Outlook",
    icon: LineChart,
    ariaLabel: "Portfolio outlook",
  },
];

export function InvestmentPlanBottomNav({
  active,
  onChange,
}: {
  active: InvestmentPlanTab;
  onChange: (tab: InvestmentPlanTab) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:hidden"
      role="tablist"
      aria-label="Investment plan sections"
    >
      <div className="mx-auto grid max-w-[1080px] grid-cols-3">
        {TABS.map(({ id, label, icon: Icon, ariaLabel }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={ariaLabel}
              onClick={() => onChange(id)}
              className={cn(
                "relative flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                  aria-hidden
                />
              )}
              <Icon
                className={cn("h-5 w-5 shrink-0", isActive && "stroke-[2.25]")}
                aria-hidden
              />
              <span className="leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
