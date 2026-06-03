"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AllocationClassRollup,
  DisplayUnit,
  FundProfile,
  HouseholdPlanSummary,
  InvestmentPlan,
  PlannedInstrument,
  ProjectionResponse,
  ReturnPeriod,
} from "@portfolio/contracts";
import {
  buildAllocationSegments,
  computeInstrumentProjection,
  computePlanProjection,
  inferAssetClassFromName,
  instrumentDollars,
  instrumentPercent,
  sumByClass,
  tickerFromName,
  type AssetClass,
} from "@portfolio/contracts";
import { api } from "@/lib/api";
import { usePrivacy } from "@/components/PrivacyProvider";

function newInstrumentId(): string {
  return crypto.randomUUID();
}

function useDebouncedEffect(
  effect: () => void | (() => void),
  deps: unknown[],
  delayMs: number
) {
  useEffect(() => {
    const timer = setTimeout(effect, delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delayMs]);
}

export function useInvestmentPlan() {
  const { privacyVersion, isUnlocked } = usePrivacy();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [summary, setSummary] = useState<HouseholdPlanSummary | null>(null);
  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [allocation, setAllocation] = useState<AllocationClassRollup[]>([]);
  const [netWorth, setNetWorth] = useState(0);
  const [actualTotalDollars, setActualTotalDollars] = useState<number | null>(
    null
  );

  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>("percent");
  const [projectionRate, setProjectionRate] = useState<ReturnPeriod>("life");
  const [reinvestDividends, setReinvestDividends] = useState(true);

  const [explorerName, setExplorerName] = useState("");
  const [explorerAllocPct, setExplorerAllocPct] = useState("");
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string | null>(
    null
  );

  const [profile, setProfile] = useState<FundProfile | null>(null);
  const profileCache = useRef(new Map<string, FundProfile>());
  const userEditedPlan = useRef(false);
  const latestInstrumentsRef = useRef<PlannedInstrument[]>([]);
  const saveGenerationRef = useRef(0);
  const hasLoaded = useRef(false);

  const refetch = useCallback(async (options?: { background?: boolean }) => {
    const background = Boolean(options?.background && hasLoaded.current);
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [summaryRes, planRes, allocationRes] = await Promise.all([
        api.getInvestmentPlanSummary(),
        api.getInvestmentPlan(),
        api.getInvestmentPlanAllocation(),
      ]);
      setSummary(summaryRes.summary);
      setPlan(planRes.plan);
      setAllocation(allocationRes.classes);
      setNetWorth(allocationRes.netWorth);
      setActualTotalDollars(allocationRes.actualTotalDollars);
      userEditedPlan.current = false;
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investment plan");
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refetch({ background: hasLoaded.current });
  }, [refetch, privacyVersion]);

  const resolveProfile = useCallback(
    async (name: string): Promise<FundProfile | null> => {
      const ticker = tickerFromName(name);
      const cached = profileCache.current.get(ticker);
      if (cached) return cached;
      try {
        const res = await api.getInstrumentProfile(ticker);
        profileCache.current.set(ticker, res.profile);
        return res.profile;
      } catch {
        return null;
      }
    },
    []
  );

  useEffect(() => {
    const name = explorerName.trim();
    if (!name) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void resolveProfile(name).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [explorerName, resolveProfile]);

  const instruments = plan?.instruments ?? [];

  useEffect(() => {
    latestInstrumentsRef.current = instruments;
  }, [instruments]);

  const displayAllocation = useMemo(() => {
    if (!plan || allocation.length === 0) return allocation;
    const actualByClass = Object.fromEntries(
      allocation.map((row) => [row.assetClass, row.actualDollars ?? 0])
    ) as Record<AssetClass, number>;
    const actualTotal = allocation.reduce(
      (sum, row) => sum + (row.actualDollars ?? 0),
      0
    );
    const planByClass = sumByClass(plan.instruments, netWorth);
    return buildAllocationSegments(
      planByClass,
      actualByClass,
      actualTotal,
      isUnlocked
    );
  }, [allocation, isUnlocked, netWorth, plan]);

  useEffect(() => {
    for (const item of instruments) {
      void resolveProfile(item.name);
    }
  }, [instruments, resolveProfile]);

  const profileResolver = useCallback(
    (item: PlannedInstrument): FundProfile => {
      const ticker = tickerFromName(item.name);
      const cached = profileCache.current.get(ticker);
      if (cached) return cached;
      const assetClass = item.assetClass;
      return {
        ticker,
        return1y: 0.08,
        return3y: 0.08,
        return5y: 0.08,
        annualizedReturn: 0.08,
        dividendYield: 0.01,
        yearsSinceInception: 8,
        inceptionLabel: "Est.",
        expenseRatio: 0.001,
        feeKind: "expense_ratio",
      };
    },
    []
  );

  const portfolioProjection = useMemo((): ProjectionResponse | null => {
    if (!summary || instruments.length === 0) return null;
    return computePlanProjection(
      instruments,
      summary.netWorth,
      profileResolver,
      projectionRate,
      reinvestDividends
    );
  }, [
    instruments,
    summary,
    profileResolver,
    projectionRate,
    reinvestDividends,
  ]);

  const explorerPrincipal = useMemo(() => {
    if (!summary) return 0;
    const pct = Number.parseFloat(explorerAllocPct);
    if (!Number.isFinite(pct) || pct <= 0) return 0;
    return (pct / 100) * summary.netWorth;
  }, [explorerAllocPct, summary]);

  const explorerProjection = useMemo((): ProjectionResponse | null => {
    if (!profile || explorerPrincipal <= 0) return null;
    return computeInstrumentProjection(
      profile,
      explorerPrincipal,
      projectionRate,
      reinvestDividends
    );
  }, [profile, explorerPrincipal, projectionRate, reinvestDividends]);

  const inferredAssetClass = useMemo(
    () => inferAssetClassFromName(explorerName || "VTI"),
    [explorerName]
  );

  const selectInstrument = useCallback((id: string) => {
    setSelectedInstrumentId(id);
    const item = instruments.find((i) => i.id === id);
    if (item) {
      setExplorerName(item.name);
      const pct =
        item.unit === "percent"
          ? item.value
          : instrumentPercent(item, summary?.netWorth ?? 0);
      setExplorerAllocPct(String(Number.isFinite(pct) ? pct : ""));
    }
  }, [instruments, summary?.netWorth]);

  const clearExplorer = useCallback(() => {
    setSelectedInstrumentId(null);
    setExplorerName("");
    setExplorerAllocPct("");
  }, []);

  const updatePlanInstruments = useCallback(
    (updater: (prev: PlannedInstrument[]) => PlannedInstrument[]) => {
      setPlan((prev) => {
        if (!prev) return prev;
        userEditedPlan.current = true;
        return { ...prev, instruments: updater(prev.instruments) };
      });
    },
    []
  );

  const addOrUpdateFromExplorer = useCallback(() => {
    const parsed = Number.parseFloat(explorerAllocPct);
    if (!explorerName.trim() || !Number.isFinite(parsed) || parsed <= 0) return;

    const updatingExisting = selectedInstrumentId !== null;
    const ticker = tickerFromName(explorerName);
    const assetClass = inferAssetClassFromName(explorerName);
    const entry: PlannedInstrument = {
      id: selectedInstrumentId ?? newInstrumentId(),
      name: explorerName.trim(),
      ticker,
      assetClass,
      unit: "percent",
      value: parsed,
      sortOrder: instruments.length,
    };

    updatePlanInstruments((prev) => {
      if (updatingExisting) {
        const existingIdx = prev.findIndex((i) => i.id === entry.id);
        if (existingIdx < 0) return prev;
        const next = [...prev];
        next[existingIdx] = {
          ...entry,
          sortOrder: next[existingIdx]!.sortOrder,
        };
        return next;
      }

      const dupIdx = prev.findIndex(
        (i) => tickerFromName(i.name).toUpperCase() === ticker.toUpperCase()
      );
      if (dupIdx >= 0) {
        const next = [...prev];
        next[dupIdx] = {
          ...entry,
          id: next[dupIdx]!.id,
          sortOrder: next[dupIdx]!.sortOrder,
        };
        return next;
      }

      return [
        ...prev,
        { ...entry, sortOrder: prev.length },
      ];
    });

    if (updatingExisting) {
      setSelectedInstrumentId(entry.id);
    } else {
      clearExplorer();
    }
  }, [
    clearExplorer,
    explorerAllocPct,
    explorerName,
    instruments.length,
    selectedInstrumentId,
    updatePlanInstruments,
  ]);

  const removeInstrument = useCallback(
    (id: string) => {
      updatePlanInstruments((prev) => prev.filter((item) => item.id !== id));
      if (selectedInstrumentId === id) clearExplorer();
    },
    [clearExplorer, selectedInstrumentId, updatePlanInstruments]
  );

  const setExplorerNameWithMode = useCallback(
    (name: string) => {
      setExplorerName(name);
      if (!selectedInstrumentId) return;
      const selected = instruments.find((item) => item.id === selectedInstrumentId);
      if (
        selected &&
        tickerFromName(selected.name).toUpperCase() !==
          tickerFromName(name).toUpperCase()
      ) {
        setSelectedInstrumentId(null);
      }
    },
    [instruments, selectedInstrumentId]
  );

  useDebouncedEffect(
    () => {
      if (!plan || !userEditedPlan.current) return;

      const generation = ++saveGenerationRef.current;
      const instrumentsToSave = latestInstrumentsRef.current;

      setSaving(true);
      setSaveError(null);
      api
        .updateInvestmentPlan(instrumentsToSave)
        .then((res) => {
          if (generation !== saveGenerationRef.current) {
            return undefined;
          }
          userEditedPlan.current = false;
          setPlan(res.plan);
          setSummary(res.summary);
          setLastSavedAt(res.plan.updatedAt);
          setSaving(false);
          return api.getInvestmentPlanAllocation();
        })
        .then((allocationRes) => {
          if (!allocationRes || generation !== saveGenerationRef.current) {
            return;
          }
          setAllocation(allocationRes.classes);
          setNetWorth(allocationRes.netWorth);
          setActualTotalDollars(allocationRes.actualTotalDollars);
        })
        .catch((err) => {
          if (generation !== saveGenerationRef.current) {
            return;
          }
          setSaveError(err instanceof Error ? err.message : "Save failed");
          setSaving(false);
        });
    },
    [plan?.instruments],
    500
  );

  return {
    loading,
    refreshing,
    error,
    saving,
    saveError,
    lastSavedAt,
    summary,
    plan,
    allocation: displayAllocation,
    netWorth,
    actualTotalDollars,
    valuesUnlocked: isUnlocked,
    displayUnit,
    setDisplayUnit,
    projectionRate,
    setProjectionRate,
    reinvestDividends,
    setReinvestDividends,
    explorerName,
    setExplorerName: setExplorerNameWithMode,
    explorerAllocPct,
    setExplorerAllocPct,
    selectedInstrumentId,
    selectInstrument,
    clearExplorer,
    addOrUpdateFromExplorer,
    removeInstrument,
    profile,
    explorerProjection,
    portfolioProjection,
    inferredAssetClass,
    profileForInstrument: profileResolver,
    refetch,
  };
}

export { instrumentDollars, instrumentPercent, tickerFromName };
