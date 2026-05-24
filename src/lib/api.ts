import type { Household, Member, TaxProfile } from "@/lib/household-types";
import { getActiveHouseholdId } from "@/lib/household-session";
import { getWebEnv } from "@/lib/env";

function getApiUrl(): string {
  return getWebEnv().apiUrl;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${getApiUrl()}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-household-id": getActiveHouseholdId(),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((err as { error?: string }).error ?? "API error");
    }
    return res.json() as Promise<T>;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        "Request timed out. Is the portfolio API running at " + getApiUrl() + "?"
      );
    }
    if (e instanceof TypeError) {
      throw new Error(
        "Cannot reach the API at " +
          getApiUrl() +
          ". Start portfolio-api locally (port 7071) or set NEXT_PUBLIC_API_URL."
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  health: () => apiFetch<{ status: string }>("/health"),
  listHouseholds: () =>
    apiFetch<{ households: Household[] }>("/households"),
  getHousehold: () => apiFetch<Household>("/household"),
  getHouseholdById: (householdId: string) =>
    apiFetch<Household>(`/households/${encodeURIComponent(householdId)}`),
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
    apiFetch<{ accounts: Array<Record<string, unknown>> }>("/accounts"),
  getTransactions: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch<{ transactions: Array<Record<string, unknown>> }>(
      `/transactions${q ? `?${q}` : ""}`
    );
  },
  getHoldings: () =>
    apiFetch<{ holdings: Array<Record<string, unknown>> }>("/holdings"),
  getNetWorth: () => apiFetch<Record<string, unknown>>("/networth"),
  getIntegrationsStatus: () =>
    apiFetch<{
      simplefin: {
        connected: boolean;
        lastSyncedAt?: string;
        lastError?: string;
      };
      snaptrade: { connected: boolean };
    }>("/integrations/status"),
  connectSimplefin: (setupToken: string) =>
    apiFetch("/integrations/simplefin/connect", {
      method: "POST",
      body: JSON.stringify({ setupToken }),
    }),
  syncSimplefin: (now = false) =>
    apiFetch(`/integrations/simplefin/sync${now ? "?now=true" : ""}`, {
      method: "POST",
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
    apiFetch<TaxProfile>(
      householdId
        ? `/households/${encodeURIComponent(householdId)}/tax-profiles/${taxYear}`
        : `/tax-profiles/${taxYear}`
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
