"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseAccountOption } from "@/hooks/use-expense-accounts";

const ALL_ACCOUNTS = "__all__";

export function ExpenseAccountFilter({
  accounts,
  value,
  onChange,
  disabled,
  className,
}: {
  accounts: ExpenseAccountOption[];
  value: string | null;
  onChange: (accountId: string | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      value={value ?? ALL_ACCOUNTS}
      disabled={disabled || accounts.length === 0}
      onValueChange={(next) =>
        onChange(next === ALL_ACCOUNTS ? null : next)
      }
    >
      <SelectTrigger className={className ?? "h-8 w-full min-w-[160px] max-w-xs text-xs"}>
        <SelectValue placeholder="All accounts" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_ACCOUNTS}>All accounts</SelectItem>
        {accounts.map((account) => (
          <SelectItem key={account.accountId} value={account.accountId}>
            {account.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function expenseAccountLabel(
  accounts: ExpenseAccountOption[],
  accountId: string | null
): string | null {
  if (!accountId) return null;
  return accounts.find((a) => a.accountId === accountId)?.label ?? accountId;
}
