"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxDisclaimer } from "@/components/TaxDisclaimer";

export default function DashboardPage() {
  const [netWorth, setNetWorth] = useState<Record<string, unknown> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getNetWorth()
      .then(setNetWorth)
      .catch((e) => setError(e.message));
  }, []);

  const summary = netWorth?.summary as Record<string, number> | null | undefined;
  const holdings = (netWorth?.holdings as Array<{ marketValue?: number; symbol?: string }>) ?? [];

  const allocationTotal = holdings.reduce(
    (s, h) => s + (h.marketValue ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>
      {error && (
        <p className="text-sm text-amber-400">
          API unavailable: {error}. Start portfolio-api locally.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Net worth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {summary
                ? formatCurrency(summary.netWorth ?? 0)
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Cash: {formatCurrency(summary?.cashBalance ?? 0)} · Investments:{" "}
              {formatCurrency(summary?.investmentValue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(summary?.totalAssets ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {holdings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Connect SnapTrade for holdings
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {holdings.map((h) => (
                  <li key={h.symbol} className="flex justify-between">
                    <span>{h.symbol}</span>
                    <span>
                      {allocationTotal > 0
                        ? `${(((h.marketValue ?? 0) / allocationTotal) * 100).toFixed(1)}%`
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <TaxDisclaimer />
    </div>
  );
}
