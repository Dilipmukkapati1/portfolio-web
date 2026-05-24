import {
  ArrowLeftRight,
  Calculator,
  Home,
  Landmark,
  LayoutDashboard,
  Link2,
  PieChart,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navLinks: NavLink[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/household", label: "Household", icon: Home },
  { href: "/onboarding", label: "Onboarding", icon: Rocket },
  { href: "/connections", label: "Connections", icon: Link2 },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/holdings", label: "Holdings", icon: PieChart },
  { href: "/tax", label: "Tax", icon: Calculator },
];
