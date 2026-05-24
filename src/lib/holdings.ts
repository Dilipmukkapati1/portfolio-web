export type InvestmentCategory =
  | "cash"
  | "stock"
  | "etf"
  | "mutual_fund"
  | "bond"
  | "other";

export const INVESTMENT_CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  cash: "Cash",
  stock: "Stock",
  etf: "ETF",
  mutual_fund: "Mutual Fund",
  bond: "Bond",
  other: "Other",
};

/** Dashboard-friendly labels for allocation breakdowns. */
export const DASHBOARD_CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  cash: "Cash",
  stock: "Stocks",
  etf: "Index Funds & ETFs",
  mutual_fund: "Mutual Funds",
  bond: "Bonds",
  other: "Other",
};

export type HoldingRecord = {
  holdingId: string;
  accountId: string;
  symbol: string;
  description?: string;
  quantity: number;
  price?: number;
  marketValue?: number;
  currency?: string;
  category?: InvestmentCategory;
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
  category: InvestmentCategory;
  categoryLabel: string;
  totalQuantity: number;
  totalMarketValue: number;
  weightedAvgPrice?: number;
  accounts: SymbolAccountBreakdown[];
};

export type CategorySection = {
  category: InvestmentCategory;
  label: string;
  totalMarketValue: number;
  symbols: SymbolAggregate[];
};

export type AllocationSlice = {
  id: string;
  label: string;
  value: number;
  percent: number;
};

const INVESTMENT_CATEGORY_ORDER: InvestmentCategory[] = [
  "etf",
  "stock",
  "mutual_fund",
  "bond",
  "cash",
  "other",
];

export function investmentCategoryLabel(
  category: InvestmentCategory
): string {
  return INVESTMENT_CATEGORY_LABELS[category];
}

export function normalizeInvestmentCategory(
  value?: string | null
): InvestmentCategory {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (
    normalized === "cash" ||
    normalized === "stock" ||
    normalized === "etf" ||
    normalized === "mutual_fund" ||
    normalized === "bond" ||
    normalized === "other"
  ) {
    return normalized;
  }
  return "other";
}

export function categorizeInvestment(input: {
  symbol: string;
  description?: string;
}): InvestmentCategory {
  const symbol = input.symbol.trim().toUpperCase();
  if (symbol === "CASH") return "cash";

  const description = (input.description ?? "").trim();
  const haystack = `${description} ${symbol}`.toLowerCase();

  if (
    /\b(etf|exchange[- ]traded fund)\b/i.test(description) ||
    haystack.includes(" etf")
  ) {
    return "etf";
  }

  if (
    /\bmutual fund\b/i.test(description) ||
    (/\bfund\b/i.test(description) &&
      !/\betf\b/i.test(description) &&
      (/\b(index|target date|retirement|income)\b/i.test(description) ||
        /\b(class [a-z0-9]|investor|admiral|institutional|idx)\b/i.test(
          description
        )))
  ) {
    return "mutual_fund";
  }

  if (
    /\b(bond|fixed income|treasury|treas\.|t-bill|t-note|municipal)\b/i.test(
      haystack
    ) &&
    !/\bfund\b/i.test(description)
  ) {
    return "bond";
  }

  if (/\bmoney market\b/i.test(description)) return "cash";

  if (symbol && !symbol.includes(" ")) return "stock";

  return "other";
}

export function resolveHoldingCategory(
  holding: HoldingRecord
): InvestmentCategory {
  if (holding.category) return holding.category;
  return categorizeInvestment({
    symbol: holding.symbol,
    description: holding.description,
  });
}

export function parseHoldings(
  raw: Array<Record<string, unknown>>
): HoldingRecord[] {
  return raw.map((h) => {
    const categoryValue = h.category ? String(h.category) : undefined;
    return {
      holdingId: String(h.holdingId ?? h.id),
      accountId: String(h.accountId),
      symbol: String(h.symbol),
      description: h.description ? String(h.description) : undefined,
      quantity: Number(h.quantity) || 0,
      price: h.price != null ? Number(h.price) : undefined,
      marketValue: h.marketValue != null ? Number(h.marketValue) : undefined,
      currency: h.currency ? String(h.currency) : undefined,
      category: categoryValue
        ? normalizeInvestmentCategory(categoryValue)
        : undefined,
    };
  });
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
    const category = resolveHoldingCategory(holding);

    let aggregate = map.get(symbolKey);
    if (!aggregate) {
      aggregate = {
        symbol: isCashHolding(holding) ? "CASH" : holding.symbol,
        description: holding.description,
        isCash: isCashHolding(holding),
        category,
        categoryLabel: investmentCategoryLabel(category),
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

export function groupHoldingsByCategory(
  holdings: HoldingRecord[]
): CategorySection[] {
  const byCategory = new Map<InvestmentCategory, HoldingRecord[]>();

  for (const holding of holdings) {
    const category = resolveHoldingCategory(holding);
    const list = byCategory.get(category) ?? [];
    list.push(holding);
    byCategory.set(category, list);
  }

  const sections: CategorySection[] = [];

  for (const category of INVESTMENT_CATEGORY_ORDER) {
    const categoryHoldings = byCategory.get(category);
    if (!categoryHoldings?.length) continue;

    const symbols = groupHoldingsBySymbol(categoryHoldings);
    sections.push({
      category,
      label: investmentCategoryLabel(category),
      totalMarketValue: symbols.reduce(
        (sum, symbol) => sum + symbol.totalMarketValue,
        0
      ),
      symbols,
    });
  }

  return sections.sort((a, b) => {
    if (a.category === "cash") return 1;
    if (b.category === "cash") return -1;
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
  if (holding.symbol.toUpperCase() === "CASH") return true;
  return resolveHoldingCategory(holding) === "cash";
}

/** Non-cash security positions (brokerage). */
export function hasSecurities(holdings: HoldingRecord[]): boolean {
  return holdings.some(
    (h) =>
      !isCashHolding(h) &&
      ((h.marketValue ?? 0) > 0 || (h.quantity ?? 0) > 0)
  );
}
