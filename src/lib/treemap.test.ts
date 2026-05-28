import { describe, expect, it } from "vitest";
import { squarifyTreemap } from "./treemap";

describe("squarifyTreemap", () => {
  it("fills the container without gaps for positive weights", () => {
    const rects = squarifyTreemap(
      [
        { id: "a", value: 40 },
        { id: "b", value: 25 },
        { id: "c", value: 20 },
        { id: "d", value: 15 },
      ],
      100,
      60
    );
    expect(rects).toHaveLength(4);
    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(100.01);
      expect(rect.y + rect.height).toBeLessThanOrEqual(60.01);
    }
  });

  it("returns empty layout when total value is zero", () => {
    expect(squarifyTreemap([{ id: "a", value: 0 }], 100, 60)).toEqual([]);
  });
});
