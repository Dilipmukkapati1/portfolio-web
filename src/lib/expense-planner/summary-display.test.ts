import { describe, expect, it } from "vitest";
import {
  buildCategoryPieData,
  categorySpendSlice,
  hasSpendData,
  pieChartTotal,
  topCategorySlices,
} from "./summary-display";

describe("summary-display", () => {
  const categories = [{ category: "groceries" }, { category: "dining" }];

  it("reads dollars when unlocked", () => {
    const summary = {
      totalSpend: 300,
      spendByCategory: { groceries: 200, dining: 100 },
      spendByCategoryPercent: { groceries: 66.67, dining: 33.33 },
      transactionCount: 5,
    };
    expect(categorySpendSlice(summary, "groceries", true)).toBe(200);
    expect(
      buildCategoryPieData(summary, categories, (c) => c, true)
    ).toEqual([
      { label: "groceries", value: 200 },
      { label: "dining", value: 100 },
    ]);
    expect(pieChartTotal([{ value: 200 }, { value: 100 }], true, 300)).toBe(300);
  });

  it("reads percents when locked", () => {
    const summary = {
      spendByCategoryPercent: { groceries: 70, dining: 30 },
      transactionCount: 4,
    };
    expect(categorySpendSlice(summary, "groceries", false)).toBe(70);
    expect(hasSpendData(summary)).toBe(true);
    const pie = buildCategoryPieData(summary, categories, (c) => c, false);
    expect(pieChartTotal(pie, false, 0)).toBe(100);
    expect(topCategorySlices(summary, false)[0]?.category).toBe("groceries");
  });
});
