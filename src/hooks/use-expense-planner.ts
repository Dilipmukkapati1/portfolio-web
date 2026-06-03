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
import { api } from "@/lib/api";
import { usePrivacy } from "@/components/PrivacyProvider";
import type { DurationPreset } from "@/lib/expense-planner/date-ranges";
import {
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

  const loadUnmapped = useCallback(async (startDate: string, endDate: string) => {
    const collected: Transaction[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 5; page += 1) {
      const res = await api.getTransactions({
        startDate,
        endDate,
        category: "uncategorized",
        limit: "100",
        ...(cursor ? { cursor } : {}),
      });
      collected.push(...(res.transactions as Transaction[]));
      if (!res.hasMore || !res.nextCursor) break;
      cursor = res.nextCursor;
    }
    setUnmappedTransactions(collected.slice(0, 500));
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

      const [planRes, summaryRes, monthRes] = await Promise.all([
        api.getExpensePlan(),
        api.getTransactionSummary({
          startDate: currentRange.startDate,
          endDate: currentRange.endDate,
        }),
        api.getTransactionSummary({
          startDate: durationRange("current-month", customStart, customEnd).startDate,
          endDate: durationRange("current-month", customStart, customEnd).endDate,
        }),
      ]);
      setPlan(planRes.plan);
      setSummary(summaryRes);
      setCurrentMonthSummary(monthRes);
      await loadUnmapped(currentRange.startDate, currentRange.endDate);
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
  }, [customEnd, customStart, duration, loadUnmapped]);

  useEffect(() => {
    void refetch({ background: hasLoaded.current });
  }, [refetch, privacyVersion]);

  const savePlan = useCallback(async (payload: UpsertExpensePlanRequest) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.putExpensePlan(payload);
      setPlan(res.plan);
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
    [plan?.categories, plan?.mappingRules],
    300,
    Boolean(plan) && userEdited.current
  );

  const updateCategories = useCallback((categories: ExpenseCategoryPreference[]) => {
    userEdited.current = true;
    setPlan((prev) => (prev ? { ...prev, categories } : prev));
    pendingSave.current = { categories, mappingRules: plan?.mappingRules };
  }, [plan?.mappingRules]);

  const updateMappingRules = useCallback((mappingRules: ExpenseMappingRule[]) => {
    userEdited.current = true;
    setPlan((prev) => (prev ? { ...prev, mappingRules } : prev));
    pendingSave.current = { categories: plan?.categories, mappingRules };
  }, [plan?.categories]);

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
    updateMappingRules,
    applyMappingRules,
    categorizeTransaction,
    savePlan,
  };
}
