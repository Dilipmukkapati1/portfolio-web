"use client";

import { ACCOUNTS_TABS, type AccountsTab } from "./accounts-section-tabs";
import { cn } from "@/lib/utils";

export type { AccountsTab };

export function AccountsBottomNav({
  active,
  onChange,
}: {
  active: AccountsTab;
  onChange: (tab: AccountsTab) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:hidden"
      role="tablist"
      aria-label="Accounts sections"
    >
      <div
        className="mx-auto grid max-w-[1080px]"
        style={{ gridTemplateColumns: `repeat(${ACCOUNTS_TABS.length}, minmax(0, 1fr))` }}
      >
        {ACCOUNTS_TABS.map(({ id, label, icon: Icon }) => {
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
