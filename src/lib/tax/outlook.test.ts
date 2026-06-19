import { describe, it, expect } from "vitest";
import {
  computeTaxOutlook,
  computeOnTrackPercent,
  taxYearProgress,
} from "./outlook";
import type { Member, TaxProfile } from "@/lib/household-types";

const member = (
  partial: Partial<Member> & Pick<Member, "id" | "name">
): Member => ({
  householdId: "hh",
  relationship: "self",
  isActive: true,
  incomeSources: [],
  contributions: [],
  ...partial,
});

describe("tax outlook", () => {
  it("computes paid and deferred totals from profile", () => {
    const members = [
      member({
        id: "m1",
        name: "Alex",
        incomeSources: [{ id: "w1", type: "wages", amount: 200_000 }],
        contributions: [{ id: "c1", type: "401k", amount: 20_000 }],
      }),
      member({
        id: "m2",
        name: "Jordan",
        relationship: "spouse",
        incomeSources: [{ id: "w2", type: "wages", amount: 195_000 }],
        contributions: [{ id: "c2", type: "401k", amount: 20_000 }],
      }),
    ];
    const taxProfile: TaxProfile = {
      id: "hh:2026",
      householdId: "hh",
      taxYear: 2026,
      filingStatus: "married_filing_jointly",
      dependentCount: 0,
      memberIds: ["m1", "m2"],
      inputs: {},
      lastEstimate: {
        federalTax: 60_000,
        adjustedGrossIncome: 355_000,
        effectiveRate: 0.17,
        marginalRate: 0.24,
      },
      contributionLimits: [
        {
          type: "401k",
          memberId: "m1",
          limit: 24_500,
          contributed: 20_000,
          remaining: 4_500,
        },
      ],
    };

    const outlook = computeTaxOutlook({
      taxProfile,
      members,
      earnerScope: "household",
      taxYear: 2026,
      now: new Date("2026-06-15T12:00:00"),
    });

    expect(outlook).not.toBeNull();
    expect(outlook!.paidAnnual).toBeGreaterThan(60_000);
    expect(outlook!.deferredYtd).toBeGreaterThan(0);
    expect(outlook!.onTrackPercent).toBeGreaterThan(0);
  });

  it("scales federal tax by earner wage share", () => {
    const members = [
      member({
        id: "m1",
        name: "Alex",
        incomeSources: [{ id: "w1", type: "wages", amount: 100_000 }],
      }),
      member({
        id: "m2",
        name: "Jordan",
        relationship: "spouse",
        incomeSources: [{ id: "w2", type: "wages", amount: 300_000 }],
      }),
    ];
    const taxProfile: TaxProfile = {
      id: "hh:2026",
      householdId: "hh",
      taxYear: 2026,
      filingStatus: "married_filing_jointly",
      dependentCount: 0,
      memberIds: ["m1", "m2"],
      inputs: {},
      lastEstimate: { federalTax: 40_000, marginalRate: 0.22 },
    };

    const household = computeTaxOutlook({
      taxProfile,
      members,
      earnerScope: "household",
      taxYear: 2026,
      now: new Date("2026-12-31"),
    });
    const alex = computeTaxOutlook({
      taxProfile,
      members,
      earnerScope: "m1",
      taxYear: 2026,
      now: new Date("2026-12-31"),
    });

    expect(alex!.paidBreakdown[0].ytd).toBeCloseTo(
      household!.paidBreakdown[0].ytd * 0.25,
      0
    );
  });

  it("handles members without incomeSources or contributions", () => {
    const members = [
      member({
        id: "m1",
        name: "Alex",
        incomeSources: undefined as unknown as [],
        contributions: undefined as unknown as [],
      }),
    ];
    const taxProfile: TaxProfile = {
      id: "hh:2026",
      householdId: "hh",
      taxYear: 2026,
      filingStatus: "single",
      dependentCount: 0,
      memberIds: ["m1"],
      inputs: {},
      lastEstimate: { federalTax: 10_000, marginalRate: 0.22 },
    };

    expect(
      computeTaxOutlook({
        taxProfile,
        members,
        earnerScope: "household",
        taxYear: 2026,
      })
    ).not.toBeNull();
  });

  it("tracks contribution room usage", () => {
    expect(
      computeOnTrackPercent([
        { type: "401k", limit: 24_500, contributed: 12_250, remaining: 12_250 },
      ])
    ).toBe(50);
  });

  it("measures year progress within calendar year", () => {
    expect(taxYearProgress(2026, new Date("2026-01-01"))).toBe(0);
    expect(taxYearProgress(2025, new Date("2026-06-15"))).toBe(1);
  });
});
