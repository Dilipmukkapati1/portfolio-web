export type TransactionRecord = {
  txnId: string;
  accountId: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  pending: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  income: "Income",
  transfer: "Transfer",
  housing: "Housing",
  utilities: "Utilities",
  food: "Food",
  transport: "Transport",
  healthcare: "Healthcare",
  insurance: "Insurance",
  entertainment: "Entertainment",
  shopping: "Shopping",
  education: "Education",
  taxes: "Taxes",
  fees: "Fees",
  investment: "Investment",
  other: "Other",
  uncategorized: "Uncategorized",
};

export function transactionCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function parseTransactions(
  raw: Array<Record<string, unknown>>
): TransactionRecord[] {
  return raw.map((t) => ({
    txnId: String(t.txnId ?? t.id),
    accountId: String(t.accountId),
    amount: Number(t.amount) || 0,
    date: String(t.date),
    description: String(t.description ?? ""),
    category: String(t.category ?? "uncategorized"),
    pending: Boolean(t.pending),
  }));
}
