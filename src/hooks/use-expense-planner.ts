"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ExpenseCategoryPreference,
  ExpenseMappingRule,
  ExpensePlan,
  Transaction,
  TransactionSummaryResponse,
  UpsertExpensePlanRequest,
} from "@portfolio/contracts";
import { normalizeExpensePlan } from "@portfolio/contracts";
import { api } from "@/lib/api";
import { usePrivacy } from "@/components/PrivacyProvider";
import {
  fetchExpenseDebitsPage,
  type ExpenseDebitsPage,
} from "@/lib/expense-planner/fetch-expense-debits";
import type { DurationPreset } from "@/lib/expense-planner/date-ranges";
import {
  clampSummaryDateRange,
  durationRange,
  isRangeWithinLimit,
  toIsoDate,
} from "@/lib/expense-planner/date-ranges";

type SummaryState = TransactionSummaryResponse & {
  privacyMode?: "locked" | "unlocked";
  valuesUnlocked?: boolean;
  spendByCategoryPercent?: Record<string, number>;
  spendByAccountPercent?: Record<string, number>;
};

function useDebouncedEffect(
  effect: () => void | (() => void),
  deps: unknown[],
  delayMs: number,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(effect, delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delayMs, enabled]);
}

export function useExpensePlanner() {
  const { privacyVersion, isUnlocked } = usePrivacy();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [applyingRules, setApplyingRules] = useState(false);
  const [categorizingTxnId, setCategorizingTxnId] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const [plan, setPlan] = useState<ExpensePlan | null>(null);
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const [currentMonthSummary, setCurrentMonthSummary] = useState<SummaryState | null>(null);
  const [unmappedTransactions, setUnmappedTransactions] = useState<Transaction[]>([]);
  const [mappingPages, setMappingPages] = useState<ExpenseDebitsPage[]>([]);
  const [mappingPageIndex, setMappingPageIndex] = useState(0);
  const [mappingPageLoading, setMappingPageLoading] = useState(false);
  const mappingPageCursorsRef = useRef<(string | undefined)[]>([undefined]);
  const mappingPageIndexRef = useRef(0);

  const [duration, setDuration] = useState<DurationPreset>("current-month");
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toIsoDate(d);
  });
  const [customEnd, setCustomEnd] = useState(() => toIsoDate(new Date()));

  const pendingSave = useRef<UpsertExpensePlanRequest | null>(null);
  const userEdited = useRef(false);

  const range = durationRange(duration, customStart, customEnd);
  const rangeError =
    duration === "custom" && !isRangeWithinLimit(range.startDate, range.endDate)
      ? "Date range cannot exceed 366 days"
      : null;

  const fetchMappingPage = useCallback(async (cursor?: string) => {
    return fetchExpenseDebitsPage(cursor);
  }, []);

  const resetMappingPages = useCallback(async () => {
    const firstPage = await fetchMappingPage(undefined);
    mappingPageCursorsRef.current = [undefined];
    if (firstPage.nextCursor) {
      mappingPageCursorsRef.current[1] = firstPage.nextCursor;
    }
    setMappingPages([firstPage]);
    setMappingPageIndex(0);
    mappingPageIndexRef.current = 0;
  }, [fetchMappingPage]);

  const goToMappingPage = useCallback(
    async (targetIndex: number) => {
      if (targetIndex < 0 || mappingPageLoading) return;

      const cached = mappingPages[targetIndex];
      if (cached) {
        setMappingPageIndex(targetIndex);
        mappingPageIndexRef.current = targetIndex;
        return;
      }

      const cursor = mappingPageCursorsRef.current[targetIndex];
      if (targetIndex > 0 && !cursor) return;

      setMappingPageLoading(true);
      try {
        const nextPage = await fetchMappingPage(cursor);
        setMappingPages((prev) => {
          const copy = [...prev];
          copy[targetIndex] = nextPage;
          return copy;
        });
        if (nextPage.nextCursor) {
          mappingPageCursorsRef.current[targetIndex + 1] = nextPage.nextCursor;
        }
        setMappingPageIndex(targetIndex);
        mappingPageIndexRef.current = targetIndex;
      } finally {
        setMappingPageLoading(false);
      }
    },
    [fetchMappingPage, mappingPageLoading, mappingPages]
  );

  const loadUnmapped = useCallback(async (startDate: string, endDate: string) => {
    const collected: Transaction[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 20; page += 1) {
      const res = await api.getTransactions({
        startDate,
        endDate,
        category: "uncategorized",
        expenseDebitsOnly: "true",
        limit: "500",
        ...(cursor ? { cursor } : {}),
      });
      collected.push(...(res.transactions as Transaction[]));
      if (!res.hasMore || !res.nextCursor) break;
      cursor = res.nextCursor;
    }
    setUnmappedTransactions(collected);
  }, []);

  const refetch = useCallback(async (options?: { background?: boolean }) => {
    const background = Boolean(options?.background && hasLoaded.current);
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const currentRange = durationRange(duration, customStart, customEnd);
      if (
        duration === "custom" &&
        !isRangeWithinLimit(currentRange.startDate, currentRange.endDate)
      ) {
        setSummary(null);
        return;
      }

      const summaryDates = clampSummaryDateRange(
        currentRange.startDate,
        currentRange.endDate
      );
      const monthRange = durationRange("current-month", customStart, customEnd);
      const monthDates = clampSummaryDateRange(
        monthRange.startDate,
        monthRange.endDate
      );

      const [planRes, summaryRes, monthRes] = await Promise.all([
        api.getExpensePlan(),
        api.getTransactionSummary({
          startDate: summaryDates.startDate,
          endDate: summaryDates.endDate,
        }),
        api.getTransactionSummary({
          startDate: monthDates.startDate,
          endDate: monthDates.endDate,
        }),
      ]);
      setPlan(normalizeExpensePlan(planRes.plan));
      setSummary(summaryRes);
      setCurrentMonthSummary(monthRes);
      await loadUnmapped(currentRange.startDate, currentRange.endDate);
      await resetMappingPages();
      userEdited.current = false;
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expense planner");
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [customEnd, customStart, duration, loadUnmapped, resetMappingPages]);

  useEffect(() => {
    void refetch({ background: hasLoaded.current });
  }, [refetch, privacyVersion]);

  const savePlan = useCallback(async (payload: UpsertExpensePlanRequest) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.putExpensePlan(payload);
      setPlan(normalizeExpensePlan(res.plan));
      setLastSavedAt(new Date().toISOString());
      pendingSave.current = null;
      userEdited.current = false;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, []);

  useDebouncedEffect(
    () => {
      if (!pendingSave.current || !userEdited.current) return;
      void savePlan(pendingSave.current);
    },
    [plan?.categories, plan?.mappingRules, plan?.monthlyExpenseTotal, plan?.budgetAllocationMode],
    300,
    Boolean(plan) && userEdited.current
  );

  const buildSavePayload = useCallback(
    (nextPlan: ExpensePlan): UpsertExpensePlanRequest => ({
      categories: nextPlan.categories,
      mappingRules: nextPlan.mappingRules,
      monthlyExpenseTotal: nextPlan.monthlyExpenseTotal,
      budgetAllocationMode: nextPlan.budgetAllocationMode,
    }),
    []
  );

  const updateCategories = useCallback((categories: ExpenseCategoryPreference[]) => {
    userEdited.current = true;
    setPlan((prev) => {
      if (!prev) return prev;
      const next = { ...prev, categories };
      pendingSave.current = buildSavePayload(next);
      return next;
    });
  }, [buildSavePayload]);

  const updatePlan = useCallback((nextPlan: ExpensePlan) => {
    userEdited.current = true;
    setPlan(nextPlan);
    pendingSave.current = buildSavePayload(nextPlan);
  }, [buildSavePayload]);

  const updateMappingRules = useCallback((mappingRules: ExpenseMappingRule[]) => {
    userEdited.current = true;
    setPlan((prev) => {
      if (!prev) return prev;
      const next = { ...prev, mappingRules };
      pendingSave.current = buildSavePayload(next);
      return next;
    });
  }, [buildSavePayload]);

  const applyMappingRules = useCallback(async (ruleIds?: string[]) => {
    setApplyingRules(true);
    try {
      await api.applyExpenseMappingRules(ruleIds ? { ruleIds } : undefined);
      void refetch({ background: true });
    } finally {
      setApplyingRules(false);
    }
  }, [refetch]);

  const categorizeTransaction = useCallback(
    async (txnId: string, category: string) => {
      setCategorizingTxnId(txnId);
      setUnmappedTransactions((prev) => prev.filter((t) => t.txnId !== txnId));
      setMappingPages((prev) =>
        prev.map((page, index) =>
          index === mappingPageIndexRef.current
            ? {
                ...page,
                transactions: page.transactions.map((t) =>
                  t.txnId === txnId ? { ...t, category } : t
                ),
              }
            : page
        )
      );
      try {
        await api.categorizeTransaction(txnId, category);
        void refetch({ background: true });
      } catch {
        void refetch({ background: true });
      } finally {
        setCategorizingTxnId(null);
      }
    },
    [refetch]
  );

  const applyMappingRuleToTransaction = useCallback(
    async (txnId: string, rule: ExpenseMappingRule) => {
      await categorizeTransaction(txnId, rule.category);
    },
    [categorizeTransaction]
  );

  return {
    loading,
    refreshing,
    error,
    saving,
    saveError,
    lastSavedAt,
    applyingRules,
    categorizingTxnId,
    plan,
    summary,
    currentMonthSummary,
    unmappedTransactions,
    mappingTransactions: mappingPages[mappingPageIndex]?.transactions ?? [],
    mappingPageIndex,
    mappingPageNumber: mappingPageIndex + 1,
    mappingHasMore: mappingPages[mappingPageIndex]?.hasMore ?? false,
    mappingPageLoading,
    goToMappingPage,
    mappingValuesUnlocked:
      isUnlocked && (mappingPages[mappingPageIndex]?.valuesUnlocked ?? true),
    duration,
    setDuration,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    range,
    rangeError,
    valuesUnlocked: isUnlocked && summary?.valuesUnlocked !== false,
    refetch,
    updateCategories,
    updatePlan,
    updateMappingRules,
    applyMappingRules,
    categorizeTransaction,
    applyMappingRuleToTransaction,
    savePlan,
  };
}
