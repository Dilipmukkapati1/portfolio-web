import type { AdvisorPageContext } from "@portfolio/contracts";
import { composeAdvisorPageContext } from "@portfolio/contracts";
import { getActiveHouseholdId } from "@/lib/household-session";

const STORAGE_KEY = "advisor:pageContext";

export function persistAdvisorPageContext(context: AdvisorPageContext): void {
  if (typeof window === "undefined") return;
  const householdId = getActiveHouseholdId();
  sessionStorage.setItem(`${STORAGE_KEY}:${householdId}`, JSON.stringify(context));
}

export function readAdvisorPageContext(): AdvisorPageContext | null {
  if (typeof window === "undefined") return null;
  const householdId = getActiveHouseholdId();
  const raw = sessionStorage.getItem(`${STORAGE_KEY}:${householdId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdvisorPageContext;
  } catch {
    return null;
  }
}

export function clearAdvisorPageContext(): void {
  if (typeof window === "undefined") return;
  const householdId = getActiveHouseholdId();
  sessionStorage.removeItem(`${STORAGE_KEY}:${householdId}`);
}

export function resolveAdvisorPageContext(
  route: string,
  snapshot: Record<string, unknown> = {},
  options?: { starterPrompts?: string[]; sourceLabelSuffix?: string }
): AdvisorPageContext {
  return composeAdvisorPageContext(route, snapshot, options);
}

export type TaxPageSnapshotInput = {
  tab: string;
  taxView: string;
  earnerScope: string;
  taxYear: number;
  onTrackPct?: number;
  openStrategies?: Array<{ id: string; title: string; estimatedSavings?: number }>;
  contributionRoom?: Array<{ label: string; remaining?: number }>;
};

export function buildTaxPageSnapshot(input: TaxPageSnapshotInput): Record<string, unknown> {
  return {
    tab: input.tab,
    taxView: input.taxView,
    earnerScope: input.earnerScope,
    taxYear: input.taxYear,
    onTrackPct: input.onTrackPct,
    openStrategies: input.openStrategies,
    contributionRoom: input.contributionRoom,
  };
}

export type HouseholdPageSnapshotInput = {
  persona?: string;
  filingStatus?: string;
  dependents?: number;
  memberCount?: number;
  setupGaps?: string[];
};

export function buildHouseholdPageSnapshot(
  input: HouseholdPageSnapshotInput
): Record<string, unknown> {
  return { ...input };
}

export type FinancialPlanPageSnapshotInput = {
  driftPct?: number;
  uninvestedCash?: number;
  topDrifts?: Array<{ label: string; driftPct: number }>;
};

export function buildFinancialPlanPageSnapshot(
  input: FinancialPlanPageSnapshotInput
): Record<string, unknown> {
  return { ...input };
}

export type ExpensePlannerPageSnapshotInput = {
  overBudgetCategories?: string[];
  monthlyTotal?: number;
  activeTab?: string;
};

export function buildExpensePlannerPageSnapshot(
  input: ExpensePlannerPageSnapshotInput
): Record<string, unknown> {
  return { ...input };
}

export type DashboardPageSnapshotInput = {
  freedomScore?: number;
  netWorth?: number;
  topAllocationBuckets?: Array<{ label: string; percent: number }>;
};

export function buildDashboardPageSnapshot(
  input: DashboardPageSnapshotInput
): Record<string, unknown> {
  return { ...input };
}

export type HoldingsPageSnapshotInput = {
  topHoldings?: Array<{ symbol: string; unrealizedGain?: number }>;
  unrealizedGainLoss?: number;
  filters?: Record<string, string>;
};

export function buildHoldingsPageSnapshot(
  input: HoldingsPageSnapshotInput
): Record<string, unknown> {
  return { ...input };
}

export type AccountsPageSnapshotInput = {
  accountsByTreatment?: Record<string, number>;
  totalCash?: number;
};

export function buildAccountsPageSnapshot(
  input: AccountsPageSnapshotInput
): Record<string, unknown> {
  return { ...input };
}
