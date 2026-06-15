"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useHousehold } from "@/components/HouseholdProvider";
import { usePrivacy } from "@/components/PrivacyProvider";
import { isTaxEstimateStale } from "@/lib/tax-estimate";
import type { Member, TaxProfile } from "@/lib/household-types";

export function useTax() {
  const { household, loading: householdLoading } = useHousehold();
  const { isUnlocked, privacyVersion } = usePrivacy();
  const [taxProfile, setTaxProfile] = useState<TaxProfile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [strategies, setStrategies] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taxYear =
    household?.settings?.defaultTaxYear ?? new Date().getFullYear();

  const loadTaxData = useCallback(async () => {
    if (!household) return;
    setError(null);
    try {
      const [membersRes, profileRaw] = await Promise.all([
        api.listMembers(household.householdId),
        api.getTaxProfile(taxYear).catch(() => null),
      ]);

      let profile = profileRaw;
      if (profile && isUnlocked && isTaxEstimateStale(profile)) {
        const recomputed = await api.recomputeTaxProfile(taxYear, {
          filingStatus: profile.filingStatus ?? household.filingStatus,
        });
        profile = recomputed.taxProfile;
      }

      setMembers(membersRes.members ?? []);
      setTaxProfile(profile);

      const strat = await api.taxStrategies();
      setStrategies(strat.strategies ?? []);
      if (strat.taxProfile) setTaxProfile(strat.taxProfile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tax data");
    } finally {
      setLoading(false);
    }
  }, [household, taxYear, isUnlocked]);

  useEffect(() => {
    if (householdLoading) return;
    if (!household) {
      setLoading(false);
      setTaxProfile(null);
      setMembers([]);
      setStrategies([]);
      return;
    }
    setLoading(true);
    void loadTaxData();
  }, [household, householdLoading, loadTaxData, privacyVersion]);

  const recompute = useCallback(async () => {
    if (!household) return;
    setEstimating(true);
    setError(null);
    try {
      const result = await api.recomputeTaxProfile(taxYear, {
        filingStatus: taxProfile?.filingStatus ?? household.filingStatus,
      });
      setTaxProfile(result.taxProfile);
      const strat = await api.taxStrategies();
      setStrategies(strat.strategies ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Estimate failed");
      throw e;
    } finally {
      setEstimating(false);
    }
  }, [household, taxProfile?.filingStatus, taxYear]);

  return {
    household,
    householdLoading,
    taxProfile,
    members,
    strategies,
    taxYear,
    loading,
    estimating,
    error,
    isUnlocked,
    refetch: loadTaxData,
    recompute,
  };
}

export type UseTaxReturn = ReturnType<typeof useTax>;
