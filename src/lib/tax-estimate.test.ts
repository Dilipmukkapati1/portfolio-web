import { describe, it, expect } from "vitest";
import { isTaxEstimateStale } from "./tax-estimate";
import type { TaxProfile } from "./household-types";

function profile(partial: Partial<TaxProfile>): TaxProfile {
  return {
    id: "hh:2026",
    householdId: "hh",
    taxYear: 2026,
    filingStatus: "married_filing_jointly",
    dependentCount: 0,
    memberIds: [],
    inputs: {
      taxYear: 2026,
      filingStatus: "married_filing_jointly",
      wages: 395000,
      selfEmploymentIncome: 0,
      interestIncome: 0,
      dividendIncome: 0,
      capitalGainsShort: 0,
      capitalGainsLong: 0,
      otherIncome: 0,
      adjustments: 0,
      dependents: 0,
      retirementContributions: 47000,
      hsaContributions: 0,
    },
    fieldProvenance: {},
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("isTaxEstimateStale", () => {
  it("detects when deferrals exist but AGI equals gross wages", () => {
    const stale = profile({
      lastEstimate: {
        taxYear: 2026,
        adjustedGrossIncome: 395000,
        taxableIncome: 365000,
        standardDeduction: 30000,
        federalTax: 73294,
        effectiveRate: 0.1856,
        marginalRate: 0.24,
      },
    });
    expect(isTaxEstimateStale(stale)).toBe(true);
  });

  it("returns false when AGI reflects deferrals", () => {
    const fresh = profile({
      lastEstimate: {
        taxYear: 2026,
        adjustedGrossIncome: 348000,
        taxableIncome: 318000,
        standardDeduction: 30000,
        federalTax: 62014,
        effectiveRate: 0.1782,
        marginalRate: 0.24,
      },
    });
    expect(isTaxEstimateStale(fresh)).toBe(false);
  });
});
