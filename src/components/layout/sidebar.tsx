"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, TrendingUp } from "lucide-react";
import { ADMIN_NAV_ITEMS, APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { getNavIcon } from "@/lib/nav-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/shared/user-nav";
import { PrivacyToggle } from "@/components/PrivacyProvider";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  admin?: boolean;
}

export function Sidebar({ collapsed = false, onToggle, admin }: SidebarProps) {
  const pathname = usePathname();
  const items = admin ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300 lg:flex",
        collapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border px-3",
          collapsed && "justify-center"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <p className="truncate text-sm font-semibold">{APP_NAME}</p>
            {admin && <p className="text-xs text-destructive">Admin</p>}
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {items.map((item) => {
          const Icon = getNavIcon(item.icon);
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border p-2">
        {!collapsed && <PrivacyToggle />}
        {!collapsed && <UserNav />}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full", collapsed && "px-0")}
            onClick={onToggle}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        )}
      </div>
    </aside>
  );
}
