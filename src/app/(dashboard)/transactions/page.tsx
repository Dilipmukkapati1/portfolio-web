"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MOCK_TRANSACTIONS = [
  { date: "2025-05-20", description: "Grocery Store", category: "Food", amount: -84.32 },
  { date: "2025-05-18", description: "Payroll Deposit", category: "Income", amount: 4200 },
  { date: "2025-05-15", description: "Electric Bill", category: "Utilities", amount: -112.5 },
];

export default function TransactionsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader title="Transactions" description="Recent account activity" />
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_TRANSACTIONS.map((t) => (
              <TableRow key={`${t.date}-${t.description}`}>
                <TableCell>{t.date}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{t.category}</Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    t.amount >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatCurrency(t.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
