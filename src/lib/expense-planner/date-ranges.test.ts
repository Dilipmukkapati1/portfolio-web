import { describe, expect, it } from "vitest";
import {
  clampSummaryDateRange,
  daysInRange,
  durationRange,
  isRangeWithinLimit,
  outlookRange,
} from "./date-ranges";

const REF = new Date("2026-06-03T12:00:00");

describe("durationRange", () => {
  it("returns current month range", () => {
    const range = durationRange("current-month", "", "", REF);
    expect(range.startDate).toBe("2026-06-01");
    expect(range.endDate).toBe("2026-06-03");
    expect(range.label).toContain("June");
  });

  it("returns last 3 months label", () => {
    const range = durationRange("last-3-months", "", "", REF);
    expect(range.label).toBe("Last 3 months");
  });

  it("validates custom range within API limit", () => {
    expect(isRangeWithinLimit("2025-06-01", "2026-06-01")).toBe(true);
    expect(isRangeWithinLimit("2020-01-01", "2026-06-01")).toBe(false);
  });

  it("clamps last-year range to the API summary day limit", () => {
    const range = durationRange("last-year", "", "", REF);
    const clamped = clampSummaryDateRange(range.startDate, range.endDate);
    expect(daysInRange(clamped.startDate, clamped.endDate)).toBeLessThanOrEqual(366);
  });
});

describe("outlookRange", () => {
  it("returns next 3 months", () => {
    const range = outlookRange("next-3-months", "", "", REF);
    expect(range.monthCount).toBe(3);
    expect(range.label).toBe("Next 3 months");
  });
});
