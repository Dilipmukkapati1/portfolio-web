"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Home,
  Layers,
  LineChart,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/holdings", label: "Sectors", icon: Layers },
  { href: "/analyzer/NVDA", label: "Analyzer", icon: LineChart },
  { href: "/accounts", label: "Portfolio", icon: Wallet },
  { href: "/connections", label: "Discovery", icon: Compass },
] as const;

export function AnalyzerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-[#0a0e1b]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden">
      <ul className="mx-auto flex max-w-lg items-center justify-between">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith("/analyzer")
            ? tab.href.startsWith("/analyzer")
            : tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);

          return (
            <li key={tab.href} className="relative">
              {active && tab.href.startsWith("/analyzer") ? (
                <span className="absolute -top-2 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-sky-400" />
              ) : null}
              <Link
                href={tab.href}
                className={cn(
                  "flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium",
                  active ? "text-sky-400" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-sky-400")} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
