"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Calculator,
  Link as LinkIcon,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOCK_STATS = {
  netWorth: 284_520,
  accounts: 6,
  transactions: 142,
};

const quickLinks = [
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/holdings", label: "Holdings", icon: TrendingUp },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/tax", label: "Tax", icon: Calculator },
  { href: "/connections", label: "Connections", icon: LinkIcon },
];

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <PageHeader
        title="Dashboard"
        description="Welcome back — here's your portfolio at a glance."
      />

      <motion.div
        className="grid gap-4 md:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <StatCard
          title="Net worth"
          value={formatCurrency(MOCK_STATS.netWorth)}
          description="Placeholder until API is connected"
          icon={TrendingUp}
        />
        <StatCard
          title="Accounts"
          value={String(MOCK_STATS.accounts)}
          description="Linked financial accounts"
          icon={Wallet}
        />
        <StatCard
          title="Recent transactions"
          value={String(MOCK_STATS.transactions)}
          description="Last 30 days"
          icon={ArrowLeftRight}
        />
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <link.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
