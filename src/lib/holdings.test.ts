import { describe, expect, it } from "vitest";
import {
  computeAllocations,
  getHoldingValue,
  groupHoldingsBySymbol,
  type HoldingRecord,
} from "./holdings.js";

function holding(
  overrides: Partial<HoldingRecord> & Pick<HoldingRecord, "holdingId" | "accountId" | "symbol">
): HoldingRecord {
  return {
    quantity: 0,
    ...overrides,
  };
}

describe("groupHoldingsBySymbol", () => {
  it("aggregates quantity and value across accounts for the same symbol", () => {
    const holdings = [
      holding({
        holdingId: "acct-1-VOO",
        accountId: "acct-1",
        symbol: "VOO",
        description: "Vanguard S&P 500",
        quantity: 10,
        price: 400,
        marketValue: 4000,
      }),
      holding({
        holdingId: "acct-2-VOO",
        accountId: "acct-2",
        symbol: "voo",
        quantity: 5,
        price: 410,
        marketValue: 2050,
      }),
      holding({
        holdingId: "acct-1-AAPL",
        accountId: "acct-1",
        symbol: "AAPL",
        quantity: 20,
        marketValue: 3000,
      }),
    ];

    const grouped = groupHoldingsBySymbol(holdings);

    expect(grouped).toHaveLength(2);
    expect(grouped[0].symbol).toBe("VOO");
    expect(grouped[0].totalQuantity).toBe(15);
    expect(grouped[0].totalMarketValue).toBe(6050);
    expect(grouped[0].weightedAvgPrice).toBeCloseTo(403.333, 2);
    expect(grouped[0].accounts).toHaveLength(2);
    expect(grouped[1].symbol).toBe("AAPL");
  });

  it("sorts cash last and securities by value descending", () => {
    const holdings = [
      holding({
        holdingId: "acct-1-CASH",
        accountId: "acct-1",
        symbol: "CASH",
        marketValue: 500,
      }),
      holding({
        holdingId: "acct-1-MSFT",
        accountId: "acct-1",
        symbol: "MSFT",
        marketValue: 1000,
      }),
      holding({
        holdingId: "acct-2-CASH",
        accountId: "acct-2",
        symbol: "cash",
        marketValue: 200,
      }),
    ];

    const grouped = groupHoldingsBySymbol(holdings);

    expect(grouped.map((g) => g.symbol)).toEqual(["MSFT", "CASH"]);
    expect(grouped[1].totalMarketValue).toBe(700);
    expect(grouped[1].accounts).toHaveLength(2);
  });
});

describe("computeAllocations", () => {
  it("calculates portfolio percentages from slice values", () => {
    const allocations = computeAllocations([
      { id: "a", label: "A", value: 75 },
      { id: "b", label: "B", value: 25 },
    ]);

    expect(allocations[0].percent).toBe(75);
    expect(allocations[1].percent).toBe(25);
  });
});

describe("getHoldingValue", () => {
  it("falls back to quantity times price when market value is missing", () => {
    const value = getHoldingValue(
      holding({
        holdingId: "1",
        accountId: "acct",
        symbol: "XYZ",
        quantity: 2,
        price: 50,
      })
    );

    expect(value).toBe(100);
  });
});
