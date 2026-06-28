"use client";

import { useEffect, useState } from "react";
import { usePrivacy } from "@/components/PrivacyProvider";
import { api } from "@/lib/api";

export type ExpenseAccountOption = {
  accountId: string;
  label: string;
};

export function useExpenseAccounts() {
  const { privacyVersion } = usePrivacy();
  const [accounts, setAccounts] = useState<ExpenseAccountOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api
      .getAccounts()
      .then((res) => {
        if (cancelled) return;
        const options = res.accounts
          .map((raw) => {
            const accountId = String(raw.accountId ?? "");
            const displayName = String(raw.displayName ?? accountId);
            const institution = raw.institutionName
              ? String(raw.institutionName)
              : "";
            const label =
              institution && institution !== displayName
                ? `${displayName} · ${institution}`
                : displayName;
            return { accountId, label };
          })
          .filter((a) => a.accountId)
          .sort((a, b) => a.label.localeCompare(b.label));
        setAccounts(options);
      })
      .catch(() => {
        if (!cancelled) setAccounts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [privacyVersion]);

  return { accounts, loading };
}
