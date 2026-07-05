import type { AccountsTab } from "@/components/accounts/accounts-section-tabs";
import type { ExpensePlannerTab } from "@/components/expense-planner/expense-planner-bottom-nav";
import type { HouseholdTab } from "@/components/household/household-section-tabs";
import type { InvestmentPlanTab } from "@/components/investment-plan/investment-plan-bottom-nav";
import type { TaxTab } from "@/components/tax/tax-section-tabs";

export type HoldingsGroupMode = "account" | "symbol" | "category";
export type HoldingsViewMode = "holdings" | "allocation";
export type HoldingsChartStyle = "pie" | "table";

export function parseAccountsTab(value: string | null): AccountsTab {
  if (value === "connections") return "connections";
  return "accounts";
}

export function parseHouseholdTab(value: string | null): HouseholdTab {
  if (value === "overview" || value === "members" || value === "chat") {
    return value;
  }
  return "overview";
}

export function parseTaxTab(value: string | null): TaxTab {
  if (value === "plan" || value === "advisor" || value === "overview") {
    return value;
  }
  return "overview";
}

export function parseExpensePlannerTab(value: string | null): ExpensePlannerTab {
  if (
    value === "plan" ||
    value === "outlook" ||
    value === "mappings" ||
    value === "chat"
  ) {
    return value;
  }
  return "overview";
}

export function parseInvestmentPlanTab(value: string | null): InvestmentPlanTab {
  if (value === "plan" || value === "outlook") {
    return value;
  }
  return "allocation";
}

export function parseHoldingsViewMode(value: string | null): HoldingsViewMode {
  if (value === "holdings" || value === "allocation") {
    return value;
  }
  return "allocation";
}

export function parseHoldingsGroupMode(value: string | null): HoldingsGroupMode {
  if (value === "account" || value === "symbol" || value === "category") {
    return value;
  }
  return "category";
}

export function parseHoldingsChartStyle(value: string | null): HoldingsChartStyle {
  if (value === "pie" || value === "table") {
    return value;
  }
  return "pie";
}

export function shouldOmitTabFromUrl<T extends string>(
  tab: T,
  defaultTab: T,
  omitDefaultFromUrl: boolean
): boolean {
  return omitDefaultFromUrl && tab === defaultTab;
}

export function buildTabQueryString(
  tab: string,
  existingParams: URLSearchParams,
  options: { defaultTab: string; omitDefaultFromUrl?: boolean }
): string {
  const params = new URLSearchParams(existingParams.toString());
  if (shouldOmitTabFromUrl(tab, options.defaultTab, options.omitDefaultFromUrl ?? false)) {
    params.delete("tab");
  } else {
    params.set("tab", tab);
  }
  return params.toString();
}

export type HoldingsQueryState = {
  view: HoldingsViewMode;
  group: HoldingsGroupMode;
  chart: HoldingsChartStyle;
};

const HOLDINGS_DEFAULTS: HoldingsQueryState = {
  view: "allocation",
  group: "category",
  chart: "pie",
};

export function shouldOmitHoldingsParam(
  key: keyof HoldingsQueryState,
  state: HoldingsQueryState
): boolean {
  if (state[key] === HOLDINGS_DEFAULTS[key]) {
    return true;
  }
  if (key === "chart" && state.view !== "allocation") {
    return true;
  }
  return false;
}

export function buildHoldingsQueryString(
  state: HoldingsQueryState,
  existingParams?: URLSearchParams
): string {
  const params = new URLSearchParams(existingParams?.toString() ?? "");
  params.delete("view");
  params.delete("group");
  params.delete("chart");

  if (!shouldOmitHoldingsParam("view", state)) {
    params.set("view", state.view);
  }
  if (!shouldOmitHoldingsParam("group", state)) {
    params.set("group", state.group);
  }
  if (!shouldOmitHoldingsParam("chart", state)) {
    params.set("chart", state.chart);
  }

  return params.toString();
}

export function parseHoldingsQueryState(
  searchParams: URLSearchParams
): HoldingsQueryState {
  return {
    view: parseHoldingsViewMode(searchParams.get("view")),
    group: parseHoldingsGroupMode(searchParams.get("group")),
    chart: parseHoldingsChartStyle(searchParams.get("chart")),
  };
}
