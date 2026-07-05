import { describe, expect, it } from "vitest";
import {
  formatContributionRoom,
  formatTaxRate,
  formatTaxShare,
} from "./display";

describe("tax display", () => {
  it("shows percents when values are locked", () => {
    expect(formatTaxShare(25, 100, false)).toBe("25.0%");
    expect(formatTaxRate(0.24, 0)).toBe("24%");
  });

  it("shows currency when unlocked", () => {
    expect(formatTaxShare(25_000, 100_000, true)).toBe("$25k");
  });

  it("reads redacted contribution room", () => {
    expect(
      formatContributionRoom({ contributionUsedPercent: 82 }, false)
    ).toBe("82% used");
  });
});
