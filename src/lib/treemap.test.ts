import { describe, expect, it } from "vitest";
import { squarifyTreemap } from "./treemap";

describe("squarifyTreemap", () => {
  it("fills the container for positive weights", () => {
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
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
    }
  });
});
