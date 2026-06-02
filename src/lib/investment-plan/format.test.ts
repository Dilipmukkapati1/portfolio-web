import { describe, expect, it } from "vitest";
import { formatCompactCurrency } from "./format";

describe("formatCompactCurrency", () => {
  it("matches wireframe compact amounts", () => {
    expect(formatCompactCurrency(850_000)).toBe("$850k");
    expect(formatCompactCurrency(1_250_000)).toBe("$1.3M");
    expect(formatCompactCurrency(500)).toBe("$500");
  });

  it("hides when locked", () => {
    expect(formatCompactCurrency(850_000, { hidden: true })).toBe("—");
  });
});
