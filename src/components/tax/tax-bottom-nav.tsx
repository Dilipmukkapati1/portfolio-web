"use client";

import { LineChart, PieChart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaxTab = "overview" | "plan";

const TABS: Array<{ id: TaxTab; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: PieChart },
  { id: "plan", label: "Plan", icon: LineChart },
];

export function TaxBottomNav({
  active,
  onChange,
}: {
  active: TaxTab;
  onChange: (tab: TaxTab) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:hidden"
      role="tablist"
      aria-label="Tax sections"
    >
      <div className="mx-auto grid max-w-[1080px] grid-cols-2">
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
                "relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
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
