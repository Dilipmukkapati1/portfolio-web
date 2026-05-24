import {
  hasSecurities,
  holdingsTotalValue,
  type HoldingRecord,
} from "@/lib/holdings";
import type { AccountRecord } from "@/lib/types";

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

/** Balance shown on account tiles (uses synced positions when present). */
export function accountDisplayBalance(
  account: AccountRecord,
  holdingsByAccount?: Map<string, HoldingRecord[]>
): number {
  const holdings = holdingsByAccount?.get(account.accountId);
  if (holdings && holdings.length > 0) {
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

  const bankNet = bankAccounts.reduce(
    (sum, a) => sum + (a.balance ?? 0),
    0
  );
  const totalInvestments = investmentAccounts.reduce(
    (sum, a) => sum + accountDisplayBalance(a, holdingsByAccount),
    0
  );
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
  };
}
