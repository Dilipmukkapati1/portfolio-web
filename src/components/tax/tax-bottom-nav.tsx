"use client";

import { TAX_TABS, type TaxTab } from "./tax-section-tabs";
import { cn } from "@/lib/utils";

export type { TaxTab };

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
      <div className={cn("mx-auto grid max-w-[1080px]", `grid-cols-${TAX_TABS.length}`)}
        style={{ gridTemplateColumns: `repeat(${TAX_TABS.length}, minmax(0, 1fr))` }}
      >
        {TAX_TABS.map(({ id, label, icon: Icon }) => {
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
