"use client";

import { LayoutDashboard, MessageSquare, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type HouseholdTab = "overview" | "members" | "chat";

export const HOUSEHOLD_TABS: Array<{
  id: HouseholdTab;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

export function HouseholdSectionTabs({
  active,
  onChange,
  className,
}: {
  active: HouseholdTab;
  onChange: (tab: HouseholdTab) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-lg border border-border bg-muted/30 p-1",
        className
      )}
      role="tablist"
      aria-label="Household sections"
    >
      {HOUSEHOLD_TABS.map(({ id, label }) => {
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
