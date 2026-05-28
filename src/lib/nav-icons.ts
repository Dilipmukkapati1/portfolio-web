import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Calculator,
  LayoutDashboard,
  Link,
  PenTool,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { NAV_ITEMS } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  PenTool,
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  Calculator,
  Link,
  Users,
  Settings,
};

export function getNavIcon(name: string): LucideIcon {
  return iconMap[name] ?? LayoutDashboard;
}

export type NavItem = (typeof NAV_ITEMS)[number];
