import { describe, expect, it } from "vitest";
import { buildRingSegments, MIN_SLICE_PERCENT } from "./ring-segments";

describe("buildRingSegments", () => {
  it("skips classes at 0%", () => {
    const segments = buildRingSegments(100, 100, 40, 60, [
      { label: "Stocks", value: 50, fill: "#f00" },
      { label: "Bonds", value: 0, fill: "#0f0" },
      { label: "Cash", value: 0, fill: "#00f" },
    ]);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.label).toBe("Stocks");
  });

  it("does not normalize non-zero slices to fill the full ring", () => {
    const partial = buildRingSegments(100, 100, 40, 60, [
      { label: "Stocks", value: 30, fill: "#f00" },
      { label: "Bonds", value: 20, fill: "#0f0" },
    ]);
    const full = buildRingSegments(100, 100, 40, 60, [
      { label: "Stocks", value: 60, fill: "#f00" },
      { label: "Bonds", value: 40, fill: "#0f0" },
    ]);
    expect(partial[0]?.d).not.toBe(full[0]?.d);
  });

  it("treats values at or below the minimum threshold as empty", () => {
    const segments = buildRingSegments(100, 100, 40, 60, [
      { label: "Stocks", value: MIN_SLICE_PERCENT, fill: "#f00" },
      { label: "Bonds", value: MIN_SLICE_PERCENT + 0.01, fill: "#0f0" },
    ]);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.label).toBe("Bonds");
  });
});
