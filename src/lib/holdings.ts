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

export type SymbolAccountBreakdown = {
  accountId: string;
  quantity: number;
  marketValue: number;
  price?: number;
};

export type SymbolAggregate = {
  symbol: string;
  description?: string;
  isCash: boolean;
  totalQuantity: number;
  totalMarketValue: number;
  weightedAvgPrice?: number;
  accounts: SymbolAccountBreakdown[];
};

export type AllocationSlice = {
  id: string;
  label: string;
  value: number;
  percent: number;
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

export function getHoldingValue(holding: HoldingRecord): number {
  return holding.marketValue ?? holding.quantity * (holding.price ?? 0);
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

export function groupHoldingsBySymbol(
  holdings: HoldingRecord[]
): SymbolAggregate[] {
  const map = new Map<string, SymbolAggregate>();

  for (const holding of holdings) {
    const symbolKey = holding.symbol.toUpperCase();
    const value = getHoldingValue(holding);

    let aggregate = map.get(symbolKey);
    if (!aggregate) {
      aggregate = {
        symbol: isCashHolding(holding) ? "CASH" : holding.symbol,
        description: holding.description,
        isCash: isCashHolding(holding),
        totalQuantity: 0,
        totalMarketValue: 0,
        accounts: [],
      };
      map.set(symbolKey, aggregate);
    }

    if (!aggregate.description && holding.description) {
      aggregate.description = holding.description;
    }

    aggregate.totalQuantity += holding.quantity;
    aggregate.totalMarketValue += value;
    aggregate.accounts.push({
      accountId: holding.accountId,
      quantity: holding.quantity,
      marketValue: value,
      price: holding.price,
    });
  }

  for (const aggregate of map.values()) {
    if (!aggregate.isCash && aggregate.totalQuantity > 0) {
      aggregate.weightedAvgPrice =
        aggregate.totalMarketValue / aggregate.totalQuantity;
    }
    aggregate.accounts.sort((a, b) => b.marketValue - a.marketValue);
  }

  return [...map.values()].sort((a, b) => {
    if (a.isCash) return 1;
    if (b.isCash) return -1;
    return b.totalMarketValue - a.totalMarketValue;
  });
}

export function computeAllocations(
  slices: Array<{ id: string; label: string; value: number }>,
  total?: number
): AllocationSlice[] {
  const sum = total ?? slices.reduce((acc, slice) => acc + slice.value, 0);
  if (sum <= 0) {
    return slices.map((slice) => ({ ...slice, percent: 0 }));
  }
  return slices.map((slice) => ({
    ...slice,
    percent: (slice.value / sum) * 100,
  }));
}

export function holdingsTotalValue(holdings: HoldingRecord[]): number {
  return holdings.reduce((sum, h) => sum + getHoldingValue(h), 0);
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
