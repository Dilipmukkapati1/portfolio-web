export type HoldingRecord = {
  holdingId: string;
  accountId: string;
  symbol: string;
  description?: string;
  quantity: number;
  price?: number;
  marketValue?: number;
  currency?: string;
};

export function parseHoldings(
  raw: Array<Record<string, unknown>>
): HoldingRecord[] {
  return raw.map((h) => ({
    holdingId: String(h.holdingId ?? h.id),
    accountId: String(h.accountId),
    symbol: String(h.symbol),
    description: h.description ? String(h.description) : undefined,
    quantity: Number(h.quantity) || 0,
    price: h.price != null ? Number(h.price) : undefined,
    marketValue: h.marketValue != null ? Number(h.marketValue) : undefined,
    currency: h.currency ? String(h.currency) : undefined,
  }));
}

export function groupHoldingsByAccount(
  holdings: HoldingRecord[]
): Map<string, HoldingRecord[]> {
  const map = new Map<string, HoldingRecord[]>();
  for (const holding of holdings) {
    const list = map.get(holding.accountId) ?? [];
    list.push(holding);
    map.set(holding.accountId, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      if (a.symbol === "CASH") return 1;
      if (b.symbol === "CASH") return -1;
      return a.symbol.localeCompare(b.symbol);
    });
  }
  return map;
}

export function holdingsTotalValue(holdings: HoldingRecord[]): number {
  return holdings.reduce((sum, h) => sum + (h.marketValue ?? 0), 0);
}

export function isCashHolding(holding: HoldingRecord): boolean {
  return holding.symbol.toUpperCase() === "CASH";
}

/** Non-cash security positions (brokerage). */
export function hasSecurities(holdings: HoldingRecord[]): boolean {
  return holdings.some(
    (h) =>
      !isCashHolding(h) &&
      ((h.marketValue ?? 0) > 0 || (h.quantity ?? 0) > 0)
  );
}
