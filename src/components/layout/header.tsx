"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/shared/user-nav";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 lg:hidden">
      <Button
        variant="outline"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title ?? "Portfolio"}</p>
      </div>
      <UserNav compact />
    </header>
  );
}
