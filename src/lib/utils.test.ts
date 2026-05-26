import { describe, expect, it } from "vitest";
import { formatCurrency, formatPercent } from "./utils";

describe("format helpers", () => {
  it("hides currency when privacy mode is locked", () => {
    expect(formatCurrency(1234.56, { hidden: true })).toBe("—");
  });

  it("formats invalid percentages as unavailable", () => {
    expect(formatPercent(undefined)).toBe("—");
    expect(formatPercent(Number.NaN)).toBe("—");
  });
});
