import type { Household, Member, TaxProfile } from "@/lib/household-types";
import { getActiveHouseholdId } from "@/lib/household-session";
import { getWebEnv } from "@/lib/env";

function getApiUrl(): string {
  return getWebEnv().apiUrl;
}

let privacyToken: string | null = null;
let privacyUnauthorizedHandler: (() => void) | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function unwrapEnvelope<T>(value: T | { household?: T }): T {
  if (
    value &&
    typeof value === "object" &&
    "household" in value &&
    (value as { household?: T }).household
  ) {
    return (value as { household: T }).household;
  }
  return value as T;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 60_000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-household-id": getActiveHouseholdId(),
      ...(fetchOptions.headers as Record<string, string> | undefined),
    };
    if (privacyToken) headers["x-privacy-token"] = privacyToken;

    const res = await fetch(`${getApiUrl()}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      const message =
        (err as { error?: string }).error?.trim() ||
        res.statusText ||
        "API error";
      const apiError = new ApiError(message, res.status);
      if ((res.status === 401 || res.status === 403) && privacyToken) {
        privacyUnauthorizedHandler?.();
      }
      throw apiError;
    }
    return res.json() as Promise<T>;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new ApiError(
        "Request timed out. Is the portfolio API running at " + getApiUrl() + "?"
        ,
        0,
        "timeout"
      );
    }
    if (e instanceof TypeError) {
      throw new ApiError(
        "Cannot reach the API at " +
          getApiUrl() +
          ". Start portfolio-api locally (port 7071) or set NEXT_PUBLIC_API_URL."
        ,
        0,
        "network"
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  setPrivacyToken: (token: string | null) => {
    privacyToken = token;
  },
  setPrivacyUnauthorizedHandler: (handler: (() => void) | null) => {
    privacyUnauthorizedHandler = handler;
  },
  unlockPrivacy: (password: string) =>
    apiFetch<{ privacyToken: string; expiresAt: string }>("/privacy/unlock", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  lockPrivacy: () => {
    privacyToken = null;
  },
  health: () => apiFetch<{ status: string }>("/health"),
  listHouseholds: () =>
    apiFetch<{ households: Household[] }>("/households"),
  getHousehold: async () => unwrapEnvelope(await apiFetch<Household | { household: Household }>("/household")),
  getHouseholdById: (householdId: string) =>
    apiFetch<Household | { household: Household }>(
      `/households/${encodeURIComponent(householdId)}`
    ).then(unwrapEnvelope),
  updateHousehold: (body: unknown) =>
    apiFetch<Household>("/household", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  updateHouseholdById: (householdId: string, body: unknown) =>
    apiFetch<Household>(`/households/${encodeURIComponent(householdId)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  createHousehold: (body: unknown) =>
    apiFetch<Household>("/household", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createHouseholdWithId: (body: unknown) =>
    apiFetch<Household>("/households", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteHouseholds: (householdIds: string[]) =>
    apiFetch<{
      deleted: string[];
      failed: Array<{ householdId: string; reason: string }>;
    }>("/households", {
      method: "DELETE",
      body: JSON.stringify({ householdIds }),
    }),
  getAccounts: () =>
    apiFetch<{
      privacyMode?: "locked" | "unlocked";
      valuesUnlocked?: boolean;
      accounts: Array<Record<string, unknown>>;
    }>("/accounts"),
  getTransactions: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch<{
      privacyMode?: "locked" | "unlocked";
      valuesUnlocked?: boolean;
      transactions: Array<Record<string, unknown>>;
      hasMore: boolean;
      nextCursor?: string;
    }>(`/transactions${q ? `?${q}` : ""}`);
  },
  getTransactionSummary: (params: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch<{
      privacyMode?: "locked" | "unlocked";
      valuesUnlocked?: boolean;
      totalCredits?: number;
      totalSpend?: number;
      spendByCategory?: Record<string, number>;
      spendByCategoryPercent?: Record<string, number>;
      transactionCount: number;
    }>(`/transactions/summary?${q}`);
  },
  getHoldings: () =>
    apiFetch<{
      privacyMode?: "locked" | "unlocked";
      valuesUnlocked?: boolean;
      holdings: Array<Record<string, unknown>>;
    }>("/holdings"),
  getNetWorth: () => apiFetch<Record<string, unknown>>("/networth"),
  getDashboardAnalytics: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch<Record<string, unknown>>(
      `/analytics/dashboard${q ? `?${q}` : ""}`
    );
  },
  getArchitect: (params?: {
    search?: string;
    timeframe?: "1d" | "1w" | "1m";
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.timeframe) q.set("timeframe", params.timeframe);
    const query = q.toString();
    return apiFetch<Record<string, unknown>>(
      `/architect${query ? `?${query}` : ""}`
    );
  },
  updateArchitectPlan: (body: unknown) =>
    apiFetch<Record<string, unknown>>("/architect/plan", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getInstrumentAnalysis: (symbol: string, period: "quarterly" | "yearly") => {
    const q = new URLSearchParams({ period });
    return apiFetch<Record<string, unknown>>(
      `/analyzer/${encodeURIComponent(symbol)}/instrument-analysis?${q}`
    );
  },
  getIntegrationsStatus: () =>
    apiFetch<{
      simplefin: {
        connected: boolean;
        lastSyncedAt?: string;
        lastError?: string;
      };
      snaptrade: {
        connected: boolean;
        lastSyncedAt?: string;
        lastError?: string;
      };
    }>("/integrations/status"),
  connectSimplefin: (setupToken: string) =>
    apiFetch("/integrations/simplefin/connect", {
      method: "POST",
      body: JSON.stringify({ setupToken }),
    }),
  syncSimplefin: () =>
    apiFetch("/integrations/simplefin/sync", {
      method: "POST",
      timeoutMs: 120_000,
    }),
  syncSnaptrade: () =>
    apiFetch("/integrations/snaptrade/sync", {
      method: "POST",
      timeoutMs: 120_000,
    }),
  connectSnaptrade: () =>
    apiFetch<{ redirectUri: string }>("/integrations/snaptrade/connect", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  taxEstimate: (body: unknown) =>
    apiFetch<{ estimate: Record<string, unknown>; disclaimer: string }>(
      "/tax/estimate",
      { method: "POST", body: JSON.stringify(body) }
    ),
  taxStrategies: (wages?: number) =>
    apiFetch<{
      strategies: Array<Record<string, unknown>>;
      taxProfile?: TaxProfile;
      disclaimer: string;
    }>(`/tax/strategies${wages !== undefined ? `?wages=${wages}` : ""}`),
  listMembers: (householdId?: string) =>
    apiFetch<{ members: Member[] }>(
      householdId
        ? `/households/${encodeURIComponent(householdId)}/members`
        : "/members"
    ),
  saveMembers: (members: unknown[], householdId?: string) =>
    apiFetch<{ members: Member[] }>(
      householdId
        ? `/households/${encodeURIComponent(householdId)}/members`
        : "/members",
      { method: "PUT", body: JSON.stringify({ members }) }
    ),
  getTaxProfile: (taxYear: number, householdId?: string) =>
    apiFetch<TaxProfile | { taxProfile: TaxProfile }>(
      householdId
        ? `/households/${encodeURIComponent(householdId)}/tax-profiles/${taxYear}`
        : `/tax-profiles/${taxYear}`
    ).then((value) =>
      value && typeof value === "object" && "taxProfile" in value
        ? (value as { taxProfile: TaxProfile }).taxProfile
        : (value as TaxProfile)
    ),
  updateTaxProfile: (
    taxYear: number,
    body: unknown,
    householdId?: string
  ) =>
    apiFetch<{ taxProfile: TaxProfile; household: Household }>(
      householdId
        ? `/households/${encodeURIComponent(householdId)}/tax-profiles/${taxYear}`
        : `/tax-profiles/${taxYear}`,
      { method: "PUT", body: JSON.stringify(body) }
    ),
  recomputeTaxProfile: (taxYear: number, body?: unknown, householdId?: string) =>
    apiFetch<{ taxProfile: TaxProfile; household: Household }>(
      householdId
        ? `/households/${encodeURIComponent(householdId)}/tax-profiles/${taxYear}/recompute`
        : `/tax-profiles/${taxYear}/recompute`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }
    ),
};
