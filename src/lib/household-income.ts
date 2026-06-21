import {
  resolveMemberContributionAmount,
  resolveMemberIncomeAmounts,
} from "@portfolio/contracts";
import type { Member as ContractsMember } from "@portfolio/contracts";
import type {
  ContributionLineItem,
  IncomeLineItem,
  MemberDraft,
} from "@/lib/household-types";

type MemberIncomeLike = {
  incomeSources?: IncomeLineItem[];
};

type MemberContributionsLike = MemberIncomeLike & {
  contributions?: ContributionLineItem[];
};

function asContractsMember(member: MemberIncomeLike): ContractsMember {
  return { incomeSources: member.incomeSources ?? [] } as ContractsMember;
}

/** Annual income including resolved % bonus and other line items. */
export function resolvedMemberIncomeTotal(member: MemberIncomeLike): number {
  const resolved = resolveMemberIncomeAmounts(asContractsMember(member));
  let total = resolved.wages + resolved.bonus + resolved.cashIncome;
  for (const line of member.incomeSources ?? []) {
    if (
      line.type === "wages" ||
      line.type === "bonus" ||
      line.type === "cash_income"
    ) {
      continue;
    }
    total += line.amount;
  }
  return total;
}

/** Sum of resolved annual income across active members. */
export function resolvedHouseholdIncomeTotal(
  members: Array<MemberIncomeLike & { isActive?: boolean }>
): number {
  return members
    .filter((m) => m.isActive !== false)
    .reduce((sum, member) => sum + resolvedMemberIncomeTotal(member), 0);
}

export type HouseholdIncomeBreakdown = {
  total: number;
  wages: number;
  bonus: number;
  cashIncome: number;
  other: number;
  earnerCount: number;
};

/** Aggregate income by category across active members. */
export function resolveHouseholdIncomeBreakdown(
  members: Array<MemberIncomeLike & { isActive?: boolean }>
): HouseholdIncomeBreakdown {
  const active = members.filter((m) => m.isActive !== false);
  let wages = 0;
  let bonus = 0;
  let cashIncome = 0;
  let other = 0;
  let earnerCount = 0;

  for (const member of active) {
    const resolved = resolveMemberIncomeAmounts(asContractsMember(member));
    const memberTotal = resolvedMemberIncomeTotal(member);
    wages += resolved.wages;
    bonus += resolved.bonus;
    cashIncome += resolved.cashIncome;
    other += memberTotal - resolved.wages - resolved.bonus - resolved.cashIncome;
    if (memberTotal > 0) earnerCount += 1;
  }

  return {
    total: wages + bonus + cashIncome + other,
    wages,
    bonus,
    cashIncome,
    other,
    earnerCount,
  };
}

/** Annual contributions including resolved % employer match. */
export function resolvedMemberContributionTotal(
  member: MemberContributionsLike
): number {
  return (member.contributions ?? []).reduce(
    (sum, line) =>
      sum + resolveMemberContributionAmount(asContractsMember(member), line),
    0
  );
}

export function resolvedBonusAmount(member: MemberIncomeLike): number {
  return resolveMemberIncomeAmounts(asContractsMember(member)).bonus;
}

export function resolvedWagesAmount(member: MemberIncomeLike): number {
  return resolveMemberIncomeAmounts(asContractsMember(member)).wages;
}

export function resolvedEmployerMatchAmount(
  member: MemberContributionsLike,
  line: ContributionLineItem
): number {
  return resolveMemberContributionAmount(asContractsMember(member), line);
}

export type { MemberDraft };
