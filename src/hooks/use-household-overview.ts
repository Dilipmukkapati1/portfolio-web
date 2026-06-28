"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  aggregateLifetimeToDate,
  aggregateOverviewSnapshots,
  buildOverviewFromMembers,
  buildOverviewFromTaxProfile,
  type HouseholdOverviewSnapshot,
  type Member as ContractsMember,
  type TaxProfile as ContractsTaxProfile,
} from "@portfolio/contracts";
import { api } from "@/lib/api";
import { useHousehold } from "@/components/HouseholdProvider";
import { usePrivacy } from "@/components/PrivacyProvider";
import { computeTaxOutlook, taxYearProgress } from "@/lib/tax/outlook";
import type { Member, TaxProfile } from "@/lib/household-types";

export type OverviewPeriod = "current" | "prior" | "lifetime";

const LIFETIME_YEAR_WINDOW = 6;

function normalizeMembers(members: Member[]): Member[] {
  return members.map((m) => ({
    ...m,
    incomeSources: m.incomeSources ?? [],
    contributions: m.contributions ?? [],
  }));
}

export function useHouseholdOverview(refreshToken?: number) {
  const { household, householdId } = useHousehold();
  const { privacyVersion } = usePrivacy();
  const [members, setMembers] = useState<Member[]>([]);
  const [taxProfile, setTaxProfile] = useState<TaxProfile | null>(null);
  const [priorProfile, setPriorProfile] = useState<TaxProfile | null>(null);
  const [lifetimeProfiles, setLifetimeProfiles] = useState<TaxProfile[]>([]);
  const [period, setPeriod] = useState<OverviewPeriod>("current");
  const [loading, setLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taxYear =
    household?.settings?.defaultTaxYear ?? new Date().getFullYear();
  const priorYear = taxYear - 1;

  const loadBase = useCallback(async () => {
    if (!household) return;
    setLoading(true);
    setError(null);
    try {
      const [membersRes, profile] = await Promise.all([
        api.listMembers(householdId),
        api.getTaxProfile(taxYear, householdId).catch(() => null),
      ]);
      const nextMembers =
        "valuesUnlocked" in membersRes && membersRes.valuesUnlocked === false
          ? membersRes.members.map((m) => ({
              ...m,
              incomeSources: [],
              contributions: [],
            }))
          : membersRes.members;
      setMembers(normalizeMembers(nextMembers));
      setTaxProfile(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, [household, householdId, taxYear]);

  useEffect(() => {
    void loadBase();
  }, [loadBase, privacyVersion, refreshToken]);

  useEffect(() => {
    if (!household || period === "current") return;

    let cancelled = false;
    setPeriodLoading(true);

    async function loadPeriodData() {
      try {
        if (period === "prior") {
          const profile = await api
            .getTaxProfile(priorYear, householdId)
            .catch(() => null);
          if (!cancelled) setPriorProfile(profile);
        } else {
          const calendarYear = new Date().getFullYear();
          const endYear = Math.min(taxYear, calendarYear);
          const startYear = endYear - (LIFETIME_YEAR_WINDOW - 1);
          const years = Array.from(
            { length: endYear - startYear + 1 },
            (_, i) => startYear + i
          );
          const profiles = await Promise.all(
            years.map((year) =>
              api.getTaxProfile(year, householdId).catch(() => null)
            )
          );
          if (!cancelled) {
            setLifetimeProfiles(
              profiles.filter((p): p is TaxProfile => p != null)
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load period data");
        }
      } finally {
        if (!cancelled) setPeriodLoading(false);
      }
    }

    void loadPeriodData();
    return () => {
      cancelled = true;
    };
  }, [household, householdId, period, priorYear, taxYear]);

  const snapshot: HouseholdOverviewSnapshot | null = useMemo(() => {
    if (loading || !household) return null;

    if (period === "current") {
      const outlook = computeTaxOutlook({
        taxProfile,
        members,
        earnerScope: "household",
        taxYear,
      });
      return buildOverviewFromMembers(
        members as ContractsMember[],
        taxProfile as ContractsTaxProfile | null | undefined,
        outlook
      );
    }

    if (period === "prior") {
      if (!priorProfile) {
        return {
          incomeBeforeTax: 0,
          incomeAfterTax: 0,
          totalTax: 0,
          contributions: {
            pretax401k: 0,
            afterTax401k: 0,
            pretaxIra: 0,
            afterTaxIra: 0,
            hsa: 0,
            employerMatch: 0,
          },
          carryForward: [],
          taxYear: priorYear,
          source: "snapshot",
        };
      }
      return buildOverviewFromTaxProfile(priorProfile as ContractsTaxProfile);
    }

    const calendarYear = new Date().getFullYear();

    if (taxYear === calendarYear) {
      return aggregateLifetimeToDate({
        completedYearProfiles: (lifetimeProfiles as ContractsTaxProfile[]).filter(
          (profile) => profile.taxYear < taxYear
        ),
        currentYearSnapshot: buildOverviewFromMembers(
          members as ContractsMember[],
          taxProfile as ContractsTaxProfile | null | undefined,
          computeTaxOutlook({
            taxProfile,
            members,
            earnerScope: "household",
            taxYear,
          })
        ),
        yearProgress: taxYearProgress(taxYear),
      });
    }

    return aggregateOverviewSnapshots(lifetimeProfiles as ContractsTaxProfile[]);
  }, [
    household,
    loading,
    lifetimeProfiles,
    members,
    period,
    priorProfile,
    priorYear,
    taxProfile,
    taxYear,
  ]);

  const calendarYear = new Date().getFullYear();
  const includesCurrentYtd = taxYear === calendarYear;
  const lifetimeWindowRange = useMemo(() => {
    const endYear = Math.min(taxYear, calendarYear);
    const startYear = endYear - (LIFETIME_YEAR_WINDOW - 1);
    if (startYear === endYear) {
      return includesCurrentYtd ? `${endYear} YTD` : String(endYear);
    }
    return `${startYear}–${endYear}`;
  }, [calendarYear, includesCurrentYtd, taxYear]);

  return {
    snapshot,
    members,
    taxYear,
    priorYear,
    period,
    setPeriod,
    loading: loading || periodLoading,
    error,
    lifetimeYearsIncluded: lifetimeProfiles.length,
    lifetimeWindowRange,
    includesCurrentYtd,
  };
}
