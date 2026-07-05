import { describe, expect, it } from "vitest";
import {
  resolvedBonusAmount,
  resolveHouseholdIncomeBreakdown,
  resolvedHouseholdIncomeTotal,
  resolvedMemberIncomeTotal,
} from "./household-income";

describe("household-income", () => {
  it("includes percent bonus in resolved income total", () => {
    const member = {
      incomeSources: [
        { id: "w1", type: "wages" as const, amount: 200_000 },
        {
          id: "b1",
          type: "bonus" as const,
          amount: 0,
          amountMode: "percent_of_wages" as const,
          percent: 18,
        },
      ],
    };
    expect(resolvedBonusAmount(member)).toBe(36_000);
    expect(resolvedMemberIncomeTotal(member)).toBe(236_000);
  });

  it("sums active member income for household total", () => {
    expect(
      resolvedHouseholdIncomeTotal([
        {
          isActive: true,
          incomeSources: [{ id: "w1", type: "wages", amount: 100_000 }],
        },
        {
          isActive: true,
          incomeSources: [{ id: "w2", type: "wages", amount: 80_000 }],
        },
        {
          isActive: false,
          incomeSources: [{ id: "w3", type: "wages", amount: 50_000 }],
        },
      ])
    ).toBe(180_000);
  });

  it("breaks household income down by category", () => {
    expect(
      resolveHouseholdIncomeBreakdown([
        {
          isActive: true,
          incomeSources: [
            { id: "w1", type: "wages", amount: 200_000 },
            {
              id: "b1",
              type: "bonus",
              amount: 0,
              amountMode: "percent_of_wages",
              percent: 10,
            },
            { id: "c1", type: "cash_income", amount: 5_000 },
          ],
        },
        {
          isActive: true,
          incomeSources: [{ id: "d1", type: "dividends", amount: 2_000 }],
        },
      ])
    ).toEqual({
      total: 227_000,
      wages: 200_000,
      bonus: 20_000,
      cashIncome: 5_000,
      other: 2_000,
      earnerCount: 2,
    });
  });
});
