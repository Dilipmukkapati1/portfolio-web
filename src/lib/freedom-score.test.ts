import { describe, expect, it } from "vitest";
import {
  computeFreedomScore,
  sumMemberPassiveIncome,
} from "./freedom-score";
import type { Member } from "./household-types";

function member(
  overrides: Partial<Member> & Pick<Member, "incomeSources">
): Member {
  return {
    id: "m1",
    householdId: "h1",
    name: "Test",
    relationship: "self",
    isActive: true,
    contributions: [],
    ...overrides,
  };
}

describe("sumMemberPassiveIncome", () => {
  it("sums interest and dividends for active members only", () => {
    const members = [
      member({
        isActive: true,
        incomeSources: [
          { id: "i1", type: "interest", amount: 1000 },
          { id: "i2", type: "dividends", amount: 2000 },
          { id: "i3", type: "wages", amount: 90000 },
        ],
      }),
      member({
        id: "m2",
        isActive: false,
        incomeSources: [{ id: "i4", type: "dividends", amount: 5000 }],
      }),
    ];
    expect(sumMemberPassiveIncome(members)).toBe(3000);
  });
});

describe("computeFreedomScore", () => {
  it("returns 80 when income covers 80% of annual expenses", () => {
    // $48k expenses, $38.4k income → 80%
    const result = computeFreedomScore({
      totalInvestments: 900_000,
      monthlySpend: 4000,
      memberPassiveIncomeAnnual: 2400,
    });
    expect(result.annualExpenses).toBe(48_000);
    expect(result.annualIncome).toBe(38_400);
    expect(result.score).toBe(80);
  });

  it("caps score at 100", () => {
    const result = computeFreedomScore({
      totalInvestments: 1_000_000,
      monthlySpend: 4000,
      memberPassiveIncomeAnnual: 8000,
    });
    expect(result.score).toBe(100);
  });

  it("returns null score when monthly spend is zero", () => {
    const result = computeFreedomScore({
      totalInvestments: 500_000,
      monthlySpend: 0,
      memberPassiveIncomeAnnual: 5000,
    });
    expect(result.score).toBeNull();
    expect(result.annualExpenses).toBe(0);
  });

  it("returns 0 when there is no income and positive spend", () => {
    const result = computeFreedomScore({
      totalInvestments: 0,
      monthlySpend: 2000,
      memberPassiveIncomeAnnual: 0,
    });
    expect(result.score).toBe(0);
  });
});
