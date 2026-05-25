export type TransactionRecord = {
  id: string;
  txnId: string;
  accountId: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  pending: boolean;
};

export function buildTransactionCursor(
  transaction: Pick<TransactionRecord, "date" | "id">
): string {
  const json = JSON.stringify({
    date: transaction.date,
    id: transaction.id,
  });
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

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
    id: String(t.id ?? t.txnId),
    txnId: String(t.txnId ?? t.id),
    accountId: String(t.accountId),
    amount: Number(t.amount) || 0,
    date: String(t.date),
    description: String(t.description ?? ""),
    category: String(t.category ?? "uncategorized"),
    pending: Boolean(t.pending),
  }));
}
