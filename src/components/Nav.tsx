"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/connections", label: "Connections" },
  { href: "/accounts", label: "Accounts" },
  { href: "/transactions", label: "Transactions" },
  { href: "/holdings", label: "Holdings" },
  { href: "/tax", label: "Tax" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4 mb-8">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm transition-colors",
            pathname === link.href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
