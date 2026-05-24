import { describe, expect, it } from "vitest";
import type { HoldingRecord } from "./holdings.js";
import {
  isBankAccount,
  isCreditAccount,
  isInvestmentAccount,
  summarizeAccounts,
} from "./accounts.js";
import type { AccountRecord } from "./types.js";

function account(
  overrides: Partial<AccountRecord> & Pick<AccountRecord, "accountId">
): AccountRecord {
  return {
    displayName: "Account",
    source: "simplefin",
    balance: 0,
    ...overrides,
  };
}

describe("summarizeAccounts", () => {
  it("sums only bank balances for total assets", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: 5000,
        displayName: "Checking",
      }),
      account({
        accountId: "2",
        accountType: "investment",
        balance: 100_000,
        displayName: "Brokerage",
      }),
      account({
        accountId: "3",
        source: "snaptrade",
        accountType: "investment",
        balance: 50_000,
        displayName: "SnapTrade IRA",
      }),
    ];
    const summary = summarizeAccounts(accounts);
    expect(summary.totalAssets).toBe(5000);
    expect(summary.totalCredit).toBe(0);
    expect(summary.netTotal).toBe(5000);
  });

  it("sums only credit card and loan balances for total credit", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: 10_000,
      }),
      account({
        accountId: "2",
        accountType: "credit",
        balance: -2500,
        displayName: "Chase Visa",
      }),
      account({
        accountId: "3",
        accountType: "loan",
        balance: 150_000,
        displayName: "Mortgage",
      }),
    ];
    const summary = summarizeAccounts(accounts);
    expect(summary.totalAssets).toBe(10_000);
    expect(summary.totalCredit).toBe(152_500);
    expect(summary.netTotal).toBe(-142_500);
  });

  it("shows checking accounts mis-tagged as investment when they have no securities", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "investment",
        balance: 2500,
        displayName: "Everyday Checking",
      }),
    ];
    const summary = summarizeAccounts(accounts, new Map());
    expect(summary.bankAccounts).toHaveLength(1);
    expect(summary.investmentAccounts).toHaveLength(0);
  });

  it("hides brokerage accounts that have security positions", () => {
    const accounts = [
      account({
        accountId: "2",
        accountType: "investment",
        balance: 50_000,
        displayName: "Brokerage",
      }),
    ];
    const holdings = new Map<string, HoldingRecord[]>([
      [
        "2",
        [
          {
            holdingId: "h1",
            accountId: "2",
            symbol: "VOO",
            quantity: 10,
            marketValue: 40_000,
          },
        ],
      ],
    ]);
    expect(isInvestmentAccount(accounts[0], holdings)).toBe(true);
    expect(isBankAccount(accounts[0], holdings)).toBe(false);
    const summary = summarizeAccounts(accounts, holdings);
    expect(summary.bankAccounts).toHaveLength(0);
    expect(summary.investmentAccounts).toHaveLength(1);
  });

  it("excludes investment accounts from bank totals", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: 1000,
      }),
      account({
        accountId: "2",
        accountType: "investment",
        balance: 40_500,
        displayName: "Brokerage",
      }),
    ];
    const summary = summarizeAccounts(accounts);
    expect(summary.totalAssets).toBe(1000);
    expect(summary.netTotal).toBe(1000);
    expect(summary.investmentAccounts).toHaveLength(1);
  });

  it("counts simplefin accounts without accountType as bank cash", () => {
    const accounts = [
      account({
        accountId: "1",
        source: "simplefin",
        balance: 3200,
        displayName: "Premier Plus",
      }),
    ];
    const summary = summarizeAccounts(accounts);
    expect(summary.totalAssets).toBe(3200);
    expect(summary.netTotal).toBe(3200);
  });

  it("returns zero bank totals when only brokerage accounts exist", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "investment",
        balance: 75_000,
        displayName: "Individual Brokerage",
      }),
    ];
    const summary = summarizeAccounts(accounts);
    expect(summary.totalAssets).toBe(0);
    expect(summary.totalCredit).toBe(0);
    expect(summary.netTotal).toBe(0);
    expect(summary.totalInvestments).toBe(75_000);
    expect(summary.investmentAccounts).toHaveLength(1);
  });

  it("lists brokerage by accountType even when the name is generic", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "investment",
        balance: 12_000,
        displayName: "Individual",
      }),
    ];
    expect(isInvestmentAccount(accounts[0])).toBe(true);
    const summary = summarizeAccounts(accounts);
    expect(summary.investmentAccounts).toHaveLength(1);
    expect(summary.bankAccounts).toHaveLength(0);
  });

  it("uses holdings value for investment account totals when synced", () => {
    const accounts = [
      account({
        accountId: "2",
        accountType: "investment",
        balance: 50_000,
        displayName: "Brokerage",
      }),
    ];
    const holdings = new Map<string, HoldingRecord[]>([
      [
        "2",
        [
          {
            holdingId: "h1",
            accountId: "2",
            symbol: "VOO",
            quantity: 10,
            marketValue: 42_000,
          },
          {
            holdingId: "h2",
            accountId: "2",
            symbol: "CASH",
            quantity: 8000,
            marketValue: 8000,
          },
        ],
      ],
    ]);
    const summary = summarizeAccounts(accounts, holdings);
    expect(summary.totalInvestments).toBe(50_000);
  });
});

describe("isBankAccount", () => {
  it("does not treat negative checking as a credit card", () => {
    expect(
      isBankAccount(
        account({
          accountId: "1",
          accountType: "depository",
          balance: -200,
          displayName: "Checking",
        })
      )
    ).toBe(true);
    expect(
      isCreditAccount(
        account({
          accountId: "1",
          accountType: "depository",
          balance: -200,
          displayName: "Checking",
        })
      )
    ).toBe(false);
  });
});
