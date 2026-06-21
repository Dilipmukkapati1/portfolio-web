import { describe, expect, it } from "vitest";
import {
  resolvedBonusAmount,
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
});
