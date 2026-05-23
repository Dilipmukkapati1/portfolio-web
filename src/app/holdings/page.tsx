"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.getHoldings().then((r) => setHoldings(r.holdings));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Holdings</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">Symbol</th>
              <th className="text-right p-3">Qty</th>
              <th className="text-right p-3">Price</th>
              <th className="text-right p-3">Value</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-muted-foreground">
                  No holdings. Connect SnapTrade.
                </td>
              </tr>
            ) : (
              holdings.map((h) => (
                <tr key={String(h.holdingId)} className="border-t border-border">
                  <td className="p-3 font-medium">{String(h.symbol)}</td>
                  <td className="p-3 text-right">{Number(h.quantity)}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(h.price) || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(Number(h.marketValue) || 0)}
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
