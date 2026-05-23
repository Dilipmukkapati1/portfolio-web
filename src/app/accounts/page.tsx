"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.getAccounts().then((r) => setAccounts(r.accounts));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Accounts</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.length === 0 ? (
          <p className="text-muted-foreground">No accounts linked yet.</p>
        ) : (
          accounts.map((a) => (
            <Card key={String(a.accountId)}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {String(a.displayName)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-muted">
                  {String(a.source)}
                </span>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(Number(a.balance) || 0)}
                </p>
                {a.institutionName != null && (
                  <p className="text-sm text-muted-foreground">
                    {String(a.institutionName)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
