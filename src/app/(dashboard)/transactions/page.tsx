"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Scale,
} from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { usePrivacy } from "@/components/PrivacyProvider";
import {
  buildTransactionCursor,
  parseTransactions,
  transactionCategoryLabel,
  type TransactionRecord,
} from "@/lib/transactions";
import { rollingDaysStartDate } from "@/lib/transactions-summary";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";

const PAGE_SIZE = 8;
const SUMMARY_LOOKBACK_DAYS = 90;

type PageSummary = {
  netSum: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  spendByCategoryPercent?: Record<string, number>;
};

type TransactionPage = {
  transactions: TransactionRecord[];
  hasMore: boolean;
  nextCursor?: string;
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolvePagination(
  transactions: TransactionRecord[],
  apiHasMore?: boolean,
  apiNextCursor?: string
): Pick<TransactionPage, "hasMore" | "nextCursor"> {
  const last = transactions[transactions.length - 1];
  const nextCursor =
    apiNextCursor ??
    (last && transactions.length >= PAGE_SIZE
      ? buildTransactionCursor(last)
      : undefined);
  const hasMore =
    apiHasMore ?? (transactions.length >= PAGE_SIZE && Boolean(nextCursor));

  return { hasMore, nextCursor };
}

export default function TransactionsPage() {
  const { isUnlocked, privacyVersion } = usePrivacy();
  const [summary, setSummary] = useState<PageSummary>({
    netSum: 0,
    totalCredits: 0,
    totalDebits: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pages, setPages] = useState<TransactionPage[]>([]);
  const pageCursorsRef = useRef<(string | undefined)[]>([undefined]);

  const currentPage = pages[pageIndex];
  const transactions = currentPage?.transactions ?? [];
  const hasMore = currentPage?.hasMore ?? false;

  const loadSummary = useCallback(async () => {
    const endDate = todayDate();
    const startDate = rollingDaysStartDate(SUMMARY_LOOKBACK_DAYS);
    try {
      const res = await api.getTransactionSummary({ startDate, endDate });
      if (res.valuesUnlocked) {
        const totalCredits = res.totalCredits ?? 0;
        const totalSpend = res.totalSpend ?? 0;
        setSummary({
          netSum: totalCredits - totalSpend,
          totalCredits,
          totalDebits: totalSpend,
          transactionCount: res.transactionCount,
          spendByCategoryPercent: res.spendByCategoryPercent,
        });
      } else {
        setSummary({
          netSum: 0,
          totalCredits: 0,
          totalDebits: 0,
          transactionCount: res.transactionCount,
          spendByCategoryPercent: res.spendByCategoryPercent,
        });
      }
    } catch {
      setSummary({
        netSum: 0,
        totalCredits: 0,
        totalDebits: 0,
        transactionCount: 0,
      });
    }
  }, []);

  const fetchPage = useCallback(async (cursor: string | undefined) => {
    const params: Record<string, string> = {
      limit: String(PAGE_SIZE),
    };
    if (cursor) params.cursor = cursor;

    const res = await api.getTransactions(params);
    const parsed = parseTransactions(res.transactions);
    const pagination = resolvePagination(
      parsed,
      res.hasMore,
      res.nextCursor
    );

    return {
      transactions: parsed,
      ...pagination,
    };
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const firstPage = await fetchPage(undefined);
      pageCursorsRef.current = [undefined];
      if (firstPage.nextCursor) {
        pageCursorsRef.current[1] = firstPage.nextCursor;
      }
      setPages([firstPage]);
      setPageIndex(0);
    } catch (err) {
      setPages([]);
      setPageError(
        err instanceof Error ? err.message : "Failed to load transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    setPages([]);
    pageCursorsRef.current = [undefined];
    setPageIndex(0);
    void loadSummary();
    void loadInitial();
  }, [loadSummary, loadInitial, privacyVersion]);

  const goToPage = async (targetIndex: number) => {
    if (targetIndex < 0 || pageLoading) return;

    const cached = pages[targetIndex];
    if (cached) {
      setPageIndex(targetIndex);
      setPageError(null);
      return;
    }

    const cursor = pageCursorsRef.current[targetIndex];
    if (targetIndex > 0 && !cursor) return;

    setPageLoading(true);
    setPageError(null);
    try {
      const nextPage = await fetchPage(cursor);
      setPages((prev) => {
        const copy = [...prev];
        copy[targetIndex] = nextPage;
        return copy;
      });
      if (nextPage.nextCursor) {
        pageCursorsRef.current[targetIndex + 1] = nextPage.nextCursor;
      }
      setPageIndex(targetIndex);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to load this page"
      );
    } finally {
      setPageLoading(false);
    }
  };

  const goToPreviousPage = () => {
    if (pageIndex === 0) return;
    void goToPage(pageIndex - 1);
  };

  const goToNextPage = () => {
    if (!hasMore) return;
    void goToPage(pageIndex + 1);
  };

  const pageNumber = pageIndex + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader title="Transactions" description="Recent account activity" />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading transactions…</p>
      ) : pageError && transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Could not load transactions"
          description={pageError}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions found"
          description="Connect a bank account and sync from Connections to see recent activity."
        />
      ) : (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {isUnlocked ? (
              <>
                <StatCard
                  title="Net sum"
                  value={formatCurrency(summary.netSum)}
                  description={`Last ${SUMMARY_LOOKBACK_DAYS} days · ${summary.transactionCount} transactions`}
                  icon={Scale}
                />
                <StatCard
                  title="Total credits"
                  value={formatCurrency(summary.totalCredits)}
                  description="Money in"
                  icon={ArrowDownLeft}
                />
                <StatCard
                  title="Total debits"
                  value={formatCurrency(summary.totalDebits)}
                  description="Money out"
                  icon={ArrowUpRight}
                />
              </>
            ) : (
              <StatCard
                title="Activity"
                value={`${summary.transactionCount}`}
                description={`Transactions · top category ${formatPercent(
                  Math.max(0, ...Object.values(summary.spendByCategoryPercent ?? {}))
                )}`}
                icon={Scale}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative rounded-lg border border-border"
          >
            {pageLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70">
                <p className="text-sm text-muted-foreground">Loading page…</p>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  {isUnlocked && <TableHead className="text-right">Amount</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.txnId}>
                    <TableCell>{formatDate(t.date)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{t.description}</div>
                      {t.pending && (
                        <p className="text-xs text-muted-foreground">Pending</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {transactionCategoryLabel(t.category)}
                      </Badge>
                    </TableCell>
                    {isUnlocked && (
                      <TableCell
                        className={`text-right font-medium tabular-nums ${
                          (t.amount ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(t.amount ?? Number.NaN)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>

          {pageError && (
            <p className="text-sm text-rose-400" role="alert">
              {pageError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing {transactions.length} transactions · Page {pageNumber}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={pageIndex === 0 || pageLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={!hasMore || pageLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
