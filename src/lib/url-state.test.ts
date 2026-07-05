import { describe, expect, it } from "vitest";
import {
  buildHoldingsQueryString,
  buildTabQueryString,
  parseAccountsTab,
  parseExpensePlannerTab,
  parseHoldingsChartStyle,
  parseHoldingsGroupMode,
  parseHoldingsQueryState,
  parseHoldingsViewMode,
  parseHouseholdTab,
  parseInvestmentPlanTab,
  parseTaxTab,
  shouldOmitHoldingsParam,
  shouldOmitTabFromUrl,
} from "./url-state";

describe("tab parsers", () => {
  it("falls back to defaults for invalid tab values", () => {
    expect(parseAccountsTab("invalid")).toBe("accounts");
    expect(parseAccountsTab(null)).toBe("accounts");
    expect(parseHouseholdTab("nope")).toBe("overview");
    expect(parseTaxTab("")).toBe("overview");
    expect(parseExpensePlannerTab("chatty")).toBe("overview");
    expect(parseInvestmentPlanTab("allocation")).toBe("allocation");
    expect(parseInvestmentPlanTab("bad")).toBe("allocation");
  });

  it("accepts valid tab values", () => {
    expect(parseAccountsTab("connections")).toBe("connections");
    expect(parseHouseholdTab("chat")).toBe("chat");
    expect(parseTaxTab("advisor")).toBe("advisor");
    expect(parseExpensePlannerTab("mappings")).toBe("mappings");
    expect(parseInvestmentPlanTab("outlook")).toBe("outlook");
  });
});

describe("shouldOmitTabFromUrl", () => {
  it("omits default tab only when configured", () => {
    expect(shouldOmitTabFromUrl("accounts", "accounts", true)).toBe(true);
    expect(shouldOmitTabFromUrl("connections", "accounts", true)).toBe(false);
    expect(shouldOmitTabFromUrl("overview", "overview", false)).toBe(false);
  });
});

describe("buildTabQueryString", () => {
  it("removes tab param for default accounts tab", () => {
    const query = buildTabQueryString("accounts", new URLSearchParams("tab=connections"), {
      defaultTab: "accounts",
      omitDefaultFromUrl: true,
    });
    expect(query).toBe("");
  });

  it("preserves unrelated params when switching tabs", () => {
    const query = buildTabQueryString("plan", new URLSearchParams("tab=overview&from=/holdings"), {
      defaultTab: "overview",
      omitDefaultFromUrl: false,
    });
    expect(query).toBe("tab=plan&from=%2Fholdings");
  });
});

describe("holdings parsers", () => {
  it("falls back to defaults for invalid values", () => {
    expect(parseHoldingsViewMode("pie")).toBe("allocation");
    expect(parseHoldingsGroupMode("by-account")).toBe("category");
    expect(parseHoldingsChartStyle("bar")).toBe("pie");
  });

  it("parses query state from search params", () => {
    const state = parseHoldingsQueryState(
      new URLSearchParams("view=holdings&group=symbol&chart=table")
    );
    expect(state).toEqual({
      view: "holdings",
      group: "symbol",
      chart: "table",
    });
  });
});

describe("buildHoldingsQueryString", () => {
  it("omits default params for clean URLs", () => {
    expect(
      buildHoldingsQueryString({
        view: "allocation",
        group: "category",
        chart: "pie",
      })
    ).toBe("");
  });

  it("includes non-default params", () => {
    expect(
      buildHoldingsQueryString({
        view: "holdings",
        group: "symbol",
        chart: "pie",
      })
    ).toBe("view=holdings&group=symbol");
  });

  it("omits chart when view is not allocation", () => {
    expect(
      buildHoldingsQueryString({
        view: "holdings",
        group: "category",
        chart: "table",
      })
    ).toBe("view=holdings");
  });

  it("includes chart table only for allocation view", () => {
    expect(
      buildHoldingsQueryString({
        view: "allocation",
        group: "category",
        chart: "table",
      })
    ).toBe("chart=table");
  });
});

describe("shouldOmitHoldingsParam", () => {
  it("omits chart when not in allocation view", () => {
    expect(
      shouldOmitHoldingsParam("chart", {
        view: "holdings",
        group: "symbol",
        chart: "table",
      })
    ).toBe(true);
  });
});
