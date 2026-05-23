"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxDisclaimer } from "@/components/TaxDisclaimer";

export default function TaxPage() {
  const [wages, setWages] = useState(85000);
  const [estimate, setEstimate] = useState<Record<string, unknown> | null>(
    null
  );
  const [strategies, setStrategies] = useState<Array<Record<string, unknown>>>(
    []
  );

  async function runEstimate() {
    const res = await api.taxEstimate({
      taxYear: 2025,
      filingStatus: "single",
      wages,
      selfEmploymentIncome: 0,
      interestIncome: 0,
      dividendIncome: 0,
      capitalGainsShort: 0,
      capitalGainsLong: 0,
      otherIncome: 0,
      adjustments: 0,
      dependents: 0,
      retirementContributions: 0,
      hsaContributions: 0,
    });
    setEstimate(res.estimate);
    const strat = await api.taxStrategies(wages);
    setStrategies(strat.strategies);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold">Tax estimate (2025)</h2>
      <TaxDisclaimer />
      <Card>
        <CardHeader>
          <CardTitle>Federal estimate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block text-sm">
            W-2 wages
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-border bg-muted px-3 py-2"
              value={wages}
              onChange={(e) => setWages(parseInt(e.target.value, 10))}
            />
          </label>
          <Button onClick={runEstimate}>Calculate</Button>
          {estimate && (
            <dl className="grid grid-cols-2 gap-2 text-sm mt-4">
              <dt className="text-muted-foreground">AGI</dt>
              <dd>{formatCurrency(Number(estimate.adjustedGrossIncome))}</dd>
              <dt className="text-muted-foreground">Taxable income</dt>
              <dd>{formatCurrency(Number(estimate.taxableIncome))}</dd>
              <dt className="text-muted-foreground">Federal tax</dt>
              <dd className="font-semibold">
                {formatCurrency(Number(estimate.federalTax))}
              </dd>
              <dt className="text-muted-foreground">Effective rate</dt>
              <dd>{(Number(estimate.effectiveRate) * 100).toFixed(2)}%</dd>
              <dt className="text-muted-foreground">Marginal rate</dt>
              <dd>{(Number(estimate.marginalRate) * 100).toFixed(0)}%</dd>
            </dl>
          )}
        </CardContent>
      </Card>
      {strategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Strategy ideas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategies.map((s) => (
              <div key={String(s.id)} className="border-b border-border pb-4">
                <h4 className="font-medium">{String(s.title)}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {String(s.description)}
                </p>
                {s.estimatedSavings != null && (
                  <p className="text-sm mt-1 text-green-400">
                    Est. savings: {formatCurrency(Number(s.estimatedSavings))}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <TaxDisclaimer />
    </div>
  );
}
