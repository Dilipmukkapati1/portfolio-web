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

  it("returns distinct colors for positive and negative performance", () => {
    expect(performanceToHeatColor(3)).not.toBe(performanceToHeatColor(-3));
  });
});
