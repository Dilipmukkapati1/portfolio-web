import { describe, expect, it } from "vitest";
import type { HoldingRecord } from "./holdings.js";
import {
  accountSignedValue,
  buildAccountNameMap,
  computeUninvestedCash,
  formatAccountDisplayName,
  groupAccountsByOwner,
  investmentAccountCashBalance,
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

  it("uses holdings-aware balances for bank cash totals", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: 1_000,
        displayName: "Checking",
      }),
      account({
        accountId: "2",
        accountType: "investment",
        balance: 50_000,
        displayName: "Brokerage",
      }),
    ];
    const holdings = new Map<string, HoldingRecord[]>([
      [
        "1",
        [
          {
            holdingId: "h1",
            accountId: "1",
            symbol: "CASH",
            quantity: 5_000,
            marketValue: 5_000,
          },
        ],
      ],
      [
        "2",
        [
          {
            holdingId: "h2",
            accountId: "2",
            symbol: "VOO",
            quantity: 10,
            marketValue: 42_000,
          },
          {
            holdingId: "h3",
            accountId: "2",
            symbol: "CASH",
            quantity: 8_000,
            marketValue: 8_000,
          },
        ],
      ],
    ]);

    const summary = summarizeAccounts(accounts, holdings);
    expect(summary.totalAssets).toBe(5_000);
    expect(summary.totalUninvestedCash).toBe(13_000);
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

describe("groupAccountsByOwner", () => {
  const members = [
    {
      id: "m1",
      name: "Dilip Mukkapati",
      relationship: "self" as const,
      isActive: true,
    },
    {
      id: "m2",
      name: "Alex Spouse",
      relationship: "spouse" as const,
      isActive: true,
    },
  ];

  it("groups bank and investment accounts under the same owner", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: 5_000,
        displayName: "Checking",
        ownerMemberId: "m1",
      }),
      account({
        accountId: "2",
        accountType: "investment",
        balance: 40_000,
        displayName: "Brokerage",
        ownerMemberId: "m1",
      }),
      account({
        accountId: "3",
        accountType: "depository",
        balance: 2_000,
        displayName: "Savings",
        ownerMemberId: "m2",
      }),
    ];

    const sections = groupAccountsByOwner(accounts, members);
    expect(sections).toHaveLength(2);
    expect(sections[0]?.memberName).toBe("Dilip Mukkapati");
    expect(sections[0]?.accounts).toHaveLength(2);
    expect(sections[0]?.totalValue).toBe(45_000);
    expect(sections[1]?.memberName).toBe("Alex Spouse");
    expect(sections[1]?.totalValue).toBe(2_000);
  });

  it("returns negative signed values for credit accounts", () => {
    expect(
      accountSignedValue(
        account({
          accountId: "c1",
          accountType: "credit",
          balance: -1_500,
          displayName: "Visa",
        })
      )
    ).toBe(-1_500);
  });
});

describe("formatAccountDisplayName", () => {
  it("prefixes account names with owner initials", () => {
    expect(formatAccountDisplayName("Checking", "DM")).toBe("DM-Checking");
  });

  it("does not double-prefix existing labels", () => {
    expect(formatAccountDisplayName("DM-Checking", "DM")).toBe("DM-Checking");
  });
});

describe("buildAccountNameMap", () => {
  it("maps account ids to prefixed display names", () => {
    const names = buildAccountNameMap(
      [
        account({
          accountId: "1",
          displayName: "Checking",
          ownerMemberId: "m1",
        }),
      ],
      [{ id: "m1", name: "Dilip Mukkapati" }]
    );
    expect(names.get("1")).toBe("DM-Checking");
  });
});

describe("computeUninvestedCash", () => {
  it("sums bank cash and brokerage cash holdings", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: 5_000,
        displayName: "Checking",
      }),
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
            quantity: 8_000,
            marketValue: 8_000,
          },
        ],
      ],
    ]);

    expect(computeUninvestedCash(accounts, holdings)).toBe(13_000);
  });

  it("uses brokerage balance when no holdings are synced", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "investment",
        balance: 12_000,
        displayName: "Brokerage",
      }),
    ];

    expect(computeUninvestedCash(accounts)).toBe(12_000);
  });

  it("counts residual cash when securities exist but no CASH holding row", () => {
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
        ],
      ],
    ]);

    expect(computeUninvestedCash(accounts, holdings)).toBe(8_000);
    expect(investmentAccountCashBalance(accounts[0], holdings.get("2")!)).toBe(
      8_000
    );
  });

  it("counts CASH holdings on bank accounts instead of skipping them", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: 5_000,
        displayName: "Checking",
      }),
      account({
        accountId: "2",
        accountType: "investment",
        balance: 10_000,
        displayName: "Brokerage",
      }),
    ];
    const holdings = new Map<string, HoldingRecord[]>([
      [
        "1",
        [
          {
            holdingId: "h1",
            accountId: "1",
            symbol: "CASH",
            quantity: 5_000,
            marketValue: 5_000,
          },
        ],
      ],
    ]);

    expect(computeUninvestedCash(accounts, holdings)).toBe(15_000);
  });

  it("does not count negative bank balances as uninvested cash", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: -200,
        displayName: "Checking",
      }),
      account({
        accountId: "2",
        accountType: "investment",
        balance: 1_000,
        displayName: "Brokerage",
      }),
    ];

    expect(computeUninvestedCash(accounts)).toBe(1_000);
  });

  it("uses residual cash when a stale CASH row undercounts balance", () => {
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
            quantity: 0,
            marketValue: 0,
          },
        ],
      ],
    ]);

    expect(computeUninvestedCash(accounts, holdings)).toBe(8_000);
    expect(investmentAccountCashBalance(accounts[0], holdings.get("2")!)).toBe(
      8_000
    );
  });

  it("ignores holdings tied to accounts that are not in the active list", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: 1_000,
        displayName: "Checking",
      }),
    ];
    const holdings = new Map<string, HoldingRecord[]>([
      [
        "inactive-2",
        [
          {
            holdingId: "h1",
            accountId: "inactive-2",
            symbol: "CASH",
            quantity: 99_000,
            marketValue: 99_000,
          },
        ],
      ],
    ]);

    expect(computeUninvestedCash(accounts, holdings)).toBe(1_000);
  });

  it("handles SnapTrade accounts with positions but no balance or CASH row", () => {
    const accounts = [
      account({
        accountId: "1",
        source: "snaptrade",
        accountType: "investment",
        balance: 0,
        displayName: "SnapTrade IRA",
      }),
    ];
    const holdings = new Map<string, HoldingRecord[]>([
      [
        "1",
        [
          {
            holdingId: "h1",
            accountId: "1",
            symbol: "AAPL",
            quantity: 10,
            marketValue: 2_000,
          },
        ],
      ],
    ]);

    expect(computeUninvestedCash(accounts, holdings)).toBe(0);
    expect(investmentAccountCashBalance(accounts[0], holdings.get("1")!)).toBe(
      0
    );
  });

  it("counts money market and category=cash holdings without a CASH symbol", () => {
    const accounts = [
      account({
        accountId: "1",
        source: "snaptrade",
        accountType: "investment",
        balance: 0,
        displayName: "SnapTrade IRA",
      }),
    ];
    const holdings = new Map<string, HoldingRecord[]>([
      [
        "1",
        [
          {
            holdingId: "h1",
            accountId: "1",
            symbol: "AAPL",
            quantity: 10,
            marketValue: 10_000,
          },
          {
            holdingId: "h2",
            accountId: "1",
            symbol: "VMFXX",
            description: "Vanguard Federal Money Market Fund",
            quantity: 1,
            marketValue: 2_260,
            category: "cash",
          },
        ],
      ],
    ]);

    expect(computeUninvestedCash(accounts, holdings)).toBe(2_260);
    expect(investmentAccountCashBalance(accounts[0], holdings.get("1")!)).toBe(
      2_260
    );
  });

  it("falls back to bank balance when holdings exist but none are cash", () => {
    const accounts = [
      account({
        accountId: "1",
        accountType: "depository",
        balance: 2_260,
        displayName: "Checking",
      }),
    ];
    const holdings = new Map<string, HoldingRecord[]>([
      [
        "1",
        [
          {
            holdingId: "h1",
            accountId: "1",
            symbol: "PENDING",
            quantity: 1,
            marketValue: 0,
          },
        ],
      ],
    ]);

    expect(computeUninvestedCash(accounts, holdings)).toBe(2_260);
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
