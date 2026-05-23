"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<
    Array<Record<string, unknown>>
  >([]);

  useEffect(() => {
    api.getTransactions({ limit: "100" }).then((r) =>
      setTransactions(r.transactions)
    );
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Transactions</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3">Category</th>
              <th className="text-right p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-muted-foreground">
                  No transactions. Connect SimpleFIN and sync.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={String(t.txnId)} className="border-t border-border">
                  <td className="p-3">{String(t.date)}</td>
                  <td className="p-3">{String(t.description)}</td>
                  <td className="p-3">{String(t.category)}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(t.amount))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
