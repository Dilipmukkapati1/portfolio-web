const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7071/api";
const HOUSEHOLD_ID =
  process.env.NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID ?? "local-household";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-household-id": HOUSEHOLD_ID,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "API error");
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => apiFetch<{ status: string }>("/health"),
  getHousehold: () => apiFetch<Record<string, unknown>>("/household"),
  updateHousehold: (body: unknown) =>
    apiFetch("/household", { method: "PUT", body: JSON.stringify(body) }),
  createHousehold: (body: unknown) =>
    apiFetch("/household", { method: "POST", body: JSON.stringify(body) }),
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
    apiFetch<{ strategies: Array<Record<string, unknown>>; disclaimer: string }>(
      `/tax/strategies${wages ? `?wages=${wages}` : ""}`
    ),
};
