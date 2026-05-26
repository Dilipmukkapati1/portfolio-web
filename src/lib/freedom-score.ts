import type { Member } from "@/lib/household-types";

export const INVESTMENT_PASSIVE_INCOME_TYPES = ["interest", "dividends"] as const;

export type InvestmentPassiveIncomeType =
  (typeof INVESTMENT_PASSIVE_INCOME_TYPES)[number];

export const SAFE_WITHDRAWAL_RATE = 0.04;

export function sumMemberPassiveIncome(members: Member[]): number {
  let total = 0;
  for (const member of members) {
    if (!member.isActive) continue;
    for (const line of member.incomeSources) {
      if (
        INVESTMENT_PASSIVE_INCOME_TYPES.includes(
          line.type as InvestmentPassiveIncomeType
        )
      ) {
        total += line.amount;
      }
    }
  }
  return total;
}

export interface FreedomScoreInput {
  totalInvestments: number;
  monthlySpend: number;
  memberPassiveIncomeAnnual: number;
}

export interface FreedomScoreResult {
  score: number | null;
  annualIncome: number;
  annualExpenses: number;
}

export function computeFreedomScore({
  totalInvestments,
  monthlySpend,
  memberPassiveIncomeAnnual,
}: FreedomScoreInput): FreedomScoreResult {
  const annualExpenses = monthlySpend * 12;
  const withdrawalIncome = totalInvestments * SAFE_WITHDRAWAL_RATE;
  const annualIncome = withdrawalIncome + memberPassiveIncomeAnnual;

  if (monthlySpend <= 0) {
    return { score: null, annualIncome, annualExpenses };
  }

  const raw = Math.round((annualIncome / annualExpenses) * 100);
  const score = Math.min(100, Math.max(0, raw));

  return { score, annualIncome, annualExpenses };
}
