"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/shared/empty-state";
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
import { api } from "@/lib/api";
import {
  parseTransactions,
  transactionCategoryLabel,
  type TransactionRecord,
} from "@/lib/transactions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTransactions()
      .then((res) => setTransactions(parseTransactions(res.transactions)))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader title="Transactions" description="Recent account activity" />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading transactions…</p>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions found"
          description="Connect a bank account and sync from Connections to see recent activity."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border"
        >
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
              {transactions.map((t) => (
                <TableRow key={t.txnId}>
                  <TableCell>{formatDate(t.date)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{t.description}</div>
                    {t.pending && (
                      <p className="text-xs text-muted-foreground">Pending</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {transactionCategoryLabel(t.category)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${
                      t.amount >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </motion.div>
  );
}
