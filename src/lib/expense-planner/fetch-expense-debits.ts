import { api } from "@/lib/api";
import { parseTransactions, type TransactionRecord } from "@/lib/transactions";

export const MAPPING_PAGE_SIZE = 25;

export type ExpenseDebitsPage = {
  transactions: TransactionRecord[];
  hasMore: boolean;
  nextCursor?: string;
  valuesUnlocked: boolean;
};

export async function fetchExpenseDebitsPage(
  cursor?: string,
  limit = MAPPING_PAGE_SIZE,
  accountId?: string | null
): Promise<ExpenseDebitsPage> {
  const res = await api.getTransactions({
    expenseDebitsOnly: "true",
    limit: String(limit),
    ...(accountId ? { accountId } : {}),
    ...(cursor ? { cursor } : {}),
  });

  return {
    transactions: parseTransactions(res.transactions),
    hasMore: res.hasMore,
    nextCursor: res.nextCursor,
    valuesUnlocked: res.valuesUnlocked !== false,
  };
}
