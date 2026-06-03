import { describe, expect, it } from "vitest";
import { buildDefaultExpensePlan } from "@portfolio/contracts";
import {
  hiddenCategoryPreferences,
  mergeCategoryLabel,
  visibleCategoryPreferences,
} from "./categories";

describe("categories helpers", () => {
  it("filters visible categories", () => {
    const plan = buildDefaultExpensePlan("hh-1");
    const visible = visibleCategoryPreferences(plan.categories);
    expect(visible.some((c) => c.category === "food")).toBe(true);
    expect(visible.some((c) => c.category === "income")).toBe(false);
  });

  it("lists hidden categories for add flow", () => {
    const plan = buildDefaultExpensePlan("hh-1");
    const hidden = hiddenCategoryPreferences(plan.categories);
    expect(hidden.some((c) => c.category === "income")).toBe(true);
  });

  it("merges custom labels", () => {
    const plan = buildDefaultExpensePlan("hh-1");
    const food = plan.categories.find((c) => c.category === "food")!;
    food.label = "Groceries";
    expect(mergeCategoryLabel("food", plan.categories)).toBe("Groceries");
  });
});
