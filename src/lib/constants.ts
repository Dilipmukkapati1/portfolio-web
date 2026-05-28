export const APP_NAME = "Portfolio";
export const APP_DESCRIPTION = "Personal finance dashboard";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Analyzer", href: "/analyzer/NVDA", icon: "LineChart" },
  { label: "Architect", href: "/architect", icon: "PenTool" },
  { label: "Accounts", href: "/accounts", icon: "Wallet" },
  { label: "Holdings", href: "/holdings", icon: "TrendingUp" },
  { label: "Transactions", href: "/transactions", icon: "ArrowLeftRight" },
  { label: "Tax", href: "/tax", icon: "Calculator" },
  { label: "Connections", href: "/connections", icon: "Link" },
  { label: "Household", href: "/household", icon: "Users" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
] as const;
