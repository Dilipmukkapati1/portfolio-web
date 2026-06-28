"use client";

import { Link2, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccountsTab = "accounts" | "connections";

export const ACCOUNTS_TABS: Array<{ id: AccountsTab; label: string; icon: LucideIcon }> = [
  { id: "accounts", label: "Accounts", icon: Wallet },
  { id: "connections", label: "Connections", icon: Link2 },
];

export function AccountsSectionTabs({
  active,
  onChange,
  className,
}: {
  active: AccountsTab;
  onChange: (tab: AccountsTab) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex gap-1 rounded-lg border border-border bg-muted/30 p-1", className)}
      role="tablist"
      aria-label="Accounts sections"
    >
      {ACCOUNTS_TABS.map(({ id, label }) => {
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
