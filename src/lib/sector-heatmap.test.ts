import { describe, expect, it } from "vitest";
import {
  formatSignedPercent,
  performanceToHeatColor,
} from "./sector-heatmap";

describe("sector heatmap helpers", () => {
  it("formats signed percentages", () => {
    expect(formatSignedPercent(4.28)).toBe("+4.28%");
    expect(formatSignedPercent(-1.24)).toBe("-1.24%");
  });

  it("returns greener colors for positive performance", () => {
    const positive = performanceToHeatColor(3);
    const negative = performanceToHeatColor(-3);
    expect(positive).not.toBe(negative);
    expect(positive).toMatch(/^rgb\(/);
  });
});
