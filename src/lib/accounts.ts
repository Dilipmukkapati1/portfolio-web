import {
  getHoldingValue,
  hasSecurities,
  holdingsTotalValue,
  isCashHolding,
  type HoldingRecord,
} from "@/lib/holdings";
import type { AccountRecord } from "@/lib/types";
import { getInitials } from "@/lib/utils";

const BANK_ACCOUNT_TYPES = new Set(["depository", "checking", "savings"]);
const CREDIT_ACCOUNT_TYPES = new Set(["credit", "loan"]);

/** Checking/savings mis-tagged as investment by the aggregator. */
function isLikelyBankAccountName(displayName: string): boolean {
  const lower = displayName.toLowerCase();
  return (
    lower.includes("checking") ||
    lower.includes("chequing") ||
    lower.includes("savings") ||
    (lower.includes("cash") && !lower.includes("brokerage"))
  );
}

export function isInvestmentAccount(
  account: AccountRecord,
  holdingsByAccount?: Map<string, HoldingRecord[]>
): boolean {
  if (account.source === "snaptrade") return true;

  const holdings = holdingsByAccount?.get(account.accountId) ?? [];
  if (hasSecurities(holdings)) return true;

  const type = (account.accountType ?? "").toLowerCase();
  if (type !== "investment") return false;

  return !isLikelyBankAccountName(account.displayName);
}

/** Market value of non-cash positions in a brokerage account. */
export function investmentAccountSecuritiesBalance(
  account: AccountRecord,
  holdings: HoldingRecord[]
): number {
  if (holdings.length === 0) {
    return Math.max(account.balance ?? 0, 0);
  }

  const securitiesValue = holdings
    .filter((holding) => !isCashHolding(holding))
    .reduce((sum, holding) => sum + getHoldingValue(holding), 0);

  if (hasSecurities(holdings)) {
    return securitiesValue;
  }

  return 0;
}

/** Full brokerage account value (securities + cash in the account). */
export function investmentAccountTotalBalance(
  account: AccountRecord,
  holdings: HoldingRecord[]
): number {
  if (holdings.length === 0) {
    return Math.max(account.balance ?? 0, 0);
  }

  return (
    investmentAccountSecuritiesBalance(account, holdings) +
    investmentAccountCashBalance(account, holdings)
  );
}

/** Balance shown on account tiles (uses synced positions when present). */
export function accountDisplayBalance(
  account: AccountRecord,
  holdingsByAccount?: Map<string, HoldingRecord[]>
): number {
  const holdings = holdingsByAccount?.get(account.accountId) ?? [];

  if (isInvestmentAccount(account, holdingsByAccount)) {
    return investmentAccountTotalBalance(account, holdings);
  }

  if (holdings.length > 0) {
    return holdingsTotalValue(holdings);
  }

  return Math.max(account.balance ?? 0, 0);
}

export function isCreditAccount(account: AccountRecord): boolean {
  const type = (account.accountType ?? "").toLowerCase();
  if (CREDIT_ACCOUNT_TYPES.has(type)) return true;
  if (BANK_ACCOUNT_TYPES.has(type) || type === "investment") return false;

  const name = account.displayName.toLowerCase();
  return (
    name.includes("credit card") ||
    name.includes(" visa") ||
    name.includes(" mastercard") ||
    name.includes(" amex") ||
    name.includes("mortgage")
  );
}

/** Cash at banks (checking/savings). Excludes brokerage, SnapTrade, and credit. */
export function isBankAccount(
  account: AccountRecord,
  holdingsByAccount?: Map<string, HoldingRecord[]>
): boolean {
  if (isInvestmentAccount(account, holdingsByAccount)) return false;
  if (isCreditAccount(account)) return false;
  if (account.source === "snaptrade") return false;

  const type = (account.accountType ?? "").toLowerCase();
  if (BANK_ACCOUNT_TYPES.has(type)) return true;
  if (type === "credit" || type === "loan") return false;

  // SimpleFIN names often omit "checking" — show unless classified as investment above.
  if (account.source === "simplefin" || account.source === "manual") {
    return true;
  }

  return false;
}

export function creditBalance(account: AccountRecord): number {
  return Math.abs(account.balance ?? 0);
}

export function summarizeAccounts(
  accounts: AccountRecord[],
  holdingsByAccount?: Map<string, HoldingRecord[]>
) {
  const bankAccounts = accounts.filter((a) =>
    isBankAccount(a, holdingsByAccount)
  );
  const creditAccounts = accounts.filter(
    (a) =>
      isCreditAccount(a) && !isInvestmentAccount(a, holdingsByAccount)
  );
  const investmentAccounts = accounts.filter((a) =>
    isInvestmentAccount(a, holdingsByAccount)
  );

  const bankNet = bankAccounts.reduce((sum, a) => {
    const holdings = holdingsByAccount?.get(a.accountId) ?? [];
    return sum + bankAccountCashBalance(a, holdings);
  }, 0);
  const totalInvestments = investmentAccounts.reduce((sum, a) => {
    const holdings = holdingsByAccount?.get(a.accountId) ?? [];
    return sum + investmentAccountSecuritiesBalance(a, holdings);
  }, 0);
  const totalAssets = Math.max(bankNet, 0);
  const totalCredit = creditAccounts.reduce(
    (sum, a) => sum + creditBalance(a),
    0
  );
  const netTotal = bankNet - totalCredit;

  return {
    bankAccounts,
    creditAccounts,
    investmentAccounts,
    /** @deprecated use bankAccounts */
    assetAccounts: bankAccounts,
    totalAssets,
    totalInvestments,
    totalCredit,
    netTotal,
    totalUninvestedCash: computeUninvestedCash(accounts, holdingsByAccount),
  };
}

export type AccountsByOwnerSection = {
  memberId: string | null;
  memberName: string;
  accounts: AccountRecord[];
  totalValue: number;
};

const MEMBER_SECTION_ORDER = ["self", "spouse", "dependent", "other"] as const;

/** Signed balance for grouping: assets positive, credit negative. */
export function accountSignedValue(
  account: AccountRecord,
  holdingsByAccount?: Map<string, HoldingRecord[]>
): number {
  if (isCreditAccount(account)) return -creditBalance(account);
  return accountDisplayBalance(account, holdingsByAccount);
}

export function resolveAccountOwnerMemberId(
  account: AccountRecord,
  members: Array<{
    id: string;
    name: string;
    isActive?: boolean;
    relationship?: string;
  }>
): string | undefined {
  return (
    account.ownerMemberId ??
    resolveOwnerMemberId(account.connectionLabel, members)
  );
}

export function groupAccountsByOwner(
  accounts: AccountRecord[],
  members: Array<{
    id: string;
    name: string;
    isActive?: boolean;
    relationship?: string;
  }>,
  holdingsByAccount?: Map<string, HoldingRecord[]>
): AccountsByOwnerSection[] {
  const activeMembers = members.filter((member) => member.isActive !== false);
  const buckets = new Map<string | null, AccountRecord[]>();

  for (const account of accounts) {
    const ownerId = resolveAccountOwnerMemberId(account, members) ?? null;
    const bucket = buckets.get(ownerId) ?? [];
    bucket.push(account);
    buckets.set(ownerId, bucket);
  }

  const sortAccounts = (list: AccountRecord[]) =>
    [...list].sort((a, b) => {
      const creditA = isCreditAccount(a);
      const creditB = isCreditAccount(b);
      if (creditA !== creditB) return creditA ? 1 : -1;
      const investA = isInvestmentAccount(a, holdingsByAccount);
      const investB = isInvestmentAccount(b, holdingsByAccount);
      if (investA !== investB) return investA ? 1 : -1;
      return a.displayName.localeCompare(b.displayName);
    });

  const buildSection = (
    memberId: string | null,
    memberName: string,
    list: AccountRecord[]
  ): AccountsByOwnerSection => ({
    memberId,
    memberName,
    accounts: sortAccounts(list),
    totalValue: list.reduce(
      (sum, account) =>
        sum + accountSignedValue(account, holdingsByAccount),
      0
    ),
  });

  const sections: AccountsByOwnerSection[] = [];

  const sortedMembers = [...activeMembers].sort((a, b) => {
    const ai = MEMBER_SECTION_ORDER.indexOf(
      a.relationship as (typeof MEMBER_SECTION_ORDER)[number]
    );
    const bi = MEMBER_SECTION_ORDER.indexOf(
      b.relationship as (typeof MEMBER_SECTION_ORDER)[number]
    );
    const orderA = ai === -1 ? MEMBER_SECTION_ORDER.length : ai;
    const orderB = bi === -1 ? MEMBER_SECTION_ORDER.length : bi;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  for (const member of sortedMembers) {
    const list = buckets.get(member.id);
    if (!list?.length) continue;
    sections.push(buildSection(member.id, member.name, list));
    buckets.delete(member.id);
  }

  const unassigned = buckets.get(null);
  if (unassigned?.length) {
    sections.push(buildSection(null, "Unassigned", unassigned));
  }

  for (const [memberId, list] of buckets) {
    if (!list.length) continue;
    const member = activeMembers.find((m) => m.id === memberId);
    sections.push(
      buildSection(memberId, member?.name ?? "Other", list)
    );
  }

  return sections;
}

function resolveOwnerMemberId(
  connectionLabel: string | undefined,
  members: Array<{ id: string; name: string; isActive?: boolean; relationship?: string }>
): string | undefined {
  const label = connectionLabel?.trim();
  if (!label) return undefined;

  const lower = label.toLowerCase();
  const active = members.filter((member) => member.isActive !== false);
  if (active.length === 0) return undefined;

  for (const member of active) {
    const name = member.name.trim();
    const nameLower = name.toLowerCase();
    if (
      lower === nameLower ||
      lower.includes(nameLower) ||
      nameLower.includes(lower)
    ) {
      return member.id;
    }
    const first = name.split(/\s+/)[0]?.toLowerCase();
    if (first && first.length >= 2 && lower.includes(first)) {
      return member.id;
    }
  }

  if (active.length === 1) return active[0]!.id;
  return active.find((member) => member.relationship === "self")?.id;
}

export function formatAccountDisplayName(
  displayName: string,
  ownerInitials?: string
): string {
  const trimmed = displayName.trim();
  if (!ownerInitials) return trimmed;
  const prefix = `${ownerInitials}-`;
  if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) return trimmed;
  return `${ownerInitials}-${trimmed}`;
}

export function buildAccountNameMap(
  accounts: AccountRecord[],
  members: Array<{
    id: string;
    name: string;
    isActive?: boolean;
    relationship?: string;
  }>
): Map<string, string> {
  const initialsByMember = new Map(
    members.map((member) => [member.id, getInitials(member.name)] as const)
  );
  const names = new Map<string, string>();
  for (const account of accounts) {
    const ownerId = resolveAccountOwnerMemberId(account, members);
    const initials = ownerId ? initialsByMember.get(ownerId) : undefined;
    names.set(
      account.accountId,
      formatAccountDisplayName(account.displayName, initials)
    );
  }
  return names;
}

/** Bank cash + investments − credit (full household net worth). */
export function computeNetWorth(
  accounts: AccountRecord[],
  holdingsByAccount?: Map<string, HoldingRecord[]>
): number {
  const summary = summarizeAccounts(accounts, holdingsByAccount);
  return (
    summary.totalUninvestedCash +
    summary.totalInvestments -
    summary.totalCredit
  );
}

/** Cash in an investment account (CASH rows or balance minus securities). */
export function investmentAccountCashBalance(
  account: AccountRecord,
  holdings: HoldingRecord[]
): number {
  if (holdings.length === 0) {
    return 0;
  }

  const cashFromHoldings = holdings
    .filter(isCashHolding)
    .reduce((sum, holding) => sum + getHoldingValue(holding), 0);

  const securitiesValue = holdings
    .filter((holding) => !isCashHolding(holding))
    .reduce((sum, holding) => sum + getHoldingValue(holding), 0);

  if (hasSecurities(holdings)) {
    const balance = account.balance ?? 0;
    const residual =
      balance > 0 ? Math.max(0, balance - securitiesValue) : 0;
    return Math.max(cashFromHoldings, residual);
  }

  return Math.max(cashFromHoldings, Math.max(account.balance ?? 0, 0));
}

function bankAccountCashBalance(
  account: AccountRecord,
  holdings: HoldingRecord[]
): number {
  if (holdings.length === 0) {
    return Math.max(account.balance ?? 0, 0);
  }

  const cashFromHoldings = holdings
    .filter(isCashHolding)
    .reduce((sum, holding) => sum + getHoldingValue(holding), 0);

  if (cashFromHoldings > 0) return cashFromHoldings;

  return Math.max(account.balance ?? 0, 0);
}

/** Bank balances plus cash sitting in brokerage accounts. */
export function computeUninvestedCash(
  accounts: AccountRecord[],
  holdingsByAccount?: Map<string, HoldingRecord[]>
): number {
  let total = 0;

  for (const account of accounts) {
    if (isCreditAccount(account)) continue;

    const holdings = holdingsByAccount?.get(account.accountId) ?? [];

    if (isInvestmentAccount(account, holdingsByAccount)) {
      total += investmentAccountCashBalance(account, holdings);
      continue;
    }

    if (isBankAccount(account, holdingsByAccount)) {
      total += bankAccountCashBalance(account, holdings);
    }
  }

  return total;
}
